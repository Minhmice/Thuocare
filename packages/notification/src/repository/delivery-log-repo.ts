/**
 * Data access for `public.notification_delivery_log`.
 */

import type {
  DeliveryStatus,
  NotificationChannel,
  NotificationDeliveryLogRow,
} from "../domain/types.js";
import { NotificationError } from "../errors/notification-errors.js";
import { dbInsert } from "./db-client.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

const TABLE = "notification_delivery_log";

export async function insertDeliveryLog(
  client: AnyClient,
  input: {
    notificationEventId: string;
    channel: NotificationChannel;
    status: DeliveryStatus;
    responsePayload?: Record<string, unknown> | null;
    sentAt?: string;
  },
): Promise<NotificationDeliveryLogRow> {
  try {
    return await dbInsert<NotificationDeliveryLogRow>(client, TABLE, {
      notification_event_id: input.notificationEventId,
      channel: input.channel,
      status: input.status,
      response_payload: input.responsePayload ?? null,
      sent_at: input.sentAt ?? new Date().toISOString().slice(0, 19),
    });
  } catch (err) {
    throw new NotificationError("db_write_failed", String(err));
  }
}
