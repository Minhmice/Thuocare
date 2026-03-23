import type { AuthSignupActorType, UserRole } from "./enums.js";
import type { AuthUserId, Email, EntityId } from "./primitives.js";

/**
 * JSON shape returned by `public.my_auth_binding_status()`.
 * Nullable fields mean “not bound / not applicable for this auth user”.
 */
export interface AuthBindingStatus {
  auth_user_id: AuthUserId | null;
  email: Email | null;
  staff_user_account_id: EntityId | null;
  staff_role: UserRole | null;
  doctor_profile_id: EntityId | null;
  patient_id: EntityId | null;
  organization_id: EntityId | null;
}

/** Derived capability flags mirroring SQL helpers such as `can_write_prescriptions()`. */
export interface StaffCapabilityFlags {
  isStaff: boolean;
  isPatientActor: boolean;
  isAdmin: boolean;
  isDoctor: boolean;
  isNurse: boolean;
  isPharmacist: boolean;
  isCareCoordinator: boolean;
  canWriteClinicalData: boolean;
  canWritePrescriptions: boolean;
  canManageRefills: boolean;
  canManageMedicationCatalog: boolean;
}

export function staffCapabilitiesFromRole(role: UserRole | null): StaffCapabilityFlags {
  const isStaff = role !== null;
  const isPatientActor = false;
  return {
    isStaff,
    isPatientActor,
    isAdmin: role === "admin",
    isDoctor: role === "doctor",
    isNurse: role === "nurse",
    isPharmacist: role === "pharmacist",
    isCareCoordinator: role === "care_coordinator",
    canWriteClinicalData:
      role === "doctor" || role === "nurse" || role === "care_coordinator" || role === "admin",
    canWritePrescriptions: role === "doctor" || role === "admin",
    canManageRefills:
      role === "doctor" ||
      role === "nurse" ||
      role === "pharmacist" ||
      role === "care_coordinator" ||
      role === "admin",
    canManageMedicationCatalog: role === "pharmacist" || role === "admin",
  };
}

export function patientActorCapabilities(): StaffCapabilityFlags {
  return {
    isStaff: false,
    isPatientActor: true,
    isAdmin: false,
    isDoctor: false,
    isNurse: false,
    isPharmacist: false,
    isCareCoordinator: false,
    canWriteClinicalData: false,
    canWritePrescriptions: false,
    canManageRefills: false,
    canManageMedicationCatalog: false,
  };
}

/** Resolved staff actor within an organization (application-layer projection). */
export interface StaffActorContext {
  kind: "staff";
  organizationId: EntityId;
  userAccountId: EntityId;
  role: UserRole;
  doctorProfileId: EntityId | null;
  clinicId: EntityId | null;
  capabilities: StaffCapabilityFlags;
}

export interface PatientActorContext {
  kind: "patient";
  organizationId: EntityId;
  patientId: EntityId;
  authUserId: AuthUserId;
  capabilities: StaffCapabilityFlags;
}

export type ActorContext = StaffActorContext | PatientActorContext;

export interface OrganizationScopedActorBase {
  organizationId: EntityId;
}

/** Payloads for `claim_my_*` RPCs — organization scoping is optional disambiguation. */
export interface ClaimAccountPayload {
  organizationCode?: string | null;
}

/** Signup / invite metadata persisted on `auth.users.raw_user_meta_data`. */
export interface AuthOnboardingMetadata {
  actor_type: AuthSignupActorType;
  organization_code?: string | null;
}
