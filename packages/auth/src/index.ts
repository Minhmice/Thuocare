/**
 * @thuocare/auth
 *
 * Runtime auth/access foundation for the Prescription-to-Adherence Platform.
 *
 * QUICK REFERENCE — most common usage patterns:
 *
 * 1. Get current actor (server action / API route):
 *    ```ts
 *    import { buildRequestActorContext, requireStaffSession } from "@thuocare/auth";
 *    const actor = await buildRequestActorContext(supabase);
 *    ```
 *
 * 2. Require staff + capability:
 *    ```ts
 *    import { requireStaffSession, requireCapability } from "@thuocare/auth";
 *    const actor = await requireStaffSession(supabase);
 *    requireCapability(actor, "canWritePrescriptions");
 *    ```
 *
 * 3. Check resource access:
 *    ```ts
 *    import { canActorAccessPrescription, assertResourceAccess } from "@thuocare/auth";
 *    const result = await canActorAccessPrescription(supabase, prescriptionId, actor);
 *    assertResourceAccess(result);
 *    ```
 *
 * 4. Handle onboarding:
 *    ```ts
 *    import { loadActorContext, resolveOnboardingState, claimStaffAccount } from "@thuocare/auth";
 *    const actor = await loadActorContext(supabase);
 *    const state = await resolveOnboardingState(supabase, actor);
 *    ```
 *
 * See docs/auth-access-overview.md for the full design explanation.
 */

// ─── Error types ──────────────────────────────────────────────────────────────
export type { AuthErrorCode } from "./errors/auth-errors.js";
export {
  AuthError,
  UnauthenticatedError,
  UnresolvedActorError,
  MissingBindingError,
  OnboardingIncompleteError,
  isAuthError,
  isUnauthenticated,
} from "./errors/auth-errors.js";

export type { AccessErrorCode } from "./errors/access-errors.js";
export {
  AccessError,
  ForbiddenError,
  OrganizationMismatchError,
  ClinicMismatchError,
  PatientScopeMismatchError,
  CapabilityDeniedError,
  RoleRequiredError,
  StaffActorRequiredError,
  PatientActorRequiredError,
  DoctorRequiredError,
  CaregiverLinkMissingError,
  isAccessError,
} from "./errors/access-errors.js";

// ─── Session ──────────────────────────────────────────────────────────────────
export type { SessionData } from "./session/session-resolver.js";
export {
  getCurrentSession,
  requireAuthenticatedSession,
  getAuthUserId,
} from "./session/session-resolver.js";

// ─── Actor types ──────────────────────────────────────────────────────────────
export type {
  ActorBindingState,
  FullCapabilities,
  RawBindingData,
  ResolvedStaffActorContext,
  ResolvedPatientActorContext,
  UnresolvedActorContext,
  ResolvedActorContext,
  AnyActorContext,
} from "./actor/actor-types.js";
export {
  isStaffActor,
  isPatientActor,
  isResolvedActor,
  isUnresolvedActor,
  isDoctorActor,
} from "./actor/actor-types.js";

// ─── Actor resolver ───────────────────────────────────────────────────────────
export {
  resolveActorContext,
  requireResolvedActorContext,
  buildRequestActorContext,
} from "./actor/actor-resolver.js";

// ─── Capabilities ─────────────────────────────────────────────────────────────
export {
  STAFF_CAPABILITY_MAP,
  PATIENT_CAPABILITIES,
  NO_CAPABILITIES,
} from "./capabilities/capability-map.js";
export {
  resolveFullCapabilities,
  getCapabilities,
  hasCapability,
} from "./capabilities/capability-resolver.js";
export type { CapabilityInput } from "./capabilities/capability-resolver.js";

// ─── Onboarding ───────────────────────────────────────────────────────────────
export type {
  OnboardingStatus,
  OnboardingState,
  OnboardingIssueDetail,
  ClaimResult,
} from "./onboarding/onboarding-state.js";
export {
  resolveOnboardingState,
  claimStaffAccount,
  claimPatientAccount,
  registerMyDoctorAccount,
  assertOnboardingComplete,
} from "./onboarding/onboarding-state.js";

// ─── Auth guards ──────────────────────────────────────────────────────────────
export {
  requireAuthenticated,
  requireResolvedActor,
  loadActorContext,
  requireStaffActor,
  requirePatientActor,
  requireResolvedActorFromContext,
  requireStaffSession,
  requirePatientSession,
} from "./guards/auth-guards.js";

// ─── Role / capability guards ─────────────────────────────────────────────────
export {
  requireRole,
  requireAnyRole,
  requireDoctorActor,
  requireCapability,
  requireAllCapabilities,
  requireAnyCapability,
} from "./guards/role-guards.js";

// ─── Scope guards ─────────────────────────────────────────────────────────────
export {
  requireOrganizationScope,
  actorBelongsToOrganization,
  requireClinicScope,
  actorBelongsToClinic,
  requireDoctorScope,
  actorIsDoctorWithProfileId,
} from "./guards/scope-guards.js";

// ─── Organization scope evaluators ───────────────────────────────────────────
export {
  actorBelongsToOrg,
  assertActorInOrg,
  assertResourceInActorOrg,
} from "./access/organization-scope.js";

// ─── Clinic scope evaluators ──────────────────────────────────────────────────
export {
  actorPassesClinicScope,
  assertActorClinicScope,
  assertResourceInActorClinic,
} from "./access/clinic-scope.js";

// ─── Patient scope evaluators ────────────────────────────────────────────────
export {
  isSelfPatientAccess,
  requireSelfPatientAccess,
  requirePatientInActorOrg,
  requirePatientAccess,
  requirePatientResourceAccess,
  requireStaffForPatientWrite,
} from "./access/patient-scope.js";

// ─── Doctor scope evaluators ─────────────────────────────────────────────────
export {
  getDoctorActor,
  requireDoctorContext,
  isDoctorPrimaryForEpisode,
  requireDoctorPrimaryForEpisode,
  isDoctorAuthorOfPrescription,
  requireDoctorAuthorOfPrescription,
} from "./access/doctor-scope.js";

// ─── Caregiver scope helpers ──────────────────────────────────────────────────
export type { CaregiverLinkSummary } from "./access/caregiver-scope.js";
export {
  loadPatientCaregiverLinks,
  patientHasActiveCaregivers,
  getPrimaryCaregiverLink,
} from "./access/caregiver-scope.js";

// ─── Resource access evaluators ───────────────────────────────────────────────
export type { AccessResult, ResourceType } from "./access/resource-access.js";
export {
  ACCESS_ALLOWED,
  accessDenied,
  assertResourceAccess,
  canActorAccessPatient,
  canActorAccessTreatmentEpisode,
  canActorAccessEncounter,
  canActorAccessPrescription,
  canActorAccessPrescriptionItem,
  canActorAccessRefillRequest,
  canActorAccessFollowUpPlan,
  canActorAccessAppointment,
  canActorAccessResource,
} from "./access/resource-access.js";

// ─── Actor data helpers ───────────────────────────────────────────────────────
export {
  loadUserAccountByAuthId,
  loadUserAccountById,
  loadDoctorProfileByUserAccountId,
  loadPatientByAuthId,
  loadPatientById,
  loadOpenOnboardingIssues,
  hasOpenOnboardingIssues,
} from "./data/actor-data.js";
