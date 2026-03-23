/**
 * Refill-related notification triggers.
 *
 * generateRefillReminders   — near-depletion scan for all patients in an org
 * notifyRefillStatusChange  — event-driven; call after doctor reviews a request
 *
 * Both are system functions; no actor context required.
 * Must be called with service_role client (bypasses RLS).
 */

import type {
  GenerateRefillRemindersInput,
  NotifyRefillStatusChangeInput,
} from "../domain/types.js";
import type { TriggerResult } from "../domain/view-models.js";
import { upsertNotificationEvent } from "../repository/notification-repo.js";
import { loadActiveItemsForOrg } from "../repository/trigger-data-repo.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowIsoDateTime(): string {
  return new Date().toISOString().slice(0, 19);
}

function daysDiff(dateA: string, dateB: string): number {
  return Math.round(
    (new Date(`${dateB}T00:00:00`).getTime() - new Date(`${dateA}T00:00:00`).getTime()) /
      86_400_000,
  );
}

/** Scheduled_at for a refill reminder = today at 09:00 local (morning notification). */
function reminderScheduledAt(date: string): string {
  return `${date}T09:00:00`;
}

// ─── Refill reminder trigger ──────────────────────────────────────────────────

/**
 * Generate refill reminder notifications for patients whose medications are
 * near depletion.
 *
 * Logic: daysRemaining = max(0, days_supply - days_elapsed)
 *        if daysRemaining <= thresholdDays → create refill_reminder
 *
 * Idempotent: upsert-ignore means running twice in one day creates no duplicates.
 *
 * Recommended cron: run once per day in the morning.
 *
 * @param client  service_role Supabase client
 */
export async function generateRefillReminders(
  client: AnyClient,
  input: GenerateRefillRemindersInput,
): Promise<TriggerResult> {
  const threshold = input.thresholdDays ?? 3;
  const today = todayIsoDate();

  const items = await loadActiveItemsForOrg(client, input.organizationId, today);

  let created = 0;
  let skipped = 0;

  for (const item of items) {
    if (!item.isRefillable) continue;

    const daysElapsed = daysDiff(item.startDate, today);
    const daysRemaining = Math.max(0, item.daysSupply - daysElapsed);

    if (daysRemaining > threshold) continue;

    const medicationName = item.brandName
      ? `${item.genericName} (${item.brandName})`
      : item.genericName;

    const row = await upsertNotificationEvent(client, {
      organization_id: item.organizationId,
      patient_id: item.patientId,
      type: "refill_reminder",
      reference_type: "prescription_item",
      reference_id: item.itemId,
      // One reminder per item per day — use today's morning slot
      scheduled_at: reminderScheduledAt(today),
      payload: {
        prescriptionItemId: item.itemId,
        prescriptionId: item.prescriptionId,
        medicationName,
        strengthText: item.strengthText,
        daysRemaining,
      },
    });

    if (row) created++;
    else skipped++;
  }

  return { created, skipped };
}

// ─── Refill status change notification ───────────────────────────────────────

/**
 * Create a refill_update notification when a doctor approves, rejects, or
 * requires a visit for a refill request.
 *
 * This is event-driven — call it immediately after `reviewRefillRequest()` completes
 * rather than running it as a polling cron.
 *
 * @param client  service_role Supabase client
 */
export async function notifyRefillStatusChange(
  client: AnyClient,
  input: NotifyRefillStatusChangeInput,
): Promise<TriggerResult> {
  const row = await upsertNotificationEvent(client, {
    organization_id: input.organizationId,
    patient_id: input.patientId,
    type: "refill_update",
    reference_type: "refill_request",
    reference_id: input.refillRequestId,
    // Immediate notification — schedule for now
    scheduled_at: nowIsoDateTime(),
    payload: {
      refillRequestId: input.refillRequestId,
      status: input.newStatus,
      decisionNote: input.decisionNote ?? null,
      resultPrescriptionId: input.resultPrescriptionId ?? null,
    },
  });

  return { created: row ? 1 : 0, skipped: row ? 0 : 1 };
}
