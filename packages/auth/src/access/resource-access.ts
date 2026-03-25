/**
 * Resource access evaluators.
 *
 * Provides a unified interface for checking actor access to specific resource types.
 * Later modules should import these evaluators instead of writing access logic inline.
 *
 * DESIGN:
 * - Each evaluator returns an `AccessResult` — a typed value object, NOT a thrown error.
 * - Use `assertResourceAccess()` to convert an AccessResult into a thrown error.
 * - This separation allows callers to either throw (guards) or branch (conditional logic).
 *
 * COVERAGE:
 *   organization         - org boundary only (actor org match)
 *   clinic               - clinic + org boundary
 *   patient              - self or org-scoped staff
 *   treatment_episode    - patient scope + org boundary
 *   encounter            - patient scope + org boundary
 *   prescription         - patient scope + org boundary
 *   prescription_item    - via parent prescription
 *   refill_request       - patient self or staff in org
 *   follow_up_plan       - patient scope + org boundary
 *   appointment          - patient scope + org boundary
 *
 * DB COMPLEMENT: These checks complement, not replace, RLS SELECT/UPDATE policies.
 * The DB will enforce org boundaries even if app-layer checks are bypassed.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { EntityId } from "@thuocare/contracts";
import { selectOne } from "../internal/supabase-client.js";
import type { AnyActorContext } from "../actor/actor-types.js";
import type { AccessErrorCode } from "../errors/access-errors.js";
import {
  ForbiddenError,
  OrganizationMismatchError,
  PatientScopeMismatchError,
} from "../errors/access-errors.js";

// ─── Result types ─────────────────────────────────────────────────────────────

export type AccessResult =
  | { allowed: true }
  | { allowed: false; reason: AccessErrorCode; detail: string };

export const ACCESS_ALLOWED: AccessResult = { allowed: true };

export function accessDenied(
  reason: AccessErrorCode,
  detail: string,
): AccessResult {
  return { allowed: false, reason, detail };
}

/**
 * Convert an AccessResult into a thrown AccessError if denied.
 * No-op if allowed.
 */
export function assertResourceAccess(result: AccessResult): void {
  if (!result.allowed) {
    switch (result.reason) {
      case "organization_mismatch":
        throw new OrganizationMismatchError(result.detail);
      case "patient_scope_mismatch":
        throw new PatientScopeMismatchError(result.detail);
      default:
        throw new ForbiddenError(result.detail);
    }
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function fetchRow(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  table: string,
  id: EntityId,
): Promise<Record<string, unknown> | null> {
  const { data, error } = await selectOne(supabase, table, "id", id);
  if (error !== null || data === null) return null;
  return data as Record<string, unknown>;
}

function checkOrgBoundary(
  row: Record<string, unknown>,
  actor: AnyActorContext,
  resourceLabel: string,
): AccessResult {
  if (actor.kind === "unresolved") {
    return accessDenied("forbidden", `Unresolved actor cannot access ${resourceLabel}.`);
  }
  const rowOrgId = row["organization_id"];
  /**
   * Self-serve patients are resolved with `organizationId === null`. They may only
   * access org-scoped rows that also have a null organization_id; hospital-scoped
   * resources remain blocked.
   */
  if (actor.kind === "patient" && actor.organizationId === null) {
    if (rowOrgId === null || rowOrgId === undefined) {
      return ACCESS_ALLOWED;
    }
    return accessDenied(
      "organization_mismatch",
      `${resourceLabel} is organization-scoped; personal-lane patient has no organization.`,
    );
  }
  if (typeof rowOrgId !== "string" || rowOrgId !== actor.organizationId) {
    return accessDenied(
      "organization_mismatch",
      `${resourceLabel} org=${String(rowOrgId)} !== actor org=${actor.organizationId}.`,
    );
  }
  return ACCESS_ALLOWED;
}

function checkPatientBoundary(
  row: Record<string, unknown>,
  actor: AnyActorContext,
  resourceLabel: string,
): AccessResult {
  if (actor.kind === "patient") {
    const rowPatientId = row["patient_id"];
    if (typeof rowPatientId !== "string" || rowPatientId !== actor.patientId) {
      return accessDenied(
        "patient_scope_mismatch",
        `${resourceLabel} patient=${String(rowPatientId)} !== actor patient=${actor.patientId}.`,
      );
    }
  }
  return ACCESS_ALLOWED;
}

// ─── Resource-specific evaluators ────────────────────────────────────────────

/**
 * Can the actor access the given patient record?
 *
 * Staff: org boundary check.
 * Patient: self-access only.
 */
export async function canActorAccessPatient(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  patientId: EntityId,
  actor: AnyActorContext,
): Promise<AccessResult> {
  if (actor.kind === "unresolved") {
    return accessDenied("forbidden", "Unresolved actor cannot access patient data.");
  }
  if (actor.kind === "patient") {
    return actor.patientId === patientId
      ? ACCESS_ALLOWED
      : accessDenied(
          "patient_scope_mismatch",
          `Patient actor (${actor.patientId}) cannot access patient=${patientId}.`,
        );
  }
  // Staff: org boundary
  const row = await fetchRow(supabase, "patient", patientId);
  if (row === null) {
    return accessDenied("resource_not_found", `Patient not found: id=${patientId}.`);
  }
  return checkOrgBoundary(row, actor, `patient id=${patientId}`);
}

/**
 * Can the actor access the given treatment episode?
 */
export async function canActorAccessTreatmentEpisode(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  episodeId: EntityId,
  actor: AnyActorContext,
): Promise<AccessResult> {
  if (actor.kind === "unresolved") {
    return accessDenied("forbidden", "Unresolved actor cannot access episodes.");
  }
  const row = await fetchRow(supabase, "treatment_episode", episodeId);
  if (row === null) {
    return accessDenied("resource_not_found", `Episode not found: id=${episodeId}.`);
  }
  const orgCheck = checkOrgBoundary(row, actor, `episode id=${episodeId}`);
  if (!orgCheck.allowed) return orgCheck;
  return checkPatientBoundary(row, actor, `episode id=${episodeId}`);
}

/**
 * Can the actor access the given encounter?
 */
export async function canActorAccessEncounter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  encounterId: EntityId,
  actor: AnyActorContext,
): Promise<AccessResult> {
  if (actor.kind === "unresolved") {
    return accessDenied("forbidden", "Unresolved actor cannot access encounters.");
  }
  const row = await fetchRow(supabase, "encounter", encounterId);
  if (row === null) {
    return accessDenied("resource_not_found", `Encounter not found: id=${encounterId}.`);
  }
  const orgCheck = checkOrgBoundary(row, actor, `encounter id=${encounterId}`);
  if (!orgCheck.allowed) return orgCheck;
  return checkPatientBoundary(row, actor, `encounter id=${encounterId}`);
}

/**
 * Can the actor access the given prescription?
 */
export async function canActorAccessPrescription(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  prescriptionId: EntityId,
  actor: AnyActorContext,
): Promise<AccessResult> {
  if (actor.kind === "unresolved") {
    return accessDenied("forbidden", "Unresolved actor cannot access prescriptions.");
  }
  const row = await fetchRow(supabase, "prescription", prescriptionId);
  if (row === null) {
    return accessDenied("resource_not_found", `Prescription not found: id=${prescriptionId}.`);
  }
  const orgCheck = checkOrgBoundary(row, actor, `prescription id=${prescriptionId}`);
  if (!orgCheck.allowed) return orgCheck;
  return checkPatientBoundary(row, actor, `prescription id=${prescriptionId}`);
}

/**
 * Can the actor access the given prescription item?
 * Resolved via the parent prescription.
 */
export async function canActorAccessPrescriptionItem(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  prescriptionItemId: EntityId,
  actor: AnyActorContext,
): Promise<AccessResult> {
  if (actor.kind === "unresolved") {
    return accessDenied("forbidden", "Unresolved actor cannot access prescription items.");
  }
  const itemRow = await fetchRow(supabase, "prescription_item", prescriptionItemId);
  if (itemRow === null) {
    return accessDenied("resource_not_found", `PrescriptionItem not found: id=${prescriptionItemId}.`);
  }
  const parentId = itemRow["prescription_id"];
  if (typeof parentId !== "string") {
    return accessDenied("forbidden", `PrescriptionItem id=${prescriptionItemId} has no parent prescription.`);
  }
  return canActorAccessPrescription(supabase, parentId, actor);
}

/**
 * Can the actor access the given refill request?
 *
 * Staff: org boundary.
 * Patient: self-access (own patient_id).
 */
export async function canActorAccessRefillRequest(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  refillRequestId: EntityId,
  actor: AnyActorContext,
): Promise<AccessResult> {
  if (actor.kind === "unresolved") {
    return accessDenied("forbidden", "Unresolved actor cannot access refill requests.");
  }
  const row = await fetchRow(supabase, "refill_request", refillRequestId);
  if (row === null) {
    return accessDenied("resource_not_found", `RefillRequest not found: id=${refillRequestId}.`);
  }
  const orgCheck = checkOrgBoundary(row, actor, `refill_request id=${refillRequestId}`);
  if (!orgCheck.allowed) return orgCheck;
  return checkPatientBoundary(row, actor, `refill_request id=${refillRequestId}`);
}

/**
 * Can the actor access the given follow-up plan?
 */
export async function canActorAccessFollowUpPlan(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  followUpPlanId: EntityId,
  actor: AnyActorContext,
): Promise<AccessResult> {
  if (actor.kind === "unresolved") {
    return accessDenied("forbidden", "Unresolved actor cannot access follow-up plans.");
  }
  const row = await fetchRow(supabase, "follow_up_plan", followUpPlanId);
  if (row === null) {
    return accessDenied("resource_not_found", `FollowUpPlan not found: id=${followUpPlanId}.`);
  }
  const orgCheck = checkOrgBoundary(row, actor, `follow_up_plan id=${followUpPlanId}`);
  if (!orgCheck.allowed) return orgCheck;
  return checkPatientBoundary(row, actor, `follow_up_plan id=${followUpPlanId}`);
}

/**
 * Can the actor access the given appointment?
 */
export async function canActorAccessAppointment(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  appointmentId: EntityId,
  actor: AnyActorContext,
): Promise<AccessResult> {
  if (actor.kind === "unresolved") {
    return accessDenied("forbidden", "Unresolved actor cannot access appointments.");
  }
  const row = await fetchRow(supabase, "appointment", appointmentId);
  if (row === null) {
    return accessDenied("resource_not_found", `Appointment not found: id=${appointmentId}.`);
  }
  const orgCheck = checkOrgBoundary(row, actor, `appointment id=${appointmentId}`);
  if (!orgCheck.allowed) return orgCheck;
  return checkPatientBoundary(row, actor, `appointment id=${appointmentId}`);
}

// ─── Generic entry point ──────────────────────────────────────────────────────

export type ResourceType =
  | "patient"
  | "treatment_episode"
  | "encounter"
  | "prescription"
  | "prescription_item"
  | "refill_request"
  | "follow_up_plan"
  | "appointment";

/**
 * Generic resource access check.
 *
 * Dispatches to the appropriate resource-specific evaluator based on `resourceType`.
 * Use for generic middleware or logging; prefer the specific evaluators for
 * typed, intention-revealing code in feature modules.
 */
export async function canActorAccessResource(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  resourceType: ResourceType,
  resourceId: EntityId,
  actor: AnyActorContext,
): Promise<AccessResult> {
  switch (resourceType) {
    case "patient":
      return canActorAccessPatient(supabase, resourceId, actor);
    case "treatment_episode":
      return canActorAccessTreatmentEpisode(supabase, resourceId, actor);
    case "encounter":
      return canActorAccessEncounter(supabase, resourceId, actor);
    case "prescription":
      return canActorAccessPrescription(supabase, resourceId, actor);
    case "prescription_item":
      return canActorAccessPrescriptionItem(supabase, resourceId, actor);
    case "refill_request":
      return canActorAccessRefillRequest(supabase, resourceId, actor);
    case "follow_up_plan":
      return canActorAccessFollowUpPlan(supabase, resourceId, actor);
    case "appointment":
      return canActorAccessAppointment(supabase, resourceId, actor);
  }
}
