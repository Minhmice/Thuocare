/**
 * PostgreSQL enum literals from `phase_1_lifecycle_core_supabase.sql`
 * plus text-constrained onboarding values from `phase_1_auth_onboarding_helpers.sql`.
 */

export const ORGANIZATION_TYPE_VALUES = [
  "clinic_group",
  "independent_clinic",
  "hospital_unit",
] as const;
export type OrganizationType = (typeof ORGANIZATION_TYPE_VALUES)[number];

export const RECORD_STATUS_VALUES = ["active", "inactive"] as const;
export type RecordStatus = (typeof RECORD_STATUS_VALUES)[number];

export const USER_ROLE_VALUES = [
  "doctor",
  "nurse",
  "pharmacist",
  "admin",
  "care_coordinator",
] as const;
export type UserRole = (typeof USER_ROLE_VALUES)[number];

export const PATIENT_STATUS_VALUES = ["active", "inactive", "deceased"] as const;
export type PatientStatus = (typeof PATIENT_STATUS_VALUES)[number];

export const SEX_VALUES = ["male", "female", "other", "unknown"] as const;
export type Sex = (typeof SEX_VALUES)[number];

export const COMMUNICATION_PREFERENCE_VALUES = ["app", "sms", "call", "mixed"] as const;
export type CommunicationPreference = (typeof COMMUNICATION_PREFERENCE_VALUES)[number];

export const RELATIONSHIP_TYPE_VALUES = [
  "spouse",
  "child",
  "parent",
  "sibling",
  "other",
] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPE_VALUES)[number];

export const NOTIFICATION_SCOPE_VALUES = [
  "none",
  "missed_dose_only",
  "refill_only",
  "appointments_only",
  "all",
] as const;
export type NotificationScope = (typeof NOTIFICATION_SCOPE_VALUES)[number];

export const EPISODE_TYPE_VALUES = [
  "chronic_management",
  "acute_course",
  "post_procedure",
  "monitoring_program",
] as const;
export type EpisodeType = (typeof EPISODE_TYPE_VALUES)[number];

export const EPISODE_STATUS_VALUES = [
  "draft",
  "active",
  "monitoring",
  "follow_up_due",
  "refill_in_progress",
  "completed",
  "discontinued",
  "cancelled",
] as const;
export type EpisodeStatus = (typeof EPISODE_STATUS_VALUES)[number];

export const RISK_TIER_VALUES = ["low", "medium", "high"] as const;
export type RiskTier = (typeof RISK_TIER_VALUES)[number];

export const ENCOUNTER_TYPE_VALUES = [
  "in_person",
  "telehealth",
  "refill_review",
  "follow_up_check",
] as const;
export type EncounterType = (typeof ENCOUNTER_TYPE_VALUES)[number];

export const DIAGNOSIS_STATUS_VALUES = ["active", "resolved", "historical"] as const;
export type DiagnosisStatus = (typeof DIAGNOSIS_STATUS_VALUES)[number];

export const DOSAGE_FORM_VALUES = [
  "tablet",
  "capsule",
  "injection",
  "solution",
  "inhaler",
  "cream",
  "other",
] as const;
export type DosageForm = (typeof DOSAGE_FORM_VALUES)[number];

export const ROUTE_VALUES = [
  "oral",
  "iv",
  "im",
  "sc",
  "topical",
  "inhalation",
  "other",
] as const;
export type Route = (typeof ROUTE_VALUES)[number];

export const PRESCRIPTION_KIND_VALUES = [
  "initial",
  "renewal",
  "adjustment",
  "continuation",
] as const;
export type PrescriptionKind = (typeof PRESCRIPTION_KIND_VALUES)[number];

export const PRESCRIPTION_SOURCE_VALUES = ["visit", "remote_review", "refill_process"] as const;
export type PrescriptionSource = (typeof PRESCRIPTION_SOURCE_VALUES)[number];

export const PRESCRIPTION_STATUS_VALUES = [
  "draft",
  "issued",
  "active",
  "paused",
  "completed",
  "discontinued",
  "expired",
  "cancelled",
] as const;
export type PrescriptionStatus = (typeof PRESCRIPTION_STATUS_VALUES)[number];

export const TIMING_RELATION_VALUES = [
  "before_meal",
  "after_meal",
  "with_meal",
  "bedtime",
  "none",
] as const;
export type TimingRelation = (typeof TIMING_RELATION_VALUES)[number];

export const PRESCRIPTION_ITEM_STATUS_VALUES = [
  "active",
  "completed",
  "stopped",
  "cancelled",
] as const;
export type PrescriptionItemStatus = (typeof PRESCRIPTION_ITEM_STATUS_VALUES)[number];

export const DOSE_SCHEDULE_TYPE_VALUES = [
  "fixed_times_daily",
  "interval_based",
  "prn",
  "taper",
  "cyclic",
] as const;
export type DoseScheduleType = (typeof DOSE_SCHEDULE_TYPE_VALUES)[number];

export const TIMEZONE_MODE_VALUES = ["patient_local_time", "fixed_clinic_time"] as const;
export type TimezoneMode = (typeof TIMEZONE_MODE_VALUES)[number];

export const REFILL_MODE_VALUES = [
  "not_allowed",
  "patient_request_allowed",
  "doctor_review_required",
  "appointment_required",
] as const;
export type RefillMode = (typeof REFILL_MODE_VALUES)[number];

export const REQUEST_SCOPE_VALUES = ["full_prescription", "selected_items"] as const;
export type RequestScope = (typeof REQUEST_SCOPE_VALUES)[number];

export const REQUESTED_BY_TYPE_VALUES = ["patient", "caregiver", "staff", "system"] as const;
export type RequestedByType = (typeof REQUESTED_BY_TYPE_VALUES)[number];

export const REFILL_TRIGGER_SOURCE_VALUES = [
  "manual_request",
  "near_depletion",
  "predicted_depletion",
  "doctor_initiated",
] as const;
export type RefillTriggerSource = (typeof REFILL_TRIGGER_SOURCE_VALUES)[number];

export const FULFILLMENT_PREFERENCE_VALUES = ["pickup", "delivery", "unspecified"] as const;
export type FulfillmentPreference = (typeof FULFILLMENT_PREFERENCE_VALUES)[number];

export const REFILL_REQUEST_STATUS_VALUES = [
  "submitted",
  "triaging",
  "awaiting_doctor_review",
  "approved",
  "rejected",
  "appointment_required",
  "fulfilled",
  "cancelled",
] as const;
export type RefillRequestStatus = (typeof REFILL_REQUEST_STATUS_VALUES)[number];

export const REFILL_REQUEST_ITEM_STATUS_VALUES = [
  "pending",
  "approved",
  "rejected",
  "visit_required",
] as const;
export type RefillRequestItemStatus = (typeof REFILL_REQUEST_ITEM_STATUS_VALUES)[number];

export const FOLLOW_UP_TYPE_VALUES = [
  "medication_check",
  "symptom_check",
  "side_effect_review",
  "revisit",
  "lab_review",
] as const;
export type FollowUpType = (typeof FOLLOW_UP_TYPE_VALUES)[number];

export const FOLLOW_UP_TRIGGER_MODE_VALUES = [
  "fixed_date",
  "relative_to_issue_date",
  "relative_to_refill",
  "rule_based",
] as const;
export type FollowUpTriggerMode = (typeof FOLLOW_UP_TRIGGER_MODE_VALUES)[number];

export const FOLLOW_UP_STATUS_VALUES = ["planned", "due", "completed", "missed", "cancelled"] as const;
export type FollowUpStatus = (typeof FOLLOW_UP_STATUS_VALUES)[number];

export const APPOINTMENT_TYPE_VALUES = [
  "in_person_revisit",
  "tele_revisit",
  "refill_review",
  "lab_review",
] as const;
export type AppointmentType = (typeof APPOINTMENT_TYPE_VALUES)[number];

export const APPOINTMENT_STATUS_VALUES = [
  "scheduled",
  "confirmed",
  "checked_in",
  "completed",
  "no_show",
  "cancelled",
  "rescheduled",
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUS_VALUES)[number];

export const PRE_VISIT_REQUIREMENT_TYPE_VALUES = [
  "bring_old_prescription",
  "bring_medications",
  "upload_lab_result",
  "fasting_required",
  "bp_log",
  "glucose_log",
  "other",
] as const;
export type PreVisitRequirementType = (typeof PRE_VISIT_REQUIREMENT_TYPE_VALUES)[number];

export const PRE_VISIT_REQUIREMENT_STATUS_VALUES = ["pending", "done", "waived"] as const;
export type PreVisitRequirementStatus = (typeof PRE_VISIT_REQUIREMENT_STATUS_VALUES)[number];

export const TREATMENT_ENTITY_TYPE_VALUES = [
  "episode",
  "encounter",
  "prescription",
  "prescription_item",
  "refill_request",
  "follow_up_plan",
  "appointment",
] as const;
export type TreatmentEntityType = (typeof TREATMENT_ENTITY_TYPE_VALUES)[number];

export const TREATMENT_EVENT_TYPE_VALUES = [
  "episode_created",
  "encounter_recorded",
  "prescription_issued",
  "prescription_activated",
  "near_depletion_detected",
  "refill_requested",
  "refill_approved",
  "refill_rejected",
  "follow_up_due",
  "appointment_scheduled",
  "appointment_completed",
  "prescription_completed",
  "episode_closed",
] as const;
export type TreatmentEventType = (typeof TREATMENT_EVENT_TYPE_VALUES)[number];

export const ACTOR_TYPE_VALUES = ["doctor", "staff", "patient", "caregiver", "system"] as const;
export type ActorType = (typeof ACTOR_TYPE_VALUES)[number];

export const VISIBILITY_SCOPE_VALUES = [
  "internal_only",
  "doctor_and_staff",
  "patient_visible",
] as const;
export type VisibilityScope = (typeof VISIBILITY_SCOPE_VALUES)[number];

/** `onboarding_issue_log.actor_type` text check — not the same as `actor_type_enum`. */
export const ONBOARDING_LOG_ACTOR_TYPE_VALUES = ["staff", "patient", "unknown"] as const;
export type OnboardingLogActorType = (typeof ONBOARDING_LOG_ACTOR_TYPE_VALUES)[number];

export const ONBOARDING_ISSUE_CODE_VALUES = [
  "missing_actor_type",
  "unsupported_actor_type",
  "missing_email",
  "org_not_found",
  "no_matching_profile",
  "multiple_matching_profiles",
  "profile_already_linked",
  "claim_conflict",
  "missing_organization_code",
  "registration_full_name_required",
] as const;
export type OnboardingIssueCode = (typeof ONBOARDING_ISSUE_CODE_VALUES)[number];

/** Signup metadata `actor_type` for automatic linking / doctor self-registration. */
export const AUTH_SIGNUP_ACTOR_TYPE_VALUES = ["staff", "patient", "doctor"] as const;
export type AuthSignupActorType = (typeof AUTH_SIGNUP_ACTOR_TYPE_VALUES)[number];
