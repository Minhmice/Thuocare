/**
 * Static role → FullCapabilities mapping.
 *
 * This mirrors the SQL capability helpers in phase_1_lifecycle_core_rls_policies.sql:
 *   can_write_clinical_data()     → doctor | nurse | care_coordinator | admin
 *   can_write_prescriptions()     → doctor | admin
 *   can_manage_refills()          → doctor | nurse | pharmacist | care_coordinator | admin
 *   can_manage_medication_catalog() → pharmacist | admin
 *
 * Additional capabilities (read, appointments, onboarding) are defined here at
 * the application layer, aligned with RLS SELECT policies that allow staff to
 * read all data within their organization.
 *
 * IMPORTANT: This map is for application-layer checks only. DB RLS remains the
 * authoritative enforcement boundary. Never rely solely on these flags.
 *
 * Rationale for read capabilities:
 * - All staff roles can read org/clinic data (RLS: belongs_to_current_org).
 * - All staff roles can read patient profiles (RLS: belongs_to_current_org for staff).
 * - Patients can only read their own data (RLS: is_current_patient).
 */

import type { UserRole } from "@thuocare/contracts";
import type { FullCapabilities } from "../actor/actor-types.js";

// ─── Staff capability presets ─────────────────────────────────────────────────

const DOCTOR_CAPABILITIES: FullCapabilities = {
  // Actor type flags
  isStaff: true,
  isPatientActor: false,
  isAdmin: false,
  isDoctor: true,
  isNurse: false,
  isPharmacist: false,
  isCareCoordinator: false,
  // Read
  canReadOrganizationData: true,
  canReadClinicData: true,
  canReadPatientProfile: true,
  canReadTreatmentEpisode: true,
  canReadPrescription: true,
  // Write / management
  canWriteClinicalData: true,
  canWritePrescriptions: true,
  canManageRefills: true,
  canManageMedicationCatalog: false,
  canManageAppointments: true,
  canResolveOnboardingIssues: false,
};

const NURSE_CAPABILITIES: FullCapabilities = {
  isStaff: true,
  isPatientActor: false,
  isAdmin: false,
  isDoctor: false,
  isNurse: true,
  isPharmacist: false,
  isCareCoordinator: false,
  canReadOrganizationData: true,
  canReadClinicData: true,
  canReadPatientProfile: true,
  canReadTreatmentEpisode: true,
  canReadPrescription: true,
  canWriteClinicalData: true,
  // Nurses cannot issue prescriptions — doctor or admin only
  canWritePrescriptions: false,
  canManageRefills: true,
  canManageMedicationCatalog: false,
  canManageAppointments: true,
  canResolveOnboardingIssues: false,
};

const PHARMACIST_CAPABILITIES: FullCapabilities = {
  isStaff: true,
  isPatientActor: false,
  isAdmin: false,
  isDoctor: false,
  isNurse: false,
  isPharmacist: true,
  isCareCoordinator: false,
  canReadOrganizationData: true,
  canReadClinicData: true,
  // Pharmacists read patient profiles only to support dispensing workflows
  canReadPatientProfile: true,
  canReadTreatmentEpisode: true,
  canReadPrescription: true,
  // Pharmacists do not write clinical notes or encounter summaries
  canWriteClinicalData: false,
  canWritePrescriptions: false,
  canManageRefills: true,
  canManageMedicationCatalog: true,
  // Pharmacists do not book appointments
  canManageAppointments: false,
  canResolveOnboardingIssues: false,
};

const ADMIN_CAPABILITIES: FullCapabilities = {
  isStaff: true,
  isPatientActor: false,
  isAdmin: true,
  isDoctor: false,
  isNurse: false,
  isPharmacist: false,
  isCareCoordinator: false,
  canReadOrganizationData: true,
  canReadClinicData: true,
  canReadPatientProfile: true,
  canReadTreatmentEpisode: true,
  canReadPrescription: true,
  // Admin can perform all data writes within their org
  canWriteClinicalData: true,
  canWritePrescriptions: true,
  canManageRefills: true,
  canManageMedicationCatalog: true,
  canManageAppointments: true,
  // Admin can resolve onboarding issues (view + mark resolved in onboarding_issue_log)
  canResolveOnboardingIssues: true,
};

const CARE_COORDINATOR_CAPABILITIES: FullCapabilities = {
  isStaff: true,
  isPatientActor: false,
  isAdmin: false,
  isDoctor: false,
  isNurse: false,
  isPharmacist: false,
  isCareCoordinator: true,
  canReadOrganizationData: true,
  canReadClinicData: true,
  canReadPatientProfile: true,
  canReadTreatmentEpisode: true,
  canReadPrescription: true,
  canWriteClinicalData: true,
  canWritePrescriptions: false,
  canManageRefills: true,
  canManageMedicationCatalog: false,
  canManageAppointments: true,
  canResolveOnboardingIssues: false,
};

// ─── Patient capability preset ────────────────────────────────────────────────

/**
 * Patients can read their own data only.
 * Write capabilities are blocked at the application layer and enforced by RLS.
 * Patients cannot access other actors' data or perform clinical operations.
 */
export const PATIENT_CAPABILITIES: FullCapabilities = {
  isStaff: false,
  isPatientActor: true,
  isAdmin: false,
  isDoctor: false,
  isNurse: false,
  isPharmacist: false,
  isCareCoordinator: false,
  // Patients see their own org data only (e.g., clinic name for display)
  canReadOrganizationData: false,
  canReadClinicData: false,
  // Patients can read their own profile
  canReadPatientProfile: true,
  canReadTreatmentEpisode: true,
  canReadPrescription: true,
  // Patients cannot write clinical data
  canWriteClinicalData: false,
  canWritePrescriptions: false,
  // Patients can request refills (through refill_request INSERT), but "managing"
  // the workflow (triage, approve, reject) is staff-only
  canManageRefills: false,
  canManageMedicationCatalog: false,
  canManageAppointments: false,
  canResolveOnboardingIssues: false,
};

// ─── Unresolved / no capabilities ────────────────────────────────────────────

/** All capabilities denied — used for unresolved actor contexts. */
export const NO_CAPABILITIES: FullCapabilities = {
  isStaff: false,
  isPatientActor: false,
  isAdmin: false,
  isDoctor: false,
  isNurse: false,
  isPharmacist: false,
  isCareCoordinator: false,
  canReadOrganizationData: false,
  canReadClinicData: false,
  canReadPatientProfile: false,
  canReadTreatmentEpisode: false,
  canReadPrescription: false,
  canWriteClinicalData: false,
  canWritePrescriptions: false,
  canManageRefills: false,
  canManageMedicationCatalog: false,
  canManageAppointments: false,
  canResolveOnboardingIssues: false,
};

// ─── Role → capabilities map ──────────────────────────────────────────────────

/**
 * Maps every staff UserRole to its FullCapabilities.
 * Mirrors and extends ROLE_PRESETS from @thuocare/contracts/constants.
 */
export const STAFF_CAPABILITY_MAP: Record<UserRole, FullCapabilities> = {
  doctor: DOCTOR_CAPABILITIES,
  nurse: NURSE_CAPABILITIES,
  pharmacist: PHARMACIST_CAPABILITIES,
  admin: ADMIN_CAPABILITIES,
  care_coordinator: CARE_COORDINATOR_CAPABILITIES,
};
