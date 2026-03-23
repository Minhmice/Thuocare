/**
 * Prescription domain error types.
 *
 * These represent business-rule violations within the prescription module.
 * They are distinct from auth errors (authentication/authorization failures),
 * which come from @thuocare/auth.
 *
 * Later API layers should map these to HTTP 400/409/422 responses.
 */

export type PrescriptionErrorCode =
  | "prescription_not_found"        // Prescription row does not exist (or actor lacks access)
  | "prescription_not_draft"        // Action requires draft status but prescription is not
  | "prescription_not_active"       // Action requires active status but prescription is not
  | "prescription_no_items"         // Cannot issue a prescription with zero items
  | "prescription_immutable"        // Cannot modify a non-draft prescription
  | "episode_not_found"             // Treatment episode does not exist or is inaccessible
  | "episode_org_mismatch"          // Episode belongs to a different organization
  | "episode_patient_mismatch"      // Episode belongs to a different patient than prescription
  | "episode_terminal"              // Episode is in a terminal status (completed/cancelled)
  | "medication_not_found"          // Medication master row does not exist
  | "item_not_found"                // Prescription item does not exist
  | "item_invalid_frequency"        // Frequency code/text is invalid or missing
  | "item_invalid_duration"         // Duration days must be > 0
  | "item_invalid_quantity"         // Computed or provided quantity is invalid
  | "item_prn_missing_reason"       // PRN item requires a prn_reason
  | "item_removal_restricted"       // Cannot remove item from a non-draft prescription
  | "db_write_failed"               // Supabase insert/update returned an error
  | "db_read_failed";               // Supabase select returned an error

export class PrescriptionError extends Error {
  readonly code: PrescriptionErrorCode;
  readonly detail: string | undefined;

  constructor(code: PrescriptionErrorCode, message: string, detail?: string) {
    super(message);
    this.name = "PrescriptionError";
    this.code = code;
    this.detail = detail;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON(): Record<string, unknown> {
    return { name: this.name, code: this.code, message: this.message, detail: this.detail };
  }
}

export function isPrescriptionError(err: unknown): err is PrescriptionError {
  return err instanceof PrescriptionError;
}
