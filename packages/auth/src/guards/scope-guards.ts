/**
 * Scope guards.
 *
 * These guards enforce that the actor is operating within the correct
 * organizational / clinical / patient / resource scope.
 *
 * All guards are synchronous where no DB lookup is needed (org/clinic/doctor
 * scopes are derivable from the actor context). Patient-scope and resource-access
 * guards that require a DB check are in the access/ modules.
 *
 * DESIGN: Accept pre-loaded actor contexts. Callers should have already loaded
 * the actor context before calling these guards.
 */

import type { EntityId } from "@thuocare/contracts";
import type {
  AnyActorContext,
  ResolvedActorContext,
  ResolvedStaffActorContext,
} from "../actor/actor-types.js";
import {
  ClinicMismatchError,
  DoctorRequiredError,
  ForbiddenError,
  OrganizationMismatchError,
} from "../errors/access-errors.js";

// ─── Organization scope ───────────────────────────────────────────────────────

/**
 * Require the actor to belong to the given organization.
 *
 * Throws `OrganizationMismatchError` if the actor's organizationId does not match.
 * Throws `ForbiddenError` if the actor is unresolved (no org context).
 *
 * This is the primary multi-tenant boundary check. Use it whenever a resource
 * query or mutation is tied to a specific organization.
 */
export function requireOrganizationScope(
  actor: AnyActorContext,
  organizationId: EntityId,
): ResolvedActorContext {
  if (actor.kind === "unresolved") {
    throw new ForbiddenError(
      "Unresolved actor cannot access organization-scoped resources.",
    );
  }
  if (actor.organizationId !== organizationId) {
    throw new OrganizationMismatchError(
      `Actor org=${actor.organizationId} does not match resource org=${organizationId}.`,
    );
  }
  return actor;
}

/**
 * Require the actor to belong to the given organization (inline check).
 * Returns `true` if the actor's org matches, `false` otherwise.
 * Does NOT throw — use when you need conditional logic rather than a hard gate.
 */
export function actorBelongsToOrganization(
  actor: AnyActorContext,
  organizationId: EntityId,
): boolean {
  if (actor.kind === "unresolved") return false;
  return actor.organizationId === organizationId;
}

// ─── Clinic scope ─────────────────────────────────────────────────────────────

/**
 * Require the actor's clinic to match the given clinicId.
 *
 * Throws `ClinicMismatchError` if the actor has a clinic binding that does not match.
 * Does NOT throw if the actor has no clinic binding (null clinicId = org-wide scope).
 *
 * Rationale: Not all staff members are clinic-scoped. Org-wide admin/coordinator
 * roles typically have clinicId = null and should be allowed to operate across clinics
 * within their org. Only enforce this check when the resource requires strict
 * clinic matching (e.g., a feature that is explicitly single-clinic).
 */
export function requireClinicScope(
  actor: AnyActorContext,
  clinicId: EntityId,
): ResolvedStaffActorContext {
  if (actor.kind !== "staff") {
    throw new ClinicMismatchError("Only staff actors have clinic scope.");
  }
  if (actor.clinicId !== null && actor.clinicId !== clinicId) {
    throw new ClinicMismatchError(
      `Actor clinic=${actor.clinicId} does not match resource clinic=${clinicId}.`,
    );
  }
  return actor;
}

/**
 * Check if an actor is within the given clinic scope.
 * Returns `true` if actor has no clinic binding (org-wide) or binding matches.
 * Returns `false` if actor has a different clinic binding.
 */
export function actorBelongsToClinic(
  actor: AnyActorContext,
  clinicId: EntityId,
): boolean {
  if (actor.kind !== "staff") return false;
  // null clinicId means org-wide access — passes clinic scope check
  if (actor.clinicId === null) return true;
  return actor.clinicId === clinicId;
}

// ─── Doctor scope ─────────────────────────────────────────────────────────────

/**
 * Require the actor to be the doctor identified by the given doctorProfileId.
 *
 * Use this when an action is restricted to the specific doctor who owns a resource
 * (e.g., only the authoring doctor can amend their own prescription draft).
 *
 * Throws `DoctorRequiredError` if actor is not a doctor.
 * Throws `ForbiddenError` if the actor is a doctor but the profile IDs don't match.
 *
 * Note: Admin actors are NOT allowed through this guard by design. If you need
 * admin override, check separately.
 */
export function requireDoctorScope(
  actor: AnyActorContext,
  doctorProfileId: EntityId,
): ResolvedStaffActorContext & { doctorProfileId: EntityId } {
  if (actor.kind !== "staff" || actor.role !== "doctor") {
    throw new DoctorRequiredError("Actor is not a doctor.");
  }
  if (actor.doctorProfileId === null) {
    throw new DoctorRequiredError("Actor has no active doctor_profile.");
  }
  if (actor.doctorProfileId !== doctorProfileId) {
    throw new ForbiddenError(
      `Doctor scope mismatch: actor doctor_profile=${actor.doctorProfileId}, ` +
        `required=${doctorProfileId}.`,
    );
  }
  return actor as ResolvedStaffActorContext & { doctorProfileId: EntityId };
}

/**
 * Check if the actor IS the given doctor (by doctorProfileId).
 * Returns false for non-doctor actors.
 */
export function actorIsDoctorWithProfileId(
  actor: AnyActorContext,
  doctorProfileId: EntityId,
): boolean {
  return (
    actor.kind === "staff" &&
    actor.role === "doctor" &&
    actor.doctorProfileId === doctorProfileId
  );
}
