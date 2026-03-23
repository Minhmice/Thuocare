/**
 * @thuocare/notification — public API
 *
 * Patient-facing service:
 *   getPatientNotifications, markNotificationRead
 *
 * Trigger functions (cron / event-driven):
 *   generateDoseReminders, detectMissedDoseNotifications
 *   generateRefillReminders, notifyRefillStatusChange
 *   generateAppointmentReminders
 *
 * Delivery:
 *   processNotificationQueue
 *
 * Errors:
 *   NotificationError, NotificationErrorCode, isNotificationError
 */

// ─── Errors ───────────────────────────────────────────────────────────────────

export {
  NotificationError,
  isNotificationError,
} from "./errors/notification-errors.js";
export type { NotificationErrorCode } from "./errors/notification-errors.js";

// ─── Domain types ─────────────────────────────────────────────────────────────

export type {
  NotificationType,
  NotificationStatus,
  NotificationChannel,
  DeliveryStatus,
  NotificationEventRow,
  NotificationDeliveryLogRow,
  CreateNotificationEventInput,
  GenerateDoseRemindersInput,
  DetectMissedDoseNotificationsInput,
  GenerateRefillRemindersInput,
  NotifyRefillStatusChangeInput,
  GenerateAppointmentRemindersInput,
  ProcessNotificationQueueInput,
  GetPatientNotificationsInput,
} from "./domain/types.js";

export type {
  DoseReminderPayload,
  MissedDoseAlertPayload,
  RefillReminderPayload,
  RefillUpdatePayload,
  AppointmentReminderPayload,
  NotificationPayload,
} from "./domain/payloads.js";

export type {
  NotificationVM,
  QueueProcessResult,
  TriggerResult,
} from "./domain/view-models.js";

// ─── Patient-facing service ───────────────────────────────────────────────────

export {
  getPatientNotifications,
  markNotificationRead,
} from "./service/notification-service.js";

// ─── Trigger functions ────────────────────────────────────────────────────────

export {
  generateDoseReminders,
  detectMissedDoseNotifications,
} from "./triggers/medication-triggers.js";

export {
  generateRefillReminders,
  notifyRefillStatusChange,
} from "./triggers/refill-triggers.js";

export {
  generateAppointmentReminders,
} from "./triggers/appointment-triggers.js";

// ─── Queue processor ──────────────────────────────────────────────────────────

export { processNotificationQueue } from "./delivery/queue-processor.js";
