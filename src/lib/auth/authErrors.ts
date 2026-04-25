/** Outbound signup confirmation mail failed (SMTP) — user may still exist; never show raw SMTP text. */
export function isConfirmationEmailDeliveryError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("confirmation email") || m.includes("email rate limit");
}

/** User-facing text when we hide Supabase “confirmation email” errors (e.g. forgot-password). */
export const SIGNUP_EMAIL_SKIPPED_HINT =
  "Sign-up may have worked. Open Sign in and use the password you just chose.";

/**
 * Thrown from `signUp` when the account likely exists but there is no in-app session
 * (e.g. email confirm + SMTP issue). UI should redirect to sign-in instead of an error banner.
 */
export class RedirectToSignInAfterSignUp extends Error {
  constructor() {
    super(SIGNUP_EMAIL_SKIPPED_HINT);
    this.name = "RedirectToSignInAfterSignUp";
    Object.setPrototypeOf(this, RedirectToSignInAfterSignUp.prototype);
  }
}

export function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (isConfirmationEmailDeliveryError(message)) {
    return SIGNUP_EMAIL_SKIPPED_HINT;
  }
  if (m.includes("invalid login credentials")) {
    return "Wrong phone, email, or password.";
  }
  if (
    m.includes("user already registered") ||
    m.includes("already been registered")
  ) {
    return "This account already exists. Try signing in or reset your password.";
  }
  if (m.includes("password") && m.includes("least")) {
    return message;
  }
  return message;
}

/** Whether sign-up (or similar) errors should surface a “forgot password” affordance. */
export function shouldOfferPasswordRecoveryHint(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("reset your password") ||
    m.includes("already exists") ||
    m.includes("already been registered") ||
    m.includes("user already registered") ||
    m.includes("forgot password")
  );
}
