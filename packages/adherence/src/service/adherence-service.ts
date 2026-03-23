/**
 * Adherence analytics and system cron functions.
 *
 * - getAdherenceSummary: patient-facing; requires patient actor.
 * - processMissedDoses: system cron; must be called with service_role key (bypasses RLS).
 */

import type { AnyActorContext } from "@thuocare/auth";
import { requirePatientActor } from "@thuocare/auth";

import type { CreateAdherenceLogInput, ProcessMissedDosesInput } from "../domain/types.js";
import type { AdherenceSummaryVM } from "../domain/view-models.js";
import { AdherenceError } from "../errors/adherence-errors.js";
import {
  findLogsByPatientAndDateRange,
  insertMissedDoseLogs,
} from "../repository/adherence-repo.js";
import {
  findActiveItemsForPatientInRange,
  findActiveItemsForOrgInRange,
} from "../repository/item-repo.js";
import { findLogsByItemsAndDateRange } from "../repository/adherence-repo.js";
import { expandSchedulesForDateRange } from "../timeline/schedule-expander.js";
import { buildAdherenceSummary } from "../timeline/timeline-builder.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

// ─── Adherence summary ────────────────────────────────────────────────────────

/**
 * Compute adherence statistics for a patient over a date range.
 *
 * Based on resolved log rows (taken, missed, skipped).
 * Does not include doses that are still 'scheduled' (unresolved).
 *
 * @param actorCtx  Must be a patient actor.
 */
export async function getAdherenceSummary(
  client: AnyClient,
  actorCtx: AnyActorContext,
  patientId: string,
  startDate: string,
  endDate: string,
): Promise<AdherenceSummaryVM> {
  const actor = requirePatientActor(actorCtx);

  if (actor.patientId !== patientId) {
    throw new AdherenceError("patient_mismatch", "Cannot view another patient's summary");
  }

  const [items, logs] = await Promise.all([
    findActiveItemsForPatientInRange(client, patientId, startDate, endDate),
    findLogsByPatientAndDateRange(client, patientId, startDate, endDate),
  ]);

  return buildAdherenceSummary(patientId, startDate, endDate, logs, items);
}

// ─── Process missed doses (system cron) ───────────────────────────────────────

/**
 * Mark unresolved dose slots as 'missed' for an organization.
 *
 * IMPORTANT: Must be called with a service_role Supabase client — this function
 * bypasses RLS and operates across all patients in the organization.
 *
 * Algorithm:
 *   1. Compute the scan window: [cutoffTime - lookbackHours, cutoffTime]
 *   2. Load all active non-PRN items for the org within the scan window
 *   3. Expand schedules to get all dose slots in the window
 *   4. Load existing adherence logs for those items in the window
 *   5. For any slot that:
 *        - falls before cutoffTime, AND
 *        - has no existing log entry
 *      → insert a missed log row (source = 'system')
 *
 * @returns processedCount — number of missed dose rows inserted
 */
export async function processMissedDoses(
  client: AnyClient,
  input: ProcessMissedDosesInput,
): Promise<{ processedCount: number }> {
  const lookbackHours = input.lookbackHours ?? 48;

  // Compute scan window dates
  const cutoffMs = new Date(input.cutoffTime).getTime();
  const scanStartMs = cutoffMs - lookbackHours * 3_600_000;
  const scanStartDate = new Date(scanStartMs).toISOString().slice(0, 10);
  const scanEndDate = new Date(cutoffMs).toISOString().slice(0, 10);

  // Load active items for the org in the scan window
  const items = await findActiveItemsForOrgInRange(
    client,
    input.organizationId,
    scanStartDate,
    scanEndDate,
  );

  if (items.length === 0) return { processedCount: 0 };

  // Expand all scheduled slots in the window
  const allSlots = expandSchedulesForDateRange(items, scanStartDate, scanEndDate);

  // Filter to slots before the cutoff time
  const missableSlots = allSlots.filter((slot) => slot.scheduledTime < input.cutoffTime);

  if (missableSlots.length === 0) return { processedCount: 0 };

  // Load existing logs for these items in the window
  const itemIds = [...new Set(items.map((it) => it.itemId))];
  const existingLogs = await findLogsByItemsAndDateRange(
    client,
    itemIds,
    scanStartDate,
    scanEndDate,
  );

  // Build a set of already-logged slot keys
  const loggedKeys = new Set(
    existingLogs.map((log) => `${log.prescription_item_id}|${log.scheduled_time}`),
  );

  // Build item index for organizationId / patientId lookup
  const itemMap = new Map(items.map((it) => [it.itemId, it]));

  // Collect slots with no existing log
  const missedRows: CreateAdherenceLogInput[] = [];
  for (const slot of missableSlots) {
    const key = `${slot.prescriptionItemId}|${slot.scheduledTime}`;
    if (loggedKeys.has(key)) continue;

    const item = itemMap.get(slot.prescriptionItemId);
    if (!item) continue;

    missedRows.push({
      organization_id: item.organizationId,
      patient_id: item.patientId,
      prescription_item_id: slot.prescriptionItemId,
      scheduled_date: slot.scheduledDate,
      scheduled_time: slot.scheduledTime,
      actual_taken_time: null,
      status: "missed",
      source: "system",
      notes: null,
    });
  }

  const processedCount = await insertMissedDoseLogs(client, missedRows);
  return { processedCount };
}
