/**
 * Organization scope evaluators.
 *
 * These are the primary multi-tenant boundary checks. Every resource in the
 * system belongs to an organization, and actors may only operate within their
 * own organization.
 *
 * RELATION TO DB: These complement the SQL `belongs_to_current_org()` helper
 * and the RLS SELECT/INSERT policies on every table. The application-layer
 * checks catch misuse before a DB round-trip; the DB-layer checks are the
 * authoritative enforcement boundary.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { EntityId } from "@thuocare/contracts";
import { selectOne } from "../internal/supabase-client.js";
import type { AnyActorContext, ResolvedActorContext } from "../actor/actor-types.js";
import {
  ForbiddenError,
  OrganizationMismatchError,
} from "../errors/access-errors.js";

// ─── Actor-side checks (no DB) ────────────────────────────────────────────────

/**
 * Returns true if the actor belongs to the given organization.
 * Returns false for unresolved actors.
 */
export function actorBelongsToOrg(
  actor: AnyActorContext,
  organizationId: EntityId,
): boolean {
  if (actor.kind === "unresolved") return false;
  return actor.organizationId === organizationId;
}

/**
 * Assert the actor belongs to the given organization.
 * Throws `OrganizationMismatchError` if the org IDs do not match.
 * Throws `ForbiddenError` if the actor is unresolved.
 */
export function assertActorInOrg(
  actor: AnyActorContext,
  organizationId: EntityId,
): ResolvedActorContext {
  if (actor.kind === "unresolved") {
    throw new ForbiddenError("Unresolved actor cannot access organization resources.");
  }
  if (actor.organizationId !== organizationId) {
    throw new OrganizationMismatchError(
      `Actor org=${actor.organizationId} !== resource org=${organizationId}.`,
    );
  }
  return actor;
}

// ─── Resource-side checks (DB lookups) ───────────────────────────────────────

/**
 * Verify that a resource row belongs to the actor's organization.
 *
 * Performs a thin DB lookup to read the resource's `organization_id` column.
 * Use this before any cross-org-sensitive mutation.
 *
 * @param table         - Table name (e.g., "treatment_episode").
 * @param resourceId    - The resource UUID.
 * @param actor         - The resolved actor context.
 * @param supabase      - Supabase client.
 *
 * Throws `OrganizationMismatchError` if the resource is in a different org.
 * Throws `ForbiddenError` if the resource is not found.
 */
export async function assertResourceInActorOrg(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  table: string,
  resourceId: EntityId,
  actor: AnyActorContext,
): Promise<void> {
  if (actor.kind === "unresolved") {
    throw new ForbiddenError("Unresolved actor cannot access organization resources.");
  }

  const { data, error } = await selectOne(supabase, table, "id", resourceId);

  if (error !== null || data === null) {
    throw new ForbiddenError(
      `Resource not found or inaccessible: table=${table}, id=${resourceId}.`,
    );
  }

  const row = data as Record<string, unknown>;
  const resourceOrgId = row["organization_id"];

  if (actor.kind === "patient" && actor.organizationId === null) {
    if (resourceOrgId === null || resourceOrgId === undefined) {
      return;
    }
    throw new OrganizationMismatchError(
      `table=${table} id=${resourceId} is organization-scoped; personal-lane patient has no organization.`,
    );
  }

  if (typeof resourceOrgId !== "string" || resourceOrgId !== actor.organizationId) {
    throw new OrganizationMismatchError(
      `table=${table} id=${resourceId} org=${String(resourceOrgId)} !== actor org=${actor.organizationId}.`,
    );
  }
}
