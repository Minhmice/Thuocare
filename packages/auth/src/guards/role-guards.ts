/**
 * Role and capability guards.
 *
 * These guards enforce role and capability requirements on a pre-loaded actor context.
 * They all throw `AccessError` subtypes on failure.
 *
 * DESIGN: Accept an `AnyActorContext` (or `ResolvedActorContext`) parameter rather than
 * taking a Supabase client, because by the time you check roles/capabilities you should
 * already have the actor context loaded. This avoids redundant DB calls and makes guards
 * composable and testable.
 *
 * USAGE:
 *   const actor = await requireStaffSession(supabase);
 *   requireCapability(actor, "canWritePrescriptions");
 *   requireRole(actor, "doctor");
 */

import type { UserRole } from "@thuocare/contracts";
import type { AnyActorContext, FullCapabilities, ResolvedStaffActorContext } from "../actor/actor-types.js";
import { hasCapability } from "../capabilities/capability-resolver.js";
import {
  CapabilityDeniedError,
  DoctorRequiredError,
  RoleRequiredError,
  StaffActorRequiredError,
} from "../errors/access-errors.js";

// ─── Role guards ──────────────────────────────────────────────────────────────

/**
 * Require the actor to hold a specific staff role.
 *
 * Throws `StaffActorRequiredError` if the actor is not staff.
 * Throws `RoleRequiredError` if the actor is staff but holds a different role.
 *
 * Returns the staff context narrowed to the given role for type-safe downstream use.
 */
export function requireRole(
  actor: AnyActorContext,
  role: UserRole,
): ResolvedStaffActorContext {
  if (actor.kind !== "staff") {
    throw new StaffActorRequiredError(`requireRole('${role}'): actor is not staff.`);
  }
  if (actor.role !== role) {
    throw new RoleRequiredError(
      role,
      `Actor has role '${actor.role}', required '${role}'.`,
    );
  }
  return actor;
}

/**
 * Require the actor to hold one of the given staff roles.
 *
 * Throws `StaffActorRequiredError` if not staff.
 * Throws `RoleRequiredError` if none of the allowed roles match.
 */
export function requireAnyRole(
  actor: AnyActorContext,
  roles: readonly UserRole[],
): ResolvedStaffActorContext {
  if (actor.kind !== "staff") {
    throw new StaffActorRequiredError(
      `requireAnyRole([${roles.join(", ")}]): actor is not staff.`,
    );
  }
  if (!roles.includes(actor.role)) {
    throw new RoleRequiredError(
      roles.join(" | "),
      `Actor has role '${actor.role}', required one of [${roles.join(", ")}].`,
    );
  }
  return actor;
}

/**
 * Require the actor to have the `doctor` role AND an active doctor_profile.
 *
 * Throws `DoctorRequiredError` if either condition is not met.
 * Returns the staff context narrowed with a guaranteed non-null doctorProfileId.
 */
export function requireDoctorActor(
  actor: AnyActorContext,
): ResolvedStaffActorContext & { doctorProfileId: string } {
  if (actor.kind !== "staff") {
    throw new DoctorRequiredError("Actor is not staff.");
  }
  if (actor.role !== "doctor") {
    throw new DoctorRequiredError(`Actor has role '${actor.role}', required 'doctor'.`);
  }
  if (actor.doctorProfileId === null) {
    throw new DoctorRequiredError(
      `Actor has role 'doctor' but no active doctor_profile. Onboarding may be incomplete.`,
    );
  }
  return actor as ResolvedStaffActorContext & { doctorProfileId: string };
}

// ─── Capability guards ────────────────────────────────────────────────────────

/**
 * Require the actor to have a specific capability flag set to `true`.
 *
 * Throws `CapabilityDeniedError` if the capability is absent.
 *
 * Examples:
 *   requireCapability(actor, "canWritePrescriptions");
 *   requireCapability(actor, "canManageMedicationCatalog");
 */
export function requireCapability(
  actor: AnyActorContext,
  capability: keyof FullCapabilities,
): void {
  if (!hasCapability(actor, capability)) {
    throw new CapabilityDeniedError(
      capability,
      `Actor (kind=${actor.kind}${actor.kind === "staff" ? `, role=${actor.role}` : ""}) lacks '${capability}'.`,
    );
  }
}

/**
 * Require the actor to have ALL of the given capability flags.
 * Throws `CapabilityDeniedError` for the first missing capability.
 */
export function requireAllCapabilities(
  actor: AnyActorContext,
  capabilities: readonly (keyof FullCapabilities)[],
): void {
  for (const cap of capabilities) {
    requireCapability(actor, cap);
  }
}

/**
 * Require the actor to have at least ONE of the given capability flags.
 * Throws `CapabilityDeniedError` if none are present.
 */
export function requireAnyCapability(
  actor: AnyActorContext,
  capabilities: readonly (keyof FullCapabilities)[],
): void {
  for (const cap of capabilities) {
    if (hasCapability(actor, cap)) return;
  }
  throw new CapabilityDeniedError(
    capabilities.join(" | "),
    `Actor lacks all of [${capabilities.join(", ")}].`,
  );
}
