// Permissions
export type { NotificationPermissionSnapshot } from "./permissions";
export {
  ensureNotificationPermission,
  getNotificationPermissionStatus,
  requestNotificationPermission
} from "./permissions";

// Handlers
export { NotificationProvider, configureMedicationNotifications } from "./handlers";

// Scheduler
export {
  buildStableKey,
  buildUpcomingDoseNotifications,
  cancelAllMedicationNotifications,
  cancelDoseNotification,
  cancelNotificationsForMedication,
  rescheduleMedicationNotifications,
  rescheduleSingleMedicationNotifications,
  scheduleDoseNotification,
  scheduleNotificationsForMedications
} from "./scheduleNotifications";

// Store
export {
  getAllLocalNotificationRecords,
  getLocalNotificationRecord,
  hydrateLocalNotificationStore,
  removeLocalNotificationRecord,
  subscribeLocalNotificationStore,
  upsertLocalNotificationRecord,
  useLocalNotificationRecords
} from "./localNotificationStore";

// Types
export type {
  AndroidChannelSpec,
  BuildUpcomingDoseNotificationsOptions,
  LocalNotificationRecord,
  MedicationReminderNotificationData,
  NotificationCancelAllResult,
  NotificationCancelResult,
  NotificationPermissionStatus,
  NotificationRescheduleResult,
  NotificationScheduleResult,
  UpcomingDoseNotification
} from "./types";
