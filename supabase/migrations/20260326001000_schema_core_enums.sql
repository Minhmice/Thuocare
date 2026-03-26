create type public.organization_type_enum as enum (
  'clinic_group',
  'independent_clinic',
  'hospital_unit'
);

create type public.record_status_enum as enum (
  'active',
  'inactive'
);

create type public.user_role_enum as enum (
  'doctor',
  'nurse',
  'pharmacist',
  'admin',
  'care_coordinator'
);

create type public.patient_status_enum as enum (
  'active',
  'inactive',
  'deceased'
);

create type public.sex_enum as enum (
  'male',
  'female',
  'other',
  'unknown'
);

create type public.communication_preference_enum as enum (
  'app',
  'sms',
  'call',
  'mixed'
);

create type public.relationship_type_enum as enum (
  'spouse',
  'child',
  'parent',
  'sibling',
  'other'
);

create type public.notification_scope_enum as enum (
  'none',
  'missed_dose_only',
  'refill_only',
  'appointments_only',
  'all'
);

create type public.episode_type_enum as enum (
  'chronic_management',
  'acute_course',
  'post_procedure',
  'monitoring_program'
);

create type public.episode_status_enum as enum (
  'draft',
  'active',
  'monitoring',
  'follow_up_due',
  'refill_in_progress',
  'completed',
  'discontinued',
  'cancelled'
);

create type public.risk_tier_enum as enum (
  'low',
  'medium',
  'high'
);

create type public.encounter_type_enum as enum (
  'in_person',
  'telehealth',
  'refill_review',
  'follow_up_check'
);

create type public.diagnosis_status_enum as enum (
  'active',
  'resolved',
  'historical'
);

create type public.dosage_form_enum as enum (
  'tablet',
  'capsule',
  'injection',
  'solution',
  'inhaler',
  'cream',
  'other'
);

create type public.route_enum as enum (
  'oral',
  'iv',
  'im',
  'sc',
  'topical',
  'inhalation',
  'other'
);

create type public.prescription_kind_enum as enum (
  'initial',
  'renewal',
  'adjustment',
  'continuation'
);

create type public.prescription_source_enum as enum (
  'visit',
  'remote_review',
  'refill_process'
);

create type public.prescription_status_enum as enum (
  'draft',
  'issued',
  'active',
  'paused',
  'completed',
  'discontinued',
  'expired',
  'cancelled'
);

create type public.timing_relation_enum as enum (
  'before_meal',
  'after_meal',
  'with_meal',
  'bedtime',
  'none'
);

create type public.prescription_item_status_enum as enum (
  'active',
  'completed',
  'stopped',
  'cancelled'
);

create type public.dose_schedule_type_enum as enum (
  'fixed_times_daily',
  'interval_based',
  'prn',
  'taper',
  'cyclic'
);

create type public.timezone_mode_enum as enum (
  'patient_local_time',
  'fixed_clinic_time'
);

create type public.refill_mode_enum as enum (
  'not_allowed',
  'patient_request_allowed',
  'doctor_review_required',
  'appointment_required'
);

create type public.request_scope_enum as enum (
  'full_prescription',
  'selected_items'
);

create type public.requested_by_type_enum as enum (
  'patient',
  'caregiver',
  'staff',
  'system'
);

create type public.refill_trigger_source_enum as enum (
  'manual_request',
  'near_depletion',
  'predicted_depletion',
  'doctor_initiated'
);

create type public.fulfillment_preference_enum as enum (
  'pickup',
  'delivery',
  'unspecified'
);

create type public.refill_request_status_enum as enum (
  'submitted',
  'triaging',
  'awaiting_doctor_review',
  'approved',
  'rejected',
  'appointment_required',
  'fulfilled',
  'cancelled'
);

create type public.refill_request_item_status_enum as enum (
  'pending',
  'approved',
  'rejected',
  'visit_required'
);

create type public.follow_up_type_enum as enum (
  'medication_check',
  'symptom_check',
  'side_effect_review',
  'revisit',
  'lab_review'
);

create type public.follow_up_trigger_mode_enum as enum (
  'fixed_date',
  'relative_to_issue_date',
  'relative_to_refill',
  'rule_based'
);

create type public.follow_up_status_enum as enum (
  'planned',
  'due',
  'completed',
  'missed',
  'cancelled'
);

create type public.appointment_type_enum as enum (
  'in_person_revisit',
  'tele_revisit',
  'refill_review',
  'lab_review'
);

create type public.appointment_status_enum as enum (
  'scheduled',
  'confirmed',
  'checked_in',
  'completed',
  'no_show',
  'cancelled',
  'rescheduled'
);

create type public.pre_visit_requirement_type_enum as enum (
  'bring_old_prescription',
  'bring_medications',
  'upload_lab_result',
  'fasting_required',
  'bp_log',
  'glucose_log',
  'other'
);

create type public.pre_visit_requirement_status_enum as enum (
  'pending',
  'done',
  'waived'
);

create type public.treatment_entity_type_enum as enum (
  'episode',
  'encounter',
  'prescription',
  'prescription_item',
  'refill_request',
  'follow_up_plan',
  'appointment'
);

create type public.treatment_event_type_enum as enum (
  'episode_created',
  'encounter_recorded',
  'prescription_issued',
  'prescription_activated',
  'near_depletion_detected',
  'refill_requested',
  'refill_approved',
  'refill_rejected',
  'follow_up_due',
  'appointment_scheduled',
  'appointment_completed',
  'prescription_completed',
  'episode_closed'
);

create type public.actor_type_enum as enum (
  'doctor',
  'staff',
  'patient',
  'caregiver',
  'system'
);

create type public.visibility_scope_enum as enum (
  'internal_only',
  'doctor_and_staff',
  'patient_visible'
);

