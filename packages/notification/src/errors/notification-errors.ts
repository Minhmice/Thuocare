export type NotificationErrorCode =
  | "not_a_patient"
  | "patient_mismatch"
  | "unauthorized"
  | "notification_not_found"
  | "notification_not_owned"
  | "delivery_failed"
  | "db_read_failed"
  | "db_write_failed";

export class NotificationError extends Error {
  constructor(
    public readonly code: NotificationErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "NotificationError";
  }
}

export function isNotificationError(err: unknown): err is NotificationError {
  return err instanceof NotificationError;
}
