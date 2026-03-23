/**
 * Patient-facing notification service.
 *
 * getPatientNotifications — return the patient's notification inbox
 * markNotificationRead    — mark a single notification as read
 *
 * Both require a patient actor context (patient can only access their own notifications).
 */

import { requirePatientActor } from "@thuocare/auth";

import type { GetPatientNotificationsInput } from "../domain/types.js";
import type { NotificationVM } from "../domain/view-models.js";
import { buildNotificationMessage } from "../domain/payloads.js";
import { NotificationError } from "../errors/notification-errors.js";
import {
  findNotificationById,
  findNotificationsByPatient,
  markNotificationEventRead,
} from "../repository/notification-repo.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyActorContext = any;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toNotificationVM(row: Awaited<ReturnType<typeof findNotificationById>>): NotificationVM {
  if (!row) throw new NotificationError("notification_not_found", "Notification not found");
  return {
    id: row.id,
    type: row.type,
    message: buildNotificationMessage(row.type, row.payload),
    scheduledAt: row.scheduled_at,
    createdAt: row.created_at,
    isRead: row.is_read,
    status: row.status,
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    payload: row.payload,
  };
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Return the patient's notification inbox.
 *
 * Sorted by scheduled_at descending (newest first).
 * Optionally filtered by read status.
 *
 * @param actorCtx  patient actor context (patientId must match input.patientId)
 */
export async function getPatientNotifications(
  client: AnyClient,
  actorCtx: AnyActorContext,
  input: GetPatientNotificationsInput,
): Promise<NotificationVM[]> {
  const actor = requirePatientActor(actorCtx);

  if (actor.patientId !== input.patientId) {
    throw new NotificationError("unauthorized", "Cannot read another patient's notifications");
  }

  const rows = await findNotificationsByPatient(client, input.patientId, {
    isRead: input.isRead,
    limit: input.limit,
  });

  return rows.map((row) => toNotificationVM(row));
}

/**
 * Mark a single notification as read.
 *
 * Only the owning patient can mark their notification as read.
 *
 * @param actorCtx  patient actor context
 */
export async function markNotificationRead(
  client: AnyClient,
  actorCtx: AnyActorContext,
  notificationEventId: string,
): Promise<void> {
  const actor = requirePatientActor(actorCtx);

  const notification = await findNotificationById(client, notificationEventId);
  if (!notification) {
    throw new NotificationError("notification_not_found", `Notification ${notificationEventId} not found`);
  }

  if (notification.patient_id !== actor.patientId) {
    throw new NotificationError("unauthorized", "Cannot mark another patient's notification as read");
  }

  await markNotificationEventRead(client, notificationEventId);
}
