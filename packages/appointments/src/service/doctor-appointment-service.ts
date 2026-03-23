/**
 * Doctor-facing appointment and follow-up plan service.
 *
 * createFollowUpPlan     — schedule a follow-up for a patient
 * createAppointment      — book an appointment linked to an episode
 * getDoctorAppointments  — org-scoped appointment list (filterable)
 * updateAppointmentStatus — advance appointment through its lifecycle
 * rescheduleAppointment  — update timing while preserving history
 * addPreVisitRequirement — attach a pre-visit task to an appointment
 * completeFollowUpPlan   — manually mark a follow-up plan as done
 * detectOverdueAppointments — find past-due scheduled/confirmed appointments
 *
 * All writes are organisation-scoped via actor.organizationId.
 * RLS enforces the org boundary at the DB level as a second layer.
 */

import type { AnyActorContext } from "@thuocare/auth";
import { requireDoctorActor } from "@thuocare/auth";

import type {
  AddPreVisitRequirementInput,
  CompleteFollowUpPlanInput,
  CreateAppointmentInput,
  CreateFollowUpPlanInput,
  GetDoctorAppointmentsInput,
  RescheduleAppointmentInput,
  UpdateAppointmentStatusInput,
} from "../domain/types.js";
import type {
  AppointmentDetailVM,
  FollowUpPlanDetailVM,
  OverdueAppointmentVM,
  PreVisitRequirementVM,
} from "../domain/view-models.js";
import { AppointmentError } from "../errors/appointment-errors.js";
import {
  findAppointmentById,
  findAppointmentsByOrg,
  findOverdueAppointmentsByOrg,
  findRequirementsByAppointment,
  insertAppointment,
  insertPreVisitRequirement,
  updateAppointment,
} from "../repository/appointment-repo.js";
import {
  findFollowUpPlanById,
  insertFollowUpPlan,
  updateFollowUpPlan,
} from "../repository/follow-up-repo.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nowIsoDateTime(): string {
  return new Date().toISOString().slice(0, 19);
}

function daysDiff(isoA: string, isoB: string): number {
  return Math.round(
    (new Date(isoB).getTime() - new Date(isoA).getTime()) / 86_400_000,
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toAppointmentVM(row: any, requirements: any[] = []): AppointmentDetailVM {
  return {
    appointmentId: row.id,
    patientId: row.patient_id,
    organizationId: row.organization_id,
    clinicId: row.clinic_id,
    treatmentEpisodeId: row.treatment_episode_id,
    followUpPlanId: row.follow_up_plan_id ?? null,
    doctorId: row.doctor_id ?? null,
    appointmentType: row.appointment_type,
    scheduledStartAt: row.scheduled_start_at,
    scheduledEndAt: row.scheduled_end_at,
    status: row.status,
    reasonText: row.reason_text ?? null,
    outcomeSummary: row.outcome_summary ?? null,
    createdAt: row.created_at,
    requirements: requirements.map(toRequirementVM),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRequirementVM(row: any): PreVisitRequirementVM {
  return {
    requirementId: row.id,
    requirementType: row.requirement_type,
    instructionText: row.instruction_text,
    status: row.status,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toFollowUpPlanVM(row: any): FollowUpPlanDetailVM {
  return {
    planId: row.id,
    patientId: row.patient_id,
    organizationId: row.organization_id,
    treatmentEpisodeId: row.treatment_episode_id,
    sourcePrescriptionId: row.source_prescription_id ?? null,
    ownerDoctorId: row.owner_doctor_id ?? null,
    followUpType: row.follow_up_type,
    triggerMode: row.trigger_mode,
    dueAt: row.due_at ?? null,
    dueWindowStartAt: row.due_window_start_at ?? null,
    dueWindowEndAt: row.due_window_end_at ?? null,
    requiredBeforeRefill: row.required_before_refill ?? false,
    instructionText: row.instruction_text ?? null,
    status: row.status,
    completedAt: row.completed_at ?? null,
    createdAt: row.created_at,
  };
}

// ─── 9.1 Create follow-up plan ────────────────────────────────────────────────

/**
 * Create a follow-up plan for a patient episode.
 *
 * Owned by the calling doctor by default.
 * org is taken from actor — no cross-org write possible.
 */
export async function createFollowUpPlan(
  client: AnyClient,
  actorCtx: AnyActorContext,
  input: CreateFollowUpPlanInput,
): Promise<FollowUpPlanDetailVM> {
  const actor = requireDoctorActor(actorCtx);

  const row = await insertFollowUpPlan(client, {
    organization_id: actor.organizationId,
    patient_id: input.patientId,
    treatment_episode_id: input.treatmentEpisodeId,
    follow_up_type: input.followUpType,
    trigger_mode: input.triggerMode,
    due_at: input.dueAt ?? null,
    due_window_start_at: input.dueWindowStartAt ?? null,
    due_window_end_at: input.dueWindowEndAt ?? null,
    required_before_refill: input.requiredBeforeRefill ?? false,
    instruction_text: input.instructionText ?? null,
    source_prescription_id: input.sourcePrescriptionId ?? null,
    owner_doctor_id: actor.doctorProfileId,
    status: "planned",
  });

  return toFollowUpPlanVM(row);
}

// ─── 9.2 Create appointment ───────────────────────────────────────────────────

/**
 * Book an appointment for a patient.
 *
 * - Linked to treatment_episode_id (required).
 * - Optionally linked to a follow_up_plan_id.
 * - doctor_id defaults to the calling doctor.
 *
 * Phase 7's cron (generateAppointmentReminders) will pick it up
 * and schedule the 1-day-before and same-day reminder notifications.
 */
export async function createAppointment(
  client: AnyClient,
  actorCtx: AnyActorContext,
  input: CreateAppointmentInput,
): Promise<AppointmentDetailVM> {
  const actor = requireDoctorActor(actorCtx);

  const row = await insertAppointment(client, {
    organization_id: actor.organizationId,
    clinic_id: input.clinicId,
    patient_id: input.patientId,
    treatment_episode_id: input.treatmentEpisodeId,
    follow_up_plan_id: input.followUpPlanId ?? null,
    doctor_id: input.doctorId ?? actor.doctorProfileId,
    appointment_type: input.appointmentType,
    scheduled_start_at: input.scheduledStartAt,
    scheduled_end_at: input.scheduledEndAt,
    status: "scheduled",
    reason_text: input.reasonText ?? null,
    outcome_summary: null,
  });

  return toAppointmentVM(row, []);
}

// ─── 9.3 Get doctor appointments ──────────────────────────────────────────────

/**
 * Return org-scoped appointments filtered by doctor, date range, or status.
 *
 * Defaults to the calling doctor's appointments for the next 30 days.
 */
export async function getDoctorAppointments(
  client: AnyClient,
  actorCtx: AnyActorContext,
  input: GetDoctorAppointmentsInput = {},
): Promise<AppointmentDetailVM[]> {
  const actor = requireDoctorActor(actorCtx);

  const rows = await findAppointmentsByOrg(client, actor.organizationId, {
    doctorId: input.doctorId !== undefined ? input.doctorId : actor.doctorProfileId,
    fromDate: input.fromDate,
    toDate: input.toDate,
    statuses: input.statuses,
    limit: input.limit ?? 100,
  });

  // Load requirements in parallel for all appointments
  const withRequirements = await Promise.all(
    rows.map(async (appt) => {
      const reqs = await findRequirementsByAppointment(client, appt.id);
      return toAppointmentVM(appt, reqs);
    }),
  );

  return withRequirements;
}

// ─── 9.4 Update appointment status ───────────────────────────────────────────

/**
 * Advance an appointment through its lifecycle.
 *
 * Valid transitions (MVP - no strict enforcement, RLS guards writes):
 *   scheduled  → confirmed | cancelled | rescheduled
 *   confirmed  → checked_in | no_show | cancelled
 *   checked_in → completed
 *
 * When status becomes 'completed' AND appointment has a follow_up_plan_id
 * AND autoCompleteFollowUpPlan !== false → the linked plan is marked 'completed'.
 */
export async function updateAppointmentStatus(
  client: AnyClient,
  actorCtx: AnyActorContext,
  input: UpdateAppointmentStatusInput,
): Promise<AppointmentDetailVM> {
  const actor = requireDoctorActor(actorCtx);

  const existing = await findAppointmentById(client, input.appointmentId);
  if (!existing) {
    throw new AppointmentError("appointment_not_found", `Appointment ${input.appointmentId} not found`);
  }
  if (existing.organization_id !== actor.organizationId) {
    throw new AppointmentError("unauthorized", "Appointment belongs to a different organization");
  }

  const patch: Record<string, unknown> = { status: input.status };
  if (input.outcomeSummary !== undefined) patch["outcome_summary"] = input.outcomeSummary;

  const updated = await updateAppointment(client, input.appointmentId, patch);

  // Auto-complete linked follow-up plan when appointment is completed
  if (
    input.status === "completed" &&
    updated.follow_up_plan_id &&
    input.autoCompleteFollowUpPlan !== false
  ) {
    await updateFollowUpPlan(client, updated.follow_up_plan_id, {
      status: "completed",
      completed_at: nowIsoDateTime(),
    }).catch(() => {
      // Best-effort — don't fail the whole update if plan completion fails
    });
  }

  const reqs = await findRequirementsByAppointment(client, updated.id);
  return toAppointmentVM(updated, reqs);
}

// ─── 9.5 Reschedule appointment ───────────────────────────────────────────────

/**
 * Change appointment timing.
 * Sets status to 'rescheduled' automatically.
 */
export async function rescheduleAppointment(
  client: AnyClient,
  actorCtx: AnyActorContext,
  input: RescheduleAppointmentInput,
): Promise<AppointmentDetailVM> {
  const actor = requireDoctorActor(actorCtx);

  const existing = await findAppointmentById(client, input.appointmentId);
  if (!existing) {
    throw new AppointmentError("appointment_not_found", `Appointment ${input.appointmentId} not found`);
  }
  if (existing.organization_id !== actor.organizationId) {
    throw new AppointmentError("unauthorized", "Appointment belongs to a different organization");
  }

  const updated = await updateAppointment(client, input.appointmentId, {
    scheduled_start_at: input.scheduledStartAt,
    scheduled_end_at: input.scheduledEndAt,
    status: "rescheduled",
    reason_text: input.reasonText ?? existing.reason_text,
  });

  const reqs = await findRequirementsByAppointment(client, updated.id);
  return toAppointmentVM(updated, reqs);
}

// ─── 9.6 Add pre-visit requirement ───────────────────────────────────────────

/**
 * Attach a pre-visit requirement to an appointment.
 *
 * Examples: "bring old prescription", "fasting required", "upload lab result".
 */
export async function addPreVisitRequirement(
  client: AnyClient,
  actorCtx: AnyActorContext,
  input: AddPreVisitRequirementInput,
): Promise<PreVisitRequirementVM> {
  const actor = requireDoctorActor(actorCtx);

  const appointment = await findAppointmentById(client, input.appointmentId);
  if (!appointment) {
    throw new AppointmentError("appointment_not_found", `Appointment ${input.appointmentId} not found`);
  }
  if (appointment.organization_id !== actor.organizationId) {
    throw new AppointmentError("unauthorized", "Appointment belongs to a different organization");
  }

  const row = await insertPreVisitRequirement(client, {
    appointment_id: input.appointmentId,
    requirement_type: input.requirementType,
    instruction_text: input.instructionText,
    status: "pending",
  });

  return toRequirementVM(row);
}

// ─── 9.7 Complete follow-up plan ──────────────────────────────────────────────

/**
 * Manually mark a follow-up plan as completed.
 * Used when completing without going through an appointment (e.g., phone check-in).
 */
export async function completeFollowUpPlan(
  client: AnyClient,
  actorCtx: AnyActorContext,
  input: CompleteFollowUpPlanInput,
): Promise<FollowUpPlanDetailVM> {
  const actor = requireDoctorActor(actorCtx);

  const plan = await findFollowUpPlanById(client, input.planId);
  if (!plan) {
    throw new AppointmentError("follow_up_plan_not_found", `Follow-up plan ${input.planId} not found`);
  }
  if (plan.organization_id !== actor.organizationId) {
    throw new AppointmentError("unauthorized", "Follow-up plan belongs to a different organization");
  }

  const updated = await updateFollowUpPlan(client, input.planId, {
    status: "completed",
    completed_at: input.completedAt ?? nowIsoDateTime(),
  });

  return toFollowUpPlanVM(updated);
}

// ─── 9.8 Detect overdue appointments ─────────────────────────────────────────

/**
 * Return appointments that are past their scheduled_start_at
 * but still have status 'scheduled' or 'confirmed'.
 *
 * Used by the dashboard to flag no-shows and missed visits.
 * Does NOT automatically update statuses — that is a cron job responsibility.
 *
 * @returns sorted by scheduledStartAt asc (most overdue first).
 */
export async function detectOverdueAppointments(
  client: AnyClient,
  actorCtx: AnyActorContext,
): Promise<OverdueAppointmentVM[]> {
  const actor = requireDoctorActor(actorCtx);
  const now = nowIsoDateTime();

  const rows = await findOverdueAppointmentsByOrg(client, actor.organizationId, now);

  return rows.map((row): OverdueAppointmentVM => ({
    appointmentId: row.id,
    patientId: row.patient_id,
    treatmentEpisodeId: row.treatment_episode_id,
    followUpPlanId: row.follow_up_plan_id ?? null,
    doctorId: row.doctor_id ?? null,
    appointmentType: row.appointment_type,
    scheduledStartAt: row.scheduled_start_at,
    daysOverdue: Math.max(0, daysDiff(row.scheduled_start_at, now)),
    reasonText: row.reason_text ?? null,
  }));
}
