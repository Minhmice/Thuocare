/**
 * Clinic scope evaluators.
 *
 * Clinics are sub-units within an organization. Not all resources are
 * clinic-scoped (some are org-wide), and not all staff are clinic-scoped
 * (org-wide admin/coordinator roles have clinicId = null).
 *
 * Clinic scope checks must always be layered ON TOP of org scope checks.
 * Never check clinic scope without first confirming org scope.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { EntityId } from "@thuocare/contracts";
import { selectOne } from "../internal/supabase-client.js";
import type { AnyActorContext, ResolvedStaffActorContext } from "../actor/actor-types.js";
import { ClinicMismatchError, ForbiddenError } from "../errors/access-errors.js";

// ─── Actor-side checks (no DB) ────────────────────────────────────────────────

/**
 * Returns true if the actor passes the clinic scope check for the given clinicId.
 *
 * - Staff with clinicId = null → org-wide → passes all clinic checks.
 * - Staff with clinicId set → must match.
 * - Patient or unresolved actor → false.
 */
export function actorPassesClinicScope(
  actor: AnyActorContext,
  clinicId: EntityId,
): boolean {
  if (actor.kind !== "staff") return false;
  if (actor.clinicId === null) return true; // Org-wide actor
  return actor.clinicId === clinicId;
}

/**
 * Assert the actor's clinic scope covers the given clinicId.
 * Throws `ClinicMismatchError` if the actor is clinic-scoped to a different clinic.
 * Throws `ForbiddenError` if the actor is not staff (patients have no clinic scope).
 */
export function assertActorClinicScope(
  actor: AnyActorContext,
  clinicId: EntityId,
): ResolvedStaffActorContext {
  if (actor.kind !== "staff") {
    throw new ForbiddenError("Only staff actors have clinic scope.");
  }
  if (actor.clinicId !== null && actor.clinicId !== clinicId) {
    throw new ClinicMismatchError(
      `Actor clinic=${actor.clinicId} !== resource clinic=${clinicId}.`,
    );
  }
  return actor;
}

// ─── Resource-side checks (DB lookups) ───────────────────────────────────────

/**
 * Verify that a resource row belongs to the actor's clinic (if clinic-scoped).
 *
 * If the resource has no `clinic_id` column or it is null, this check passes —
 * org-level resources are not clinic-restricted.
 *
 * @param table      - Table name (e.g., "encounter").
 * @param resourceId - The resource UUID.
 * @param actor      - The resolved staff actor context.
 * @param supabase   - Supabase client.
 */
export async function assertResourceInActorClinic(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  table: string,
  resourceId: EntityId,
  actor: AnyActorContext,
): Promise<void> {
  if (actor.kind !== "staff") {
    throw new ForbiddenError("Only staff actors have clinic scope.");
  }

  // Org-wide actor — no clinic restriction
  if (actor.clinicId === null) return;

  const { data, error } = await selectOne(supabase, table, "id", resourceId);

  if (error !== null || data === null) {
    throw new ForbiddenError(
      `Resource not found or inaccessible: table=${table}, id=${resourceId}.`,
    );
  }

  const row = data as Record<string, unknown>;
  const resourceClinicId = row["clinic_id"];

  // Resource has no clinic_id (org-level) — passes
  if (resourceClinicId === null || resourceClinicId === undefined) return;

  if (typeof resourceClinicId !== "string" || resourceClinicId !== actor.clinicId) {
    throw new ClinicMismatchError(
      `table=${table} id=${resourceId} clinic=${String(resourceClinicId)} !== actor clinic=${actor.clinicId}.`,
    );
  }
}
