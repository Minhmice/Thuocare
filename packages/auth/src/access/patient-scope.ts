/**
 * Patient scope evaluators.
 *
 * Patient scope checks enforce WHO can access a patient's data:
 *   1. Self access — the patient actor reading/acting on their own record.
 *   2. Staff access — any staff actor within the same organization (RLS enforces this).
 *   3. Doctor-patient scoped access — when stricter restriction is needed (see doctor-scope.ts).
 *
 * RELATION TO DB:
 *   - SQL `is_current_patient(patient_id)` checks patient self-access in RLS.
 *   - SQL `patient_belongs_to_current_org(patient_id)` checks staff-side access.
 *   These application-layer checks mirror those for early-exit and clearer error messages.
 *
 * NOTE ON CAREGIVER ACCESS:
 *   The current schema stores caregiver contacts via `caregiver_link` but caregivers
 *   do NOT have their own auth_user_id or system login. Caregiver access is therefore
 *   handled through notifications and patient-delegated views, not a separate actor type.
 *   See caregiver-scope.ts for advisory helpers.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { EntityId } from "@thuocare/contracts";
import { selectOne } from "../internal/supabase-client.js";
import type {
  AnyActorContext,
  ResolvedActorContext,
  ResolvedPatientActorContext,
  ResolvedStaffActorContext,
} from "../actor/actor-types.js";
import {
  ForbiddenError,
  OrganizationMismatchError,
  PatientScopeMismatchError,
} from "../errors/access-errors.js";

// ─── Self-access check ────────────────────────────────────────────────────────

/**
 * Returns true if the actor is the patient actor for the given patientId.
 * Mirrors SQL: `is_current_patient(target_patient_id)`.
 */
export function isSelfPatientAccess(
  actor: AnyActorContext,
  patientId: EntityId,
): boolean {
  return actor.kind === "patient" && actor.patientId === patientId;
}

/**
 * Require the actor to be the patient themselves.
 * Throws `PatientScopeMismatchError` if not.
 */
export function requireSelfPatientAccess(
  actor: AnyActorContext,
  patientId: EntityId,
): ResolvedPatientActorContext {
  if (actor.kind !== "patient") {
    throw new PatientScopeMismatchError(
      `Self-patient access required: actor is kind='${actor.kind}'.`,
    );
  }
  if (actor.patientId !== patientId) {
    throw new PatientScopeMismatchError(
      `Actor patientId=${actor.patientId} !== requested patientId=${patientId}.`,
    );
  }
  return actor;
}

// ─── Staff-access check (org boundary only) ───────────────────────────────────

/**
 * Verify that a patient belongs to the actor's organization.
 *
 * This is the default staff access check — any staff member within the org can
 * access any patient in that org (as enforced by RLS).
 *
 * @returns The resolved actor on success.
 * Throws `OrganizationMismatchError` if the patient is in a different org.
 * Throws `ForbiddenError` if actor is unresolved or patient not found.
 *
 * NOTE: This does NOT enforce doctor-patient assignment. Use doctor-scope.ts
 * for stricter doctor-patient ownership checks if needed for a specific feature.
 */
export async function requirePatientInActorOrg(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  patientId: EntityId,
  actor: AnyActorContext,
): Promise<ResolvedActorContext> {
  if (actor.kind === "unresolved") {
    throw new ForbiddenError("Unresolved actor cannot access patient data.");
  }

  // Patient actor: only self-access is allowed at this level
  if (actor.kind === "patient") {
    if (actor.patientId !== patientId) {
      throw new PatientScopeMismatchError(
        `Patient actor patientId=${actor.patientId} cannot access patient=${patientId}.`,
      );
    }
    return actor;
  }

  // Staff actor: verify patient belongs to the same org
  const { data, error } = await selectOne(supabase, "patient", "id", patientId);

  if (error !== null || data === null) {
    throw new ForbiddenError(`Patient not found or inaccessible: id=${patientId}.`);
  }

  const patient = data as Record<string, unknown>;
  const patientOrgId = patient["organization_id"];

  if (typeof patientOrgId !== "string" || patientOrgId !== actor.organizationId) {
    throw new OrganizationMismatchError(
      `Patient org=${String(patientOrgId)} !== actor org=${actor.organizationId}.`,
    );
  }

  return actor;
}

// ─── Combined patient access check ────────────────────────────────────────────

/**
 * Universal patient access check covering both patient-actor and staff-actor cases.
 *
 * For a patient actor: only self-access passes.
 * For a staff actor: org boundary check passes.
 *
 * This is the recommended check for most patient-data endpoints.
 */
export async function requirePatientAccess(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  patientId: EntityId,
  actor: AnyActorContext,
): Promise<ResolvedActorContext> {
  return requirePatientInActorOrg(supabase, patientId, actor);
}

// ─── Patient resource ownership check ────────────────────────────────────────

/**
 * Verify that a patient-owned resource belongs to a patient the actor can access.
 *
 * The `patientIdColumn` defaults to "patient_id" — the standard column name
 * used across treatment_episode, prescription, etc.
 *
 * For staff actors: verifies the patient is in their org (via patient lookup).
 * For patient actors: verifies the resource belongs to themselves.
 */
export async function requirePatientResourceAccess(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  table: string,
  resourceId: EntityId,
  actor: AnyActorContext,
  patientIdColumn = "patient_id",
): Promise<void> {
  if (actor.kind === "unresolved") {
    throw new ForbiddenError("Unresolved actor cannot access patient resources.");
  }

  const { data, error } = await selectOne(supabase, table, "id", resourceId);

  if (error !== null || data === null) {
    throw new ForbiddenError(
      `Resource not found or inaccessible: table=${table}, id=${resourceId}.`,
    );
  }

  const row = data as Record<string, unknown>;
  const rowPatientId = row[patientIdColumn];

  if (typeof rowPatientId !== "string") {
    throw new ForbiddenError(
      `Resource table=${table} id=${resourceId} has no valid ${patientIdColumn}.`,
    );
  }

  if (actor.kind === "patient") {
    if (actor.patientId !== rowPatientId) {
      throw new PatientScopeMismatchError(
        `Patient actor (${actor.patientId}) cannot access resource owned by patient=${rowPatientId}.`,
      );
    }
    return;
  }

  // Staff: verify the patient on the resource is in the actor's org
  await requirePatientInActorOrg(supabase, rowPatientId, actor);
}

// ─── Narrow staff helpers ─────────────────────────────────────────────────────

/**
 * Require the actor to be a staff member (not a patient) before accessing
 * patient data in a write/management context.
 *
 * Throws `PatientScopeMismatchError` if the actor is a patient.
 * This is useful when patients should read-only and staff should write.
 */
export function requireStaffForPatientWrite(
  actor: AnyActorContext,
): ResolvedStaffActorContext {
  if (actor.kind !== "staff") {
    throw new PatientScopeMismatchError(
      "Write access to patient data requires a staff actor.",
    );
  }
  return actor;
}
