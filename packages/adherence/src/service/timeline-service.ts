/**
 * Patient-facing timeline and medication APIs.
 *
 * All functions require a patient actor context.
 * Patients may only access their own data.
 */

import type { AnyActorContext } from "@thuocare/auth";
import { requirePatientActor } from "@thuocare/auth";

import type {
  GetTimelineInput,
  GetTimelineRangeInput,
  MarkDoseSkippedInput,
  MarkDoseTakenInput,
  MedicationAdherenceLogRow,
} from "../domain/types.js";
import type {
  ActiveMedicationVM,
  DailyTimelineVM,
} from "../domain/view-models.js";
import { AdherenceError } from "../errors/adherence-errors.js";
import {
  findLogsByPatientAndDate,
  findLogsByPatientAndDateRange,
  upsertAdherenceLog,
} from "../repository/adherence-repo.js";
import {
  findActiveItemsForPatientInRange,
  findActiveItemsForPatientOnDate,
  findAllActiveItemsForPatient,
} from "../repository/item-repo.js";
import { expandScheduleForDate, expandSchedulesForDateRange } from "../timeline/schedule-expander.js";
import {
  buildActiveMedications,
  buildDailyTimeline,
  buildTimelineRange,
} from "../timeline/timeline-builder.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

// ─── Internal helpers ─────────────────────────────────────────────────────────

function nowIsoDateTime(): string {
  return new Date().toISOString().replace("T", "T").slice(0, 19);
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Timeline APIs ────────────────────────────────────────────────────────────

/**
 * Get the medication timeline for a single date.
 * Returns a DailyTimelineVM with all scheduled doses and their statuses.
 *
 * @param actorCtx  Must be a patient actor.
 * @param input     { patientId, date }
 */
export async function getPatientTimeline(
  client: AnyClient,
  actorCtx: AnyActorContext,
  input: GetTimelineInput,
): Promise<DailyTimelineVM> {
  const actor = requirePatientActor(actorCtx);

  // Patients may only see their own timeline
  if (actor.patientId !== input.patientId) {
    throw new AdherenceError("patient_mismatch", "Cannot view another patient's timeline");
  }

  const [items, logs] = await Promise.all([
    findActiveItemsForPatientOnDate(client, input.patientId, input.date),
    findLogsByPatientAndDate(client, input.patientId, input.date),
  ]);

  const slots = items.flatMap((item) => expandScheduleForDate(item, input.date));

  return buildDailyTimeline(input.date, slots, items, logs);
}

/**
 * Get the medication timeline for a date range (e.g., a week view).
 *
 * @param actorCtx  Must be a patient actor.
 * @param input     { patientId, startDate, endDate }
 */
export async function getPatientTimelineRange(
  client: AnyClient,
  actorCtx: AnyActorContext,
  input: GetTimelineRangeInput,
): Promise<DailyTimelineVM[]> {
  const actor = requirePatientActor(actorCtx);

  if (actor.patientId !== input.patientId) {
    throw new AdherenceError("patient_mismatch", "Cannot view another patient's timeline");
  }

  const [items, logs] = await Promise.all([
    findActiveItemsForPatientInRange(client, input.patientId, input.startDate, input.endDate),
    findLogsByPatientAndDateRange(client, input.patientId, input.startDate, input.endDate),
  ]);

  const slots = expandSchedulesForDateRange(items, input.startDate, input.endDate);

  return buildTimelineRange(input.startDate, input.endDate, slots, items, logs);
}

// ─── Mark taken / skipped ─────────────────────────────────────────────────────

/**
 * Mark a scheduled dose as taken.
 *
 * Upserts a log entry with status = 'taken'.
 * A dose can be re-marked (e.g., correcting a skip to a take).
 */
export async function markDoseTaken(
  client: AnyClient,
  actorCtx: AnyActorContext,
  input: MarkDoseTakenInput,
): Promise<MedicationAdherenceLogRow> {
  const actor = requirePatientActor(actorCtx);

  if (actor.patientId !== input.patientId) {
    throw new AdherenceError("patient_mismatch", "Cannot mark doses for another patient");
  }

  const scheduledDate = input.scheduledTime.slice(0, 10);
  const source = input.source ?? "patient";

  return upsertAdherenceLog(client, {
    organization_id: input.organizationId,
    patient_id: input.patientId,
    prescription_item_id: input.prescriptionItemId,
    scheduled_date: scheduledDate,
    scheduled_time: input.scheduledTime,
    actual_taken_time: input.actualTakenTime ?? nowIsoDateTime(),
    status: "taken",
    source,
    notes: input.notes ?? null,
  });
}

/**
 * Mark a scheduled dose as skipped.
 *
 * Upserts a log entry with status = 'skipped'.
 */
export async function markDoseSkipped(
  client: AnyClient,
  actorCtx: AnyActorContext,
  input: MarkDoseSkippedInput,
): Promise<MedicationAdherenceLogRow> {
  const actor = requirePatientActor(actorCtx);

  if (actor.patientId !== input.patientId) {
    throw new AdherenceError("patient_mismatch", "Cannot mark doses for another patient");
  }

  const scheduledDate = input.scheduledTime.slice(0, 10);
  const source = input.source ?? "patient";

  return upsertAdherenceLog(client, {
    organization_id: input.organizationId,
    patient_id: input.patientId,
    prescription_item_id: input.prescriptionItemId,
    scheduled_date: scheduledDate,
    scheduled_time: input.scheduledTime,
    actual_taken_time: null,
    status: "skipped",
    source,
    notes: input.notes ?? null,
  });
}

// ─── Active medications ───────────────────────────────────────────────────────

/**
 * Get the patient's current active medication list.
 * Includes PRN items. Used for the "My Medications" screen.
 */
export async function getActiveMedications(
  client: AnyClient,
  actorCtx: AnyActorContext,
  patientId: string,
): Promise<ActiveMedicationVM[]> {
  const actor = requirePatientActor(actorCtx);

  if (actor.patientId !== patientId) {
    throw new AdherenceError("patient_mismatch", "Cannot view another patient's medications");
  }

  const items = await findAllActiveItemsForPatient(client, patientId);
  const today = todayIsoDate();

  return buildActiveMedications(items, today);
}
