export type AppointmentErrorCode =
  | "unauthorized"
  | "appointment_not_found"
  | "follow_up_plan_not_found"
  | "episode_not_found"
  | "invalid_status_transition"
  | "patient_org_mismatch"
  | "db_read_failed"
  | "db_write_failed";

export class AppointmentError extends Error {
  constructor(
    public readonly code: AppointmentErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "AppointmentError";
  }
}

export function isAppointmentError(err: unknown): err is AppointmentError {
  return err instanceof AppointmentError;
}
