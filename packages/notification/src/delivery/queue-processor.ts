/**
 * Notification delivery queue processor.
 *
 * processNotificationQueue() — processes a batch of pending notifications
 * by calling the appropriate channel handler and updating statuses.
 *
 * MVP channel: in_app only.
 * "In-app delivery" means the notification is stored in the DB with status='sent'.
 * Clients read via getPatientNotifications() and subscribe via Supabase Realtime.
 *
 * Future channels (sms, email) would call external APIs before marking sent.
 *
 * Retry logic:
 *  - On delivery failure: retry_count++
 *  - If retry_count >= max_retries: status = 'failed'
 *  - Otherwise: leave as 'pending' for the next queue run
 *
 * Idempotency: already-sent notifications are skipped by the status filter.
 */

import type { ProcessNotificationQueueInput } from "../domain/types.js";
import type { QueueProcessResult } from "../domain/view-models.js";
import { NotificationError } from "../errors/notification-errors.js";
import { insertDeliveryLog } from "../repository/delivery-log-repo.js";
import type { NotificationEventRow } from "../domain/types.js";
import {
  findPendingNotifications,
  updateNotificationStatus,
} from "../repository/notification-repo.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

// ─── In-app delivery handler ──────────────────────────────────────────────────

/**
 * Deliver a notification via in-app channel.
 *
 * For in-app, "delivery" is a DB write: the notification exists in
 * notification_event with status='sent'. Clients query/subscribe to it.
 *
 * Throws if the delivery log write fails.
 */
async function deliverInApp(
  client: AnyClient,
  notification: NotificationEventRow,
  sentAt: string,
): Promise<void> {
  // Log the delivery attempt
  await insertDeliveryLog(client, {
    notificationEventId: notification.id,
    channel: "in_app",
    status: "success",
    responsePayload: null,
    sentAt,
  });

  // Mark the event as sent
  await updateNotificationStatus(client, notification.id, { status: "sent" });
}

// ─── Stub handlers for future channels ───────────────────────────────────────

async function deliverSms(
  _client: AnyClient,
  _notification: NotificationEventRow,
  _sentAt: string,
): Promise<void> {
  // TODO Phase 12: integrate SMS provider (e.g., Twilio, Zalo OA)
  throw new NotificationError("delivery_failed", "SMS delivery not implemented in MVP");
}

async function deliverEmail(
  _client: AnyClient,
  _notification: NotificationEventRow,
  _sentAt: string,
): Promise<void> {
  // TODO Phase 12: integrate email provider (e.g., SendGrid, Resend)
  throw new NotificationError("delivery_failed", "Email delivery not implemented in MVP");
}

// ─── Queue processor ──────────────────────────────────────────────────────────

/**
 * Process a batch of pending notifications.
 *
 * Loads up to `batchSize` pending notifications with scheduled_at <= now,
 * attempts delivery for each, and updates statuses.
 *
 * Must be called with service_role client (writes to notification_event).
 *
 * Recommended cron: run every 5–15 minutes.
 *
 * @returns { processed, succeeded, failed }
 */
export async function processNotificationQueue(
  client: AnyClient,
  input: ProcessNotificationQueueInput = {},
): Promise<QueueProcessResult> {
  const now = input.now ?? new Date().toISOString().slice(0, 19);
  const channel = input.channel ?? "in_app";
  const batchSize = input.batchSize ?? 100;

  const pending = await findPendingNotifications(client, {
    organizationId: input.organizationId,
    now,
    limit: batchSize,
  });

  let succeeded = 0;
  let failed = 0;

  for (const notification of pending) {
    try {
      switch (channel) {
        case "in_app": await deliverInApp(client, notification, now);   break;
        case "sms":    await deliverSms(client, notification, now);     break;
        case "email":  await deliverEmail(client, notification, now);   break;
      }
      succeeded++;
    } catch (err) {
      const newRetryCount = notification.retry_count + 1;
      const exhausted = newRetryCount >= notification.max_retries;

      await updateNotificationStatus(client, notification.id, {
        status: exhausted ? "failed" : "pending",
        retryCount: newRetryCount,
        lastError: String(err),
      }).catch(() => {
        // Best-effort — don't let a status-update failure crash the whole batch
      });

      failed++;
    }
  }

  return { processed: pending.length, succeeded, failed };
}
