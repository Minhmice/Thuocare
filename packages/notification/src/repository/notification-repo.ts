/**
 * Data access for `public.notification_event`.
 */

import type { CreateNotificationEventInput, NotificationEventRow, NotificationStatus } from "../domain/types.js";
import { NotificationError } from "../errors/notification-errors.js";
import { dbInsert, dbSelect, dbSelectOne, dbUpdate, dbUpsertIgnore } from "./db-client.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

const TABLE = "notification_event";

// ─── Reads ────────────────────────────────────────────────────────────────────

export async function findNotificationById(
  client: AnyClient,
  id: string,
): Promise<NotificationEventRow | null> {
  try {
    return await dbSelectOne<NotificationEventRow>(client, TABLE, "*", (q) => q.eq("id", id));
  } catch (err) {
    throw new NotificationError("db_read_failed", String(err));
  }
}

/** Patient's notifications, newest-first. */
export async function findNotificationsByPatient(
  client: AnyClient,
  patientId: string,
  opts: { isRead?: boolean; limit?: number } = {},
): Promise<NotificationEventRow[]> {
  try {
    return await dbSelect<NotificationEventRow>(client, TABLE, "*", (q) => {
      let query = q
        .eq("patient_id", patientId)
        .order("scheduled_at", { ascending: false })
        .limit(opts.limit ?? 50);
      if (opts.isRead !== undefined) query = query.eq("is_read", opts.isRead);
      return query;
    });
  } catch (err) {
    throw new NotificationError("db_read_failed", String(err));
  }
}

/**
 * Load a batch of pending notifications ready for delivery.
 * Optionally scoped to one organization.
 */
export async function findPendingNotifications(
  client: AnyClient,
  opts: { organizationId?: string; now: string; limit?: number },
): Promise<NotificationEventRow[]> {
  try {
    return await dbSelect<NotificationEventRow>(client, TABLE, "*", (q) => {
      let query = q
        .eq("status", "pending")
        .lte("scheduled_at", opts.now)
        .order("scheduled_at", { ascending: true })
        .limit(opts.limit ?? 100);
      if (opts.organizationId) query = query.eq("organization_id", opts.organizationId);
      return query;
    });
  } catch (err) {
    throw new NotificationError("db_read_failed", String(err));
  }
}

// ─── Writes ───────────────────────────────────────────────────────────────────

/**
 * Insert a notification event. Returns null if duplicate (idempotent).
 * Unique constraint: (patient_id, type, reference_id, scheduled_at).
 */
export async function upsertNotificationEvent(
  client: AnyClient,
  input: CreateNotificationEventInput,
): Promise<NotificationEventRow | null> {
  const row: Record<string, unknown> = {
    organization_id: input.organization_id,
    patient_id: input.patient_id,
    type: input.type,
    reference_type: input.reference_type ?? null,
    reference_id: input.reference_id,
    payload: input.payload ?? {},
    scheduled_at: input.scheduled_at,
    status: input.status ?? "pending",
    max_retries: input.max_retries ?? 3,
  };

  try {
    return await dbUpsertIgnore<NotificationEventRow>(
      client,
      TABLE,
      row,
      "patient_id,type,reference_id,scheduled_at",
    );
  } catch (err) {
    throw new NotificationError("db_write_failed", String(err));
  }
}

/** Update delivery status + optional retry bookkeeping. */
export async function updateNotificationStatus(
  client: AnyClient,
  id: string,
  updates: {
    status: NotificationStatus;
    retryCount?: number;
    lastError?: string | null;
  },
): Promise<NotificationEventRow> {
  const patch: Record<string, unknown> = { status: updates.status };
  if (updates.retryCount !== undefined) patch["retry_count"] = updates.retryCount;
  if (updates.lastError !== undefined) patch["last_error"] = updates.lastError;

  try {
    return await dbUpdate<NotificationEventRow>(client, TABLE, patch, (q) => q.eq("id", id));
  } catch (err) {
    throw new NotificationError("db_write_failed", String(err));
  }
}

/** Mark a notification as read by the patient. */
export async function markNotificationEventRead(
  client: AnyClient,
  id: string,
): Promise<NotificationEventRow> {
  try {
    return await dbUpdate<NotificationEventRow>(
      client,
      TABLE,
      { is_read: true },
      (q) => q.eq("id", id),
    );
  } catch (err) {
    throw new NotificationError("db_write_failed", String(err));
  }
}
