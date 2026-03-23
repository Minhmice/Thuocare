/**
 * Medication-related notification triggers.
 *
 * generateDoseReminders       — for each upcoming dose today, schedule a reminder
 * detectMissedDoseNotifications — for each recently missed dose, create an alert
 *
 * Both are system cron functions; no actor context required.
 * Must be called with service_role client (bypasses RLS).
 */

import { expandScheduleForDate } from "@thuocare/adherence";

import type {
  DetectMissedDoseNotificationsInput,
  GenerateDoseRemindersInput,
} from "../domain/types.js";
import type { TriggerResult } from "../domain/view-models.js";
import { upsertNotificationEvent } from "../repository/notification-repo.js";
import {
  loadActiveItemsForOrg,
  loadRecentMissedDoses,
} from "../repository/trigger-data-repo.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowIsoDateTime(): string {
  return new Date().toISOString().slice(0, 19);
}

/** Subtract minutes from an ISO datetime string. Returns ISO datetime string. */
function subtractMinutes(isoDateTime: string, minutes: number): string {
  const ms = new Date(isoDateTime).getTime() - minutes * 60_000;
  return new Date(ms).toISOString().slice(0, 19);
}

/** Extract HH:mm from an ISO datetime string. */
function toTimeDisplay(isoDateTime: string): string {
  return isoDateTime.slice(11, 16);
}

// ─── Dose reminder trigger ────────────────────────────────────────────────────

/**
 * Generate dose reminder notifications for all active patients in an organization.
 *
 * For each scheduled dose on targetDate, creates a notification_event
 * scheduled at `dose_time - leadMinutes`. Uses upsert-ignore for idempotency.
 *
 * Recommended cron: run hourly or at start of each new day.
 *
 * @param client  service_role Supabase client
 */
export async function generateDoseReminders(
  client: AnyClient,
  input: GenerateDoseRemindersInput,
): Promise<TriggerResult> {
  const targetDate = input.targetDate ?? todayIsoDate();
  const leadMinutes = input.leadMinutes ?? 10;

  const items = await loadActiveItemsForOrg(client, input.organizationId, targetDate);

  let created = 0;
  let skipped = 0;

  for (const item of items) {
    const slots = expandScheduleForDate(item, targetDate);

    for (const slot of slots) {
      const scheduledAt = subtractMinutes(slot.scheduledTime, leadMinutes);

      const medicationName = item.brandName
        ? `${item.genericName} (${item.brandName})`
        : item.genericName;

      const row = await upsertNotificationEvent(client, {
        organization_id: item.organizationId,
        patient_id: item.patientId,
        type: "dose_reminder",
        reference_type: "prescription_item",
        reference_id: item.itemId,
        scheduled_at: scheduledAt,
        payload: {
          prescriptionItemId: item.itemId,
          medicationName,
          strengthText: item.strengthText,
          doseAmount: item.doseAmount,
          doseUnit: item.doseUnit,
          doseTime: toTimeDisplay(slot.scheduledTime),
        },
      });

      if (row) created++;
      else skipped++;
    }
  }

  return { created, skipped };
}

// ─── Missed dose alert trigger ────────────────────────────────────────────────

/**
 * Create missed dose alert notifications for recently missed doses.
 *
 * Scans medication_adherence_log for 'missed' entries updated since sinceTime,
 * then upserts a notification_event for each. Idempotent via upsert-ignore.
 *
 * Recommended cron: run every 30 minutes, or immediately after processMissedDoses().
 *
 * @param client  service_role Supabase client
 */
export async function detectMissedDoseNotifications(
  client: AnyClient,
  input: DetectMissedDoseNotificationsInput,
): Promise<TriggerResult> {
  // Default: scan the last 48 hours
  const sinceMs = Date.now() - (48 * 3_600_000);
  const sinceTime = input.sinceTime ?? new Date(sinceMs).toISOString().slice(0, 19);

  const missedDoses = await loadRecentMissedDoses(client, input.organizationId, sinceTime);

  let created = 0;
  let skipped = 0;

  for (const dose of missedDoses) {
    const medicationName = dose.brand_name
      ? `${dose.generic_name} (${dose.brand_name})`
      : dose.generic_name;

    // scheduled_at = the time the dose was missed (immediate alert)
    const row = await upsertNotificationEvent(client, {
      organization_id: dose.organization_id,
      patient_id: dose.patient_id,
      type: "missed_dose_alert",
      reference_type: "prescription_item",
      reference_id: dose.prescription_item_id,
      scheduled_at: dose.scheduled_time,
      payload: {
        prescriptionItemId: dose.prescription_item_id,
        medicationName,
        strengthText: dose.strength_text,
        scheduledTime: toTimeDisplay(dose.scheduled_time),
        scheduledDate: dose.scheduled_date,
      },
    });

    if (row) created++;
    else skipped++;
  }

  return { created, skipped };
}
