/**
 * Authorization / access control error hierarchy.
 *
 * Access errors represent failures *after* identity is established:
 * the actor is known but lacks permission for the requested resource or action.
 *
 * Keep these separate from auth errors (auth-errors.ts).
 * Later API layers should map each code to HTTP 403.
 *
 * Design note: Never return 404 when the real issue is access denial.
 * Use resource_not_found only when the resource is known to be absent
 * AND revealing that fact is safe for the current actor.
 */

export type AccessErrorCode =
  | "forbidden"                // Generic denial — actor lacks permission
  | "organization_mismatch"    // Resource belongs to a different org than the actor
  | "clinic_mismatch"          // Resource belongs to a different clinic
  | "patient_scope_mismatch"   // Resource belongs to a patient the actor cannot access
  | "capability_denied"        // Actor's role lacks the required capability flag
  | "role_required"            // A specific role is required for this action
  | "resource_not_found"       // Resource absent (only expose when safe for actor)
  | "staff_actor_required"     // Action requires a staff actor, not a patient
  | "patient_actor_required"   // Action requires a patient actor, not staff
  | "doctor_required"          // Action requires role=doctor + active doctor_profile
  | "caregiver_link_missing";  // Caregiver is not linked to the requested patient

export class AccessError extends Error {
  readonly code: AccessErrorCode;
  readonly detail: string | undefined;

  constructor(code: AccessErrorCode, message: string, detail?: string) {
    super(message);
    this.name = "AccessError";
    this.code = code;
    this.detail = detail;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      detail: this.detail,
    };
  }
}

/** Generic denial — use when no more specific error applies. */
export class ForbiddenError extends AccessError {
  constructor(detail?: string) {
    super("forbidden", "Access denied.", detail);
    this.name = "ForbiddenError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Actor's organization does not match the resource's organization.
 * This is the primary multi-tenant boundary check.
 */
export class OrganizationMismatchError extends AccessError {
  constructor(detail?: string) {
    super(
      "organization_mismatch",
      "Resource belongs to a different organization.",
      detail,
    );
    this.name = "OrganizationMismatchError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Actor's clinic does not match the resource's clinic. */
export class ClinicMismatchError extends AccessError {
  constructor(detail?: string) {
    super("clinic_mismatch", "Resource belongs to a different clinic.", detail);
    this.name = "ClinicMismatchError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Actor does not have a permitted relationship to the patient this resource belongs to.
 * Examples: doctor not assigned to this patient, patient actor reading another patient's data.
 */
export class PatientScopeMismatchError extends AccessError {
  constructor(detail?: string) {
    super(
      "patient_scope_mismatch",
      "Actor does not have access to this patient's data.",
      detail,
    );
    this.name = "PatientScopeMismatchError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Actor's role does not have the requested capability flag. */
export class CapabilityDeniedError extends AccessError {
  constructor(capability: string, detail?: string) {
    super(
      "capability_denied",
      `Actor role does not have the '${capability}' capability.`,
      detail,
    );
    this.name = "CapabilityDeniedError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Action is restricted to a specific role and actor does not hold it. */
export class RoleRequiredError extends AccessError {
  constructor(requiredRole: string, detail?: string) {
    super(
      "role_required",
      `This action requires the '${requiredRole}' role.`,
      detail,
    );
    this.name = "RoleRequiredError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Action requires a staff actor but a patient actor is present. */
export class StaffActorRequiredError extends AccessError {
  constructor(detail?: string) {
    super("staff_actor_required", "This action requires a staff actor.", detail);
    this.name = "StaffActorRequiredError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Action requires a patient actor but a staff actor is present. */
export class PatientActorRequiredError extends AccessError {
  constructor(detail?: string) {
    super(
      "patient_actor_required",
      "This action requires a patient actor.",
      detail,
    );
    this.name = "PatientActorRequiredError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Action requires role=doctor with an active doctor_profile.
 * Distinct from RoleRequiredError because doctor_profile existence must also be checked.
 */
export class DoctorRequiredError extends AccessError {
  constructor(detail?: string) {
    super(
      "doctor_required",
      "This action requires a doctor with an active doctor_profile.",
      detail,
    );
    this.name = "DoctorRequiredError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** No active caregiver_link found connecting this actor to the requested patient. */
export class CaregiverLinkMissingError extends AccessError {
  constructor(detail?: string) {
    super(
      "caregiver_link_missing",
      "No active caregiver link found for this patient.",
      detail,
    );
    this.name = "CaregiverLinkMissingError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function isAccessError(err: unknown): err is AccessError {
  return err instanceof AccessError;
}
