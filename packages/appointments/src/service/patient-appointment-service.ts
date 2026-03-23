/**
 * Patient-facing appointment service.
 *
 * getPatientAppointments — bucketed list (upcoming / past)
 * getAppointmentDetail   — single appointment with requirements
 *
 * Patients can only view their own appointments.
 */

import type { AnyActorContext } from "@thuocare/auth";
import { requirePatientActor } from "@thuocare/auth";

import type { GetPatientAppointmentsInput } from "../domain/types.js";
import type {
  AppointmentDetailVM,
  AppointmentListVM,
  PreVisitRequirementVM,
} from "../domain/view-models.js";
import { AppointmentError } from "../errors/appointment-errors.js";
import {
  findAppointmentById,
  findAppointmentsByPatient,
  findRequirementsByAppointment,
} from "../repository/appointment-repo.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nowIsoDateTime(): string {
  return new Date().toISOString().slice(0, 19);
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

/** Terminal statuses — appointments past these are considered "past". */
const TERMINAL_STATUSES = new Set(["completed", "no_show", "cancelled"]);

// ─── 9.3 Get patient appointments ─────────────────────────────────────────────

/**
 * Return the patient's appointment inbox bucketed into upcoming and past.
 *
 * Upcoming: scheduled_at >= now OR status is active (scheduled/confirmed/checked_in).
 * Past: completed/no_show/cancelled OR scheduled_at < now.
 *
 * Requirements are loaded for upcoming appointments only (to reduce queries).
 */
export async function getPatientAppointments(
  client: AnyClient,
  actorCtx: AnyActorContext,
  input: GetPatientAppointmentsInput,
): Promise<AppointmentListVM> {
  const actor = requirePatientActor(actorCtx);

  if (actor.patientId !== input.patientId) {
    throw new AppointmentError("unauthorized", "Cannot view another patient's appointments");
  }

  const now = nowIsoDateTime();
  const rows = await findAppointmentsByPatient(client, input.patientId, (input.limit ?? 20) * 2);

  const upcoming: AppointmentDetailVM[] = [];
  const past: AppointmentDetailVM[] = [];

  for (const row of rows) {
    const isTerminal = TERMINAL_STATUSES.has(row.status);
    const isPast = isTerminal || row.scheduled_start_at < now;

    if (isPast) {
      if (past.length < (input.limit ?? 20)) {
        past.push(toAppointmentVM(row));
      }
    } else {
      upcoming.push(toAppointmentVM(row));
    }
  }

  // Enrich upcoming appointments with requirements
  const enrichedUpcoming = await Promise.all(
    upcoming.map(async (appt) => {
      const reqs = await findRequirementsByAppointment(client, appt.appointmentId);
      return { ...appt, requirements: reqs.map(toRequirementVM) };
    }),
  );

  return {
    upcoming: enrichedUpcoming.sort((a, b) =>
      a.scheduledStartAt.localeCompare(b.scheduledStartAt),
    ),
    past,
  };
}

// ─── Get single appointment detail ────────────────────────────────────────────

/**
 * Return full appointment detail for the patient.
 * Verifies the appointment belongs to the calling patient.
 */
export async function getAppointmentDetail(
  client: AnyClient,
  actorCtx: AnyActorContext,
  appointmentId: string,
): Promise<AppointmentDetailVM> {
  const actor = requirePatientActor(actorCtx);

  const appointment = await findAppointmentById(client, appointmentId);
  if (!appointment) {
    throw new AppointmentError("appointment_not_found", `Appointment ${appointmentId} not found`);
  }
  if (appointment.patient_id !== actor.patientId) {
    throw new AppointmentError("unauthorized", "Appointment does not belong to this patient");
  }

  const requirements = await findRequirementsByAppointment(client, appointmentId);
  return toAppointmentVM(appointment, requirements);
}
