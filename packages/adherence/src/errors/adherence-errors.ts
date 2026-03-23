export type AdherenceErrorCode =
  | "not_a_patient"
  | "patient_mismatch"
  | "item_not_found"
  | "item_not_active"
  | "log_not_found"
  | "dose_already_resolved"
  | "invalid_scheduled_time"
  | "db_read_failed"
  | "db_write_failed";

export class AdherenceError extends Error {
  constructor(
    public readonly code: AdherenceErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "AdherenceError";
  }
}

export function isAdherenceError(err: unknown): err is AdherenceError {
  return err instanceof AdherenceError;
}
