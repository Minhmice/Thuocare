/**
 * Appointment reminder trigger.
 *
 * generateAppointmentReminders — for each upcoming appointment, schedule
 *   a "1 day before" reminder and a "same day" reminder.
 *
 * System cron function; no actor context required.
 * Must be called with service_role client.
 */

import type { GenerateAppointmentRemindersInput } from "../domain/types.js";
import type { TriggerResult } from "../domain/view-models.js";
import { upsertNotificationEvent } from "../repository/notification-repo.js";
import { loadUpcomingAppointments } from "../repository/trigger-data-repo.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ─── Appointment reminder trigger ─────────────────────────────────────────────

/**
 * Generate appointment reminder notifications for an organization.
 *
 * For each upcoming appointment in the next 2 days:
 *  - "1 day before" reminder: scheduled_at = (appointment_date - 1) at 09:00
 *  - "same day" reminder:     scheduled_at = appointment_date at 07:00
 *
 * Both use upsert-ignore — safe to call multiple times per day.
 *
 * Recommended cron: run once per day in the morning.
 *
 * @param client  service_role Supabase client
 */
export async function generateAppointmentReminders(
  client: AnyClient,
  input: GenerateAppointmentRemindersInput,
): Promise<TriggerResult> {
  const today = input.targetDate ?? todayIsoDate();
  const scanEnd = addDays(today, 1); // look ahead 1 day (today + tomorrow)

  const appointments = await loadUpcomingAppointments(
    client,
    input.organizationId,
    today,
    scanEnd,
  );

  let created = 0;
  let skipped = 0;

  for (const appt of appointments) {
    const apptDate = appt.scheduled_start_at.slice(0, 10);
    const isToday = apptDate === today;
    const isTomorrow = apptDate === scanEnd;

    // Same-day reminder: scheduled_at = appointment_date at 07:00
    if (isToday) {
      const scheduledAt = `${apptDate}T07:00:00`;
      const row = await upsertNotificationEvent(client, {
        organization_id: appt.organization_id,
        patient_id: appt.patient_id,
        type: "appointment_reminder",
        reference_type: "appointment",
        reference_id: appt.id,
        scheduled_at: scheduledAt,
        payload: {
          appointmentId: appt.id,
          appointmentType: appt.appointment_type,
          scheduledStartAt: appt.scheduled_start_at,
          reminderType: "same_day",
          doctorId: appt.doctor_id ?? null,
        },
      });
      if (row) created++;
      else skipped++;
    }

    // 1-day-before reminder: scheduled_at = (appointment_date - 1) at 09:00
    if (isTomorrow) {
      const dayBefore = addDays(apptDate, -1);
      const scheduledAt = `${dayBefore}T09:00:00`;
      const row = await upsertNotificationEvent(client, {
        organization_id: appt.organization_id,
        patient_id: appt.patient_id,
        type: "appointment_reminder",
        reference_type: "appointment",
        reference_id: appt.id,
        scheduled_at: scheduledAt,
        payload: {
          appointmentId: appt.id,
          appointmentType: appt.appointment_type,
          scheduledStartAt: appt.scheduled_start_at,
          reminderType: "1_day_before",
          doctorId: appt.doctor_id ?? null,
        },
      });
      if (row) created++;
      else skipped++;
    }
  }

  return { created, skipped };
}
