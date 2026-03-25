export type PersonalErrorCode =
  | "personal_profile_not_found"
  | "personal_medication_not_found"
  | "medication_already_stopped"
  | "schedule_invalid"
  | "patient_mismatch"
  | "invalid_dose_reset";

export class PersonalError extends Error {
  readonly code: PersonalErrorCode;

  constructor(code: PersonalErrorCode, message: string) {
    super(message);
    this.name = "PersonalError";
    this.code = code;
  }
}

export function isPersonalError(e: unknown): e is PersonalError {
  return e instanceof PersonalError;
}
