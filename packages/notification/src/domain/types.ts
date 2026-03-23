/**
 * Core domain types for the notification module.
 */

import type { EntityId, IsoDateTime } from "@thuocare/contracts";

// ─── Enum types ───────────────────────────────────────────────────────────────

export type NotificationType =
  | "dose_reminder"
  | "missed_dose_alert"
  | "refill_reminder"
  | "refill_update"
  | "appointment_reminder";

export type NotificationStatus = "pending" | "sent" | "failed" | "cancelled";

export type NotificationChannel = "in_app" | "sms" | "email";

export type DeliveryStatus = "success" | "failed";

// ─── DB row types ─────────────────────────────────────────────────────────────

/** `public.notification_event` row. */
export interface NotificationEventRow {
  id: EntityId;
  organization_id: EntityId;
  patient_id: EntityId;
  type: NotificationType;
  reference_type: string | null;
  reference_id: EntityId;
  payload: Record<string, unknown>;
  scheduled_at: IsoDateTime;
  status: NotificationStatus;
  is_read: boolean;
  retry_count: number;
  max_retries: number;
  last_error: string | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

/** `public.notification_delivery_log` row. */
export interface NotificationDeliveryLogRow {
  id: EntityId;
  notification_event_id: EntityId;
  channel: NotificationChannel;
  status: DeliveryStatus;
  response_payload: Record<string, unknown> | null;
  sent_at: IsoDateTime;
}

// ─── Insert inputs ────────────────────────────────────────────────────────────

export type CreateNotificationEventInput = Pick<
  NotificationEventRow,
  | "organization_id"
  | "patient_id"
  | "type"
  | "reference_id"
  | "scheduled_at"
> & {
  reference_type?: string | null;
  payload?: Record<string, unknown>;
  status?: NotificationStatus;
  max_retries?: number;
};

// ─── Trigger inputs ───────────────────────────────────────────────────────────

export interface GenerateDoseRemindersInput {
  organizationId: EntityId;
  /** Date to generate reminders for. Defaults to today. */
  targetDate?: string;
  /** Minutes before the dose to send the reminder. Default: 10. */
  leadMinutes?: number;
}

export interface DetectMissedDoseNotificationsInput {
  organizationId: EntityId;
  /**
   * Only process missed doses logged at or after this time.
   * Defaults to 48 hours ago. Keeps the scan window bounded.
   */
  sinceTime?: IsoDateTime;
}

export interface GenerateRefillRemindersInput {
  organizationId: EntityId;
  /** Days remaining threshold. Default: 3. */
  thresholdDays?: number;
}

export interface NotifyRefillStatusChangeInput {
  refillRequestId: EntityId;
  patientId: EntityId;
  organizationId: EntityId;
  newStatus: "approved" | "rejected" | "appointment_required";
  decisionNote?: string | null;
  resultPrescriptionId?: EntityId | null;
}

export interface GenerateAppointmentRemindersInput {
  organizationId: EntityId;
  /** Date to scan for upcoming appointments. Defaults to today. */
  targetDate?: string;
}

export interface ProcessNotificationQueueInput {
  organizationId?: EntityId;
  channel?: NotificationChannel;
  batchSize?: number;
  /** Override for "now" — useful in tests. Defaults to current UTC time. */
  now?: IsoDateTime;
}

export interface GetPatientNotificationsInput {
  patientId: EntityId;
  /** Filter by read status. Undefined = all. */
  isRead?: boolean;
  /** Max rows. Default: 50. */
  limit?: number;
}
