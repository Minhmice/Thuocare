/**
 * Authentication-layer guards.
 *
 * These guards enforce that an actor exists and is of the right kind before
 * business logic proceeds. They throw standardized errors that API layers can
 * catch and convert to HTTP 401/403 responses.
 *
 * Naming convention: `require*` → throws on failure.
 *
 * USAGE PATTERN:
 *   const actor = await requireResolvedActor(supabase);
 *   const staffActor = requireStaffActor(actor);
 *   requireCapability(staffActor, "canWritePrescriptions");
 *   // ... proceed with business logic
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  requireResolvedActorContext,
  resolveActorContext,
} from "../actor/actor-resolver.js";
import type {
  AnyActorContext,
  ResolvedActorContext,
  ResolvedPatientActorContext,
  ResolvedStaffActorContext,
} from "../actor/actor-types.js";
import {
  PatientActorRequiredError,
  StaffActorRequiredError,
} from "../errors/access-errors.js";
import { UnresolvedActorError } from "../errors/auth-errors.js";
import { requireAuthenticatedSession } from "../session/session-resolver.js";
import type { SessionData } from "../session/session-resolver.js";

// ─── Session guards ───────────────────────────────────────────────────────────

/**
 * Require a valid Supabase session.
 * Throws `UnauthenticatedError` if no session is present.
 */
export async function requireAuthenticated(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
): Promise<SessionData> {
  return requireAuthenticatedSession(supabase);
}

// ─── Actor resolution guards ──────────────────────────────────────────────────

/**
 * Resolve the actor context and require it to be fully resolved.
 * Throws `UnauthenticatedError` if no session.
 * Throws `UnresolvedActorError` if session exists but actor cannot be resolved.
 */
export async function requireResolvedActor(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
): Promise<ResolvedActorContext> {
  return requireResolvedActorContext(supabase);
}

/**
 * Resolve the actor context without requiring resolution.
 * Returns any actor context including unresolved.
 * Use this in onboarding flows that must handle unresolved actors.
 */
export async function loadActorContext(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
): Promise<AnyActorContext> {
  return resolveActorContext(supabase);
}

// ─── Actor kind guards (synchronous, take pre-loaded context) ─────────────────

/**
 * Require the actor to be a staff actor.
 * Throws `StaffActorRequiredError` if the actor is a patient or unresolved.
 *
 * @param actor - A pre-loaded AnyActorContext.
 */
export function requireStaffActor(actor: AnyActorContext): ResolvedStaffActorContext {
  if (actor.kind !== "staff") {
    throw new StaffActorRequiredError(
      `Actor kind is '${actor.kind}', expected 'staff'.`,
    );
  }
  return actor;
}

/**
 * Require the actor to be a patient actor.
 * Throws `PatientActorRequiredError` if the actor is staff or unresolved.
 *
 * @param actor - A pre-loaded AnyActorContext.
 */
export function requirePatientActor(actor: AnyActorContext): ResolvedPatientActorContext {
  if (actor.kind !== "patient") {
    throw new PatientActorRequiredError(
      `Actor kind is '${actor.kind}', expected 'patient'.`,
    );
  }
  return actor;
}

/**
 * Require the actor to be resolved (either staff or patient).
 * Throws `UnresolvedActorError` if the actor is in the unresolved state.
 *
 * Use this when you have a pre-loaded AnyActorContext and want to narrow it.
 */
export function requireResolvedActorFromContext(
  actor: AnyActorContext,
): ResolvedActorContext {
  if (actor.kind === "unresolved") {
    throw new UnresolvedActorError(
      `Actor binding state: ${actor.bindingState}. authUserId=${actor.authUserId}`,
    );
  }
  return actor;
}

// ─── Async convenience variants ───────────────────────────────────────────────

/**
 * Resolve actor and require staff in one call.
 * Throws on unauthenticated, unresolved, or patient actor.
 */
export async function requireStaffSession(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
): Promise<ResolvedStaffActorContext> {
  const actor = await requireResolvedActor(supabase);
  return requireStaffActor(actor);
}

/**
 * Resolve actor and require patient in one call.
 * Throws on unauthenticated, unresolved, or staff actor.
 */
export async function requirePatientSession(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
): Promise<ResolvedPatientActorContext> {
  const actor = await requireResolvedActor(supabase);
  return requirePatientActor(actor);
}
