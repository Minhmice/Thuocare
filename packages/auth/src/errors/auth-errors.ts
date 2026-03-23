/**
 * Authentication error hierarchy.
 *
 * Auth errors represent failures *before* business-actor identity is established:
 * no session, session exists but actor link is broken, onboarding incomplete, etc.
 *
 * Keep these separate from access/authorization errors (access-errors.ts).
 * Later API layers should map each code to an appropriate HTTP status (usually 401).
 */

export type AuthErrorCode =
  | "unauthenticated"        // No valid Supabase session present
  | "unresolved_actor"       // Session exists but actor cannot be resolved from DB
  | "missing_binding"        // Auth user has no linked user_account or patient row
  | "onboarding_incomplete"  // Actor is mid-onboarding; claim flow not finished
  | "session_load_failed"    // Supabase returned an error when loading the session
  | "actor_load_failed";     // DB error while resolving actor context

export class AuthError extends Error {
  readonly code: AuthErrorCode;
  readonly detail: string | undefined;

  constructor(code: AuthErrorCode, message: string, detail?: string) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.detail = detail;
    // Maintains proper prototype chain in transpiled code
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

/** No valid Supabase session — user must log in. */
export class UnauthenticatedError extends AuthError {
  constructor(detail?: string) {
    super("unauthenticated", "No authenticated session found.", detail);
    this.name = "UnauthenticatedError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Session exists but no user_account or patient row can be linked to the auth user.
 * This usually means onboarding must be completed before the actor can operate.
 */
export class UnresolvedActorError extends AuthError {
  constructor(detail?: string) {
    super(
      "unresolved_actor",
      "Authenticated user has no resolvable actor context. Onboarding may be required.",
      detail,
    );
    this.name = "UnresolvedActorError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Auth user exists but has no linked user_account (for staff) or patient (for patients).
 * Distinct from UnresolvedActorError in that the binding state is definitively empty,
 * not merely ambiguous or in-progress.
 */
export class MissingBindingError extends AuthError {
  constructor(detail?: string) {
    super(
      "missing_binding",
      "Auth user has no linked user_account or patient record.",
      detail,
    );
    this.name = "MissingBindingError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Auth user has been linked but onboarding flow is not complete.
 * The actor should be routed to an onboarding or claim flow, not the main app.
 */
export class OnboardingIncompleteError extends AuthError {
  constructor(detail?: string) {
    super(
      "onboarding_incomplete",
      "Actor onboarding is incomplete. Complete account claim to continue.",
      detail,
    );
    this.name = "OnboardingIncompleteError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function isAuthError(err: unknown): err is AuthError {
  return err instanceof AuthError;
}

export function isUnauthenticated(err: unknown): err is UnauthenticatedError {
  return err instanceof UnauthenticatedError;
}
