/**
 * Actor context types for the auth package.
 *
 * Extends the base types from @thuocare/contracts with:
 * - `authUserId` on StaffActorContext (contracts omits this; auth layer needs it).
 * - `FullCapabilities` — a superset of StaffCapabilityFlags that includes read
 *   and management capabilities needed by later feature modules.
 * - `UnresolvedActorContext` — explicitly models the "session exists but actor
 *   cannot be resolved" state, so callers never have to null-check silently.
 *
 * Naming mirrors SQL helper concepts:
 *   is_staff()            → kind === "staff"
 *   is_patient_actor()    → kind === "patient"
 *   is_doctor()           → capabilities.isDoctor
 *   can_write_prescriptions() → capabilities.canWritePrescriptions
 *   etc.
 */

import type { AuthUserId, EntityId } from "@thuocare/contracts";
import type { UserRole } from "@thuocare/contracts";

// ─── Binding state ──────────────────────────────────────────────────────────

/**
 * Describes the completeness of an auth user's actor bindings.
 *
 * - fully_bound     : user_account or patient row exists and is linked
 * - pending_claim   : auth user signed up but has not claimed an account yet
 * - partial_binding : some binding fields exist but the set is incomplete
 *                     (e.g., staff row found but org resolution failed)
 * - unknown         : binding state cannot be determined (DB error)
 */
export type ActorBindingState =
  | "fully_bound"
  | "pending_claim"
  | "partial_binding"
  | "unknown";

// ─── Full capability set ─────────────────────────────────────────────────────

/**
 * Complete capability flags for an actor.
 *
 * Mirrors SQL helper functions in phase_1_lifecycle_core_rls_policies.sql.
 * Read capabilities are added here at the app layer (no separate SQL helpers
 * for reads since RLS SELECT policies already enforce them at the DB level).
 *
 * This is the authoritative source for capability checks in application code.
 * DB RLS remains the enforcement layer — this is the application-layer guard.
 */
export interface FullCapabilities {
  // ── Actor type flags (mirror SQL: is_staff, is_patient_actor, etc.) ───────
  isStaff: boolean;
  isPatientActor: boolean;
  isAdmin: boolean;
  isDoctor: boolean;
  isNurse: boolean;
  isPharmacist: boolean;
  isCareCoordinator: boolean;

  // ── Read capabilities ─────────────────────────────────────────────────────
  /** Can read organization-level data (org name, settings, staff list). */
  canReadOrganizationData: boolean;
  /** Can read clinic-level data (clinic list, clinic details). */
  canReadClinicData: boolean;
  /** Can read patient profile (demographics, contact info). */
  canReadPatientProfile: boolean;
  /** Can read treatment episodes and encounter summaries. */
  canReadTreatmentEpisode: boolean;
  /** Can read prescription data. */
  canReadPrescription: boolean;

  // ── Write / management capabilities (mirror SQL helpers) ──────────────────
  /** Mirrors SQL: can_write_clinical_data() → doctor, nurse, care_coordinator, admin */
  canWriteClinicalData: boolean;
  /** Mirrors SQL: can_write_prescriptions() → doctor, admin */
  canWritePrescriptions: boolean;
  /** Mirrors SQL: can_manage_refills() → doctor, nurse, pharmacist, care_coordinator, admin */
  canManageRefills: boolean;
  /** Mirrors SQL: can_manage_medication_catalog() → pharmacist, admin */
  canManageMedicationCatalog: boolean;
  /** Can create, update, cancel appointments. */
  canManageAppointments: boolean;
  /** Can view and resolve entries in onboarding_issue_log. */
  canResolveOnboardingIssues: boolean;
}

// ─── Resolved actor contexts ─────────────────────────────────────────────────

/**
 * A fully-resolved staff actor.
 *
 * `authUserId` is added here (not in contracts) because the auth package is the
 * layer that bridges the Supabase auth identity to the business actor identity.
 */
export interface ResolvedStaffActorContext {
  kind: "staff";
  /** Supabase auth.users.id — the stable authentication identity. */
  authUserId: AuthUserId;
  /** public.user_account.organization_id */
  organizationId: EntityId;
  /** public.user_account.id */
  userAccountId: EntityId;
  /** public.user_account.role */
  role: UserRole;
  /**
   * public.doctor_profile.id — present only when role === "doctor" and
   * a doctor_profile row exists for this user_account.
   */
  doctorProfileId: EntityId | null;
  /**
   * public.user_account.clinic_id — the clinic this staff member is
   * primarily associated with. Null if not clinic-scoped.
   */
  clinicId: EntityId | null;
  capabilities: FullCapabilities;
}

/**
 * A fully-resolved patient actor.
 *
 * Patients use the app on their own behalf.
 * Their read access is limited to their own treatment data.
 * They cannot write clinical data or manage other actors.
 */
export interface ResolvedPatientActorContext {
  kind: "patient";
  /** Supabase auth.users.id */
  authUserId: AuthUserId;
  /**
   * public.patient.organization_id — null for self-serve personal-lane patients
   * who are not tied to a hospital organization.
   */
  organizationId: EntityId | null;
  /** public.patient.id */
  patientId: EntityId;
  capabilities: FullCapabilities;
}

/**
 * An actor context that could not be fully resolved.
 *
 * This state occurs when:
 * - The auth user has not yet claimed a user_account or patient record.
 * - An onboarding trigger failed and logged an issue.
 * - The DB returned partial binding data.
 *
 * Code receiving this type MUST NOT allow access to clinical or patient data.
 * Route the actor to onboarding/claim flows instead.
 */
export interface UnresolvedActorContext {
  kind: "unresolved";
  /** auth.users.id — always available since we need a session to get here. */
  authUserId: AuthUserId;
  /** Lowercased email from the session JWT, if available. */
  email: string | null;
  /** Why the actor could not be resolved. */
  bindingState: Exclude<ActorBindingState, "fully_bound">;
  /**
   * Raw binding data from the `my_auth_binding_status()` RPC.
   * Partial fields may be populated even in the unresolved state.
   * Inspect only for onboarding/debug flows.
   */
  rawBinding: RawBindingData;
}

/** Raw binding data as returned by the `my_auth_binding_status()` SQL RPC. */
export interface RawBindingData {
  auth_user_id: AuthUserId | null;
  email: string | null;
  staff_user_account_id: EntityId | null;
  staff_role: UserRole | null;
  doctor_profile_id: EntityId | null;
  patient_id: EntityId | null;
  organization_id: EntityId | null;
}

// ─── Union types used throughout the package ─────────────────────────────────

/** A fully-resolved actor — either staff or patient. */
export type ResolvedActorContext =
  | ResolvedStaffActorContext
  | ResolvedPatientActorContext;

/**
 * Any actor context, including unresolved.
 * Use this as the widest input type when a function must handle all states.
 */
export type AnyActorContext = ResolvedActorContext | UnresolvedActorContext;

// ─── Narrow type guards ───────────────────────────────────────────────────────

export function isStaffActor(
  actor: AnyActorContext,
): actor is ResolvedStaffActorContext {
  return actor.kind === "staff";
}

export function isPatientActor(
  actor: AnyActorContext,
): actor is ResolvedPatientActorContext {
  return actor.kind === "patient";
}

export function isResolvedActor(
  actor: AnyActorContext,
): actor is ResolvedActorContext {
  return actor.kind === "staff" || actor.kind === "patient";
}

export function isUnresolvedActor(
  actor: AnyActorContext,
): actor is UnresolvedActorContext {
  return actor.kind === "unresolved";
}

/** True if the staff actor holds the `doctor` role and has an active doctor_profile. */
export function isDoctorActor(
  actor: AnyActorContext,
): actor is ResolvedStaffActorContext & { doctorProfileId: EntityId } {
  return (
    actor.kind === "staff" &&
    actor.role === "doctor" &&
    actor.doctorProfileId !== null
  );
}
