/**
 * Doctor workspace domain error types.
 *
 * Covers workspace-specific failures: entity not found, access scope violations,
 * and invalid workflow transitions. Auth errors (unauthenticated, forbidden)
 * still propagate as-is from @thuocare/auth.
 */

export type WorkspaceErrorCode =
  | "not_a_doctor"              // Actor is staff but not a doctor
  | "doctor_profile_missing"    // Actor has doctor role but no doctor_profile_id
  | "patient_not_found"         // Patient not found or not in actor's organization
  | "episode_not_found"         // Treatment episode not found or org mismatch
  | "episode_org_mismatch"      // Episode belongs to a different org
  | "encounter_not_found"       // Encounter not found
  | "prescription_not_found"    // Prescription not found
  | "prescription_no_items"     // Cannot duplicate a prescription with no items
  | "duplicate_active_only"     // Can only duplicate non-terminal prescriptions
  | "db_read_failed";            // DB select returned an error

export class WorkspaceError extends Error {
  readonly code: WorkspaceErrorCode;
  readonly detail: string | undefined;

  constructor(code: WorkspaceErrorCode, message: string, detail?: string) {
    super(message);
    this.name = "WorkspaceError";
    this.code = code;
    this.detail = detail;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON(): Record<string, unknown> {
    return { name: this.name, code: this.code, message: this.message, detail: this.detail };
  }
}

export function isWorkspaceError(err: unknown): err is WorkspaceError {
  return err instanceof WorkspaceError;
}
