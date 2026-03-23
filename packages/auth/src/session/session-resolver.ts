/**
 * Session resolution layer.
 *
 * Responsibilities:
 * - Extract the currently authenticated Supabase user.
 * - Provide typed SessionData with only the fields downstream code needs.
 * - Distinguish between "no session" (null) and "session load error" (throws).
 *
 * IMPORTANT: We use `supabase.auth.getUser()`, NOT `getSession()`.
 * `getUser()` sends the JWT to the Supabase Auth server for re-validation,
 * making it safe for server-side use (Next.js server components, API routes).
 * `getSession()` trusts the local JWT cache and must NOT be used server-side.
 *
 * This layer is intentionally thin — it knows nothing about business actors.
 * Use the actor resolver (actor/actor-resolver.ts) for business identity.
 */

import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { AuthUserId, Email } from "@thuocare/contracts";
import { UnauthenticatedError } from "../errors/auth-errors.js";

/**
 * Minimal representation of the authenticated Supabase session.
 *
 * Does NOT include business-actor context — use ActorContext for that.
 * Only expose fields actually needed downstream; avoid spreading `rawUser` widely.
 */
export interface SessionData {
  /** auth.users.id — the stable auth-layer identity. */
  authUserId: AuthUserId;
  /** Lowercased email from the JWT, if present. */
  email: Email | null;
  /**
   * Raw Supabase User object.
   * Access only when you need metadata not surfaced above (e.g., user_metadata).
   * Do not spread this across unrelated modules.
   */
  rawUser: User;
}

/**
 * Resolve the current Supabase session.
 *
 * Returns `null` if no authenticated user is present.
 * Throws `UnauthenticatedError` only on transport / server errors (not on missing auth).
 *
 * @param supabase - Any Supabase client (server or browser).
 */
export async function getCurrentSession(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
): Promise<SessionData | null> {
  const { data, error } = await supabase.auth.getUser();

  if (error !== null) {
    // An error here means the auth server was unreachable or the token is
    // structurally invalid — not just "no session". Surface as a named error.
    throw new UnauthenticatedError(`Supabase auth.getUser() failed: ${error.message}`);
  }

  if (data.user === null) {
    return null;
  }

  return {
    authUserId: data.user.id as AuthUserId,
    email: (data.user.email?.toLowerCase() ?? null) as Email | null,
    rawUser: data.user,
  };
}

/**
 * Require an authenticated session.
 * Throws `UnauthenticatedError` if the user is not logged in.
 *
 * Use this at the top of any server action or API route that requires login.
 */
export async function requireAuthenticatedSession(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
): Promise<SessionData> {
  const session = await getCurrentSession(supabase);
  if (session === null) {
    throw new UnauthenticatedError("No valid Supabase session found.");
  }
  return session;
}

/**
 * Convenience helper — extract only the auth user ID from the current session.
 * Returns `null` if unauthenticated.
 */
export async function getAuthUserId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
): Promise<AuthUserId | null> {
  const session = await getCurrentSession(supabase);
  return session?.authUserId ?? null;
}
