export type RefillErrorCode =
  // Actor / access
  | "not_a_patient"
  | "not_a_doctor"
  | "patient_mismatch"
  | "org_mismatch"
  // Request lifecycle
  | "request_not_found"
  | "request_not_reviewable"        // status is not in a reviewable state
  | "duplicate_pending_request"     // a pending request already exists for this prescription
  // Prescription / item
  | "prescription_not_found"
  | "prescription_not_active"
  | "prescription_item_not_found"
  | "prescription_item_not_active"
  | "prescription_item_not_eligible" // not refillable
  // Policy violations
  | "refill_not_allowed"            // refill_mode = 'not_allowed'
  | "max_refills_reached"
  | "too_early_to_refill"           // min_days_between_refills
  | "refill_policy_expired"         // absolute_expiry_date exceeded
  | "item_not_cloneable"            // missing frequency_code or route when cloning
  // DB
  | "db_read_failed"
  | "db_write_failed";

export class RefillError extends Error {
  constructor(
    public readonly code: RefillErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "RefillError";
  }
}

export function isRefillError(err: unknown): err is RefillError {
  return err instanceof RefillError;
}
