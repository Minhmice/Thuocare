export type NotificationPermissionStatus =
  | "granted"
  | "denied"
  | "undetermined"
  | "unavailable";

export type MedicationReminderNotificationData = {
  readonly type: "medication_reminder";
  readonly doseId: string;
  readonly scheduledDate: string;
  readonly scheduledAt: string;
  readonly medicationIds: string[];
};

export type UpcomingDoseNotification = {
  readonly doseId: string;
  readonly stableKey: string;
  readonly scheduledDate: string;
  readonly scheduledAt: string;
  readonly scheduledFor: Date;
  readonly medicationIds: string[];
  readonly data: MedicationReminderNotificationData;
};

export type BuildUpcomingDoseNotificationsOptions = {
  readonly now?: Date;
  readonly daysAhead?: number; // default 7
  readonly maxDaysAhead?: number; // default 14
};

export type AndroidChannelSpec = {
  readonly id: string;
  readonly name: string;
};

export type LocalNotificationRecord = {
  readonly doseId: string;
  readonly notificationId: string;
  readonly stableKey: string;
  readonly createdAtISO: string;
  readonly updatedAtISO: string;
  readonly scheduledForISO?: string;
  readonly data?: MedicationReminderNotificationData;
};

export type NotificationScheduleResult = {
  readonly ok: boolean;
  readonly doseId: string;
  readonly stableKey: string;
  readonly notificationId?: string;
  readonly scheduledForISO?: string;
  readonly errorMessage?: string;
};

export type NotificationCancelResult = {
  readonly ok: boolean;
  readonly doseId: string;
  readonly notificationId?: string;
  readonly errorMessage?: string;
};

export type NotificationRescheduleResult = {
  readonly ok: boolean;
  readonly doseId: string;
  readonly stableKey: string;
  readonly canceled?: NotificationCancelResult;
  readonly scheduled?: NotificationScheduleResult;
  readonly errorMessage?: string;
};

export type NotificationCancelAllResult = {
  readonly canceled: NotificationCancelResult[];
  readonly storeCleared: boolean;
};

export function clampDaysAhead(
  daysAhead: number | undefined,
  maxDaysAhead: number | undefined
): number {
  const max = typeof maxDaysAhead === "number" && Number.isFinite(maxDaysAhead)
    ? Math.max(1, Math.floor(maxDaysAhead))
    : 14;
  const base = typeof daysAhead === "number" && Number.isFinite(daysAhead)
    ? Math.floor(daysAhead)
    : 7;
  return Math.min(Math.max(1, base), max);
}

