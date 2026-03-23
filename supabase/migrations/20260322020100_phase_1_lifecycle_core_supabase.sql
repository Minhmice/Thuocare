
-- =========================================================
-- Prescription-to-Adherence Platform
-- Phase 1 / Lifecycle Core
-- Initial PostgreSQL (Supabase) migration
--
-- Notes:
-- 1) This file is intended as an initial migration on an empty schema.
-- 2) It creates the lifecycle core only:
--    tenant/actor, treatment episode, encounter, prescription,
--    refill, follow-up, appointment, and timeline/audit layers.
-- 3) RLS is intentionally NOT enabled in this migration.
--    Add RLS + policies only after your auth/tenant model is finalized.
-- =========================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------
-- Utility functions
-- ---------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------
-- Enums
-- ---------------------------------------------------------

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

-- ---------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------

create table public.organization (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  org_type public.organization_type_enum not null,
  status public.record_status_enum not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_code_nonempty check (length(trim(code)) > 0),
  constraint organization_name_nonempty check (length(trim(name)) > 0)
);

create table public.clinic (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  code text not null,
  name text not null,
  address_text text,
  phone text,
  status public.record_status_enum not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinic_org_code_unique unique (organization_id, code),
  constraint clinic_code_nonempty check (length(trim(code)) > 0),
  constraint clinic_name_nonempty check (length(trim(name)) > 0)
);

create table public.user_account (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  clinic_id uuid references public.clinic(id) on delete set null,
  role public.user_role_enum not null,
  full_name text not null,
  email text,
  phone text,
  status public.record_status_enum not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_account_full_name_nonempty check (length(trim(full_name)) > 0)
);

create unique index user_account_org_email_unique
  on public.user_account (organization_id, lower(email))
  where email is not null;

create table public.doctor_profile (
  id uuid primary key default gen_random_uuid(),
  user_account_id uuid not null unique references public.user_account(id) on delete cascade,
  license_no text,
  specialty text,
  title text,
  default_clinic_id uuid references public.clinic(id) on delete set null,
  status public.record_status_enum not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index doctor_profile_license_no_unique
  on public.doctor_profile (license_no)
  where license_no is not null;

create table public.patient (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  external_patient_code text,
  full_name text not null,
  date_of_birth date,
  sex public.sex_enum not null default 'unknown',
  phone text,
  email text,
  address_text text,
  preferred_language text,
  communication_preference public.communication_preference_enum not null default 'mixed',
  status public.patient_status_enum not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patient_full_name_nonempty check (length(trim(full_name)) > 0)
);

create unique index patient_org_external_code_unique
  on public.patient (organization_id, external_patient_code)
  where external_patient_code is not null;

create index patient_org_status_idx
  on public.patient (organization_id, status);

create table public.caregiver_link (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient(id) on delete cascade,
  caregiver_name text not null,
  relationship_type public.relationship_type_enum not null default 'other',
  phone text,
  email text,
  notification_scope public.notification_scope_enum not null default 'none',
  is_primary boolean not null default false,
  status public.record_status_enum not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint caregiver_name_nonempty check (length(trim(caregiver_name)) > 0)
);

create unique index caregiver_link_one_primary_per_patient
  on public.caregiver_link (patient_id)
  where is_primary = true and status = 'active';

create table public.treatment_episode (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  clinic_id uuid not null references public.clinic(id) on delete restrict,
  patient_id uuid not null references public.patient(id) on delete cascade,
  primary_doctor_id uuid references public.doctor_profile(id) on delete set null,
  episode_type public.episode_type_enum not null,
  condition_group text,
  title text not null,
  clinical_summary text,
  start_date date not null,
  target_end_date date,
  current_status public.episode_status_enum not null default 'draft',
  risk_tier public.risk_tier_enum not null default 'low',
  next_review_due_at timestamptz,
  last_activity_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint treatment_episode_title_nonempty check (length(trim(title)) > 0),
  constraint treatment_episode_target_end_gte_start
    check (target_end_date is null or target_end_date >= start_date)
);

create table public.encounter (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  clinic_id uuid not null references public.clinic(id) on delete restrict,
  patient_id uuid not null references public.patient(id) on delete cascade,
  treatment_episode_id uuid not null references public.treatment_episode(id) on delete cascade,
  doctor_id uuid references public.doctor_profile(id) on delete set null,
  encounter_type public.encounter_type_enum not null,
  encounter_at timestamptz not null,
  chief_complaint text,
  assessment_summary text,
  plan_summary text,
  next_follow_up_recommendation_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.diagnosis (
  id uuid primary key default gen_random_uuid(),
  encounter_id uuid not null references public.encounter(id) on delete cascade,
  treatment_episode_id uuid not null references public.treatment_episode(id) on delete cascade,
  coding_system text,
  diagnosis_code text,
  diagnosis_label text not null,
  is_primary boolean not null default false,
  clinical_status public.diagnosis_status_enum not null default 'active',
  noted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint diagnosis_label_nonempty check (length(trim(diagnosis_label)) > 0)
);

create unique index diagnosis_one_primary_per_encounter
  on public.diagnosis (encounter_id)
  where is_primary = true;

create table public.medication_master (
  id uuid primary key default gen_random_uuid(),
  standard_code text,
  generic_name text not null,
  brand_name text,
  strength_text text not null,
  dosage_form public.dosage_form_enum not null,
  route public.route_enum not null,
  atc_class text,
  is_high_risk boolean not null default false,
  is_controlled_substance boolean not null default false,
  status public.record_status_enum not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint medication_generic_name_nonempty check (length(trim(generic_name)) > 0),
  constraint medication_strength_text_nonempty check (length(trim(strength_text)) > 0)
);

create unique index medication_master_standard_code_unique
  on public.medication_master (standard_code)
  where standard_code is not null;

create index medication_master_generic_name_idx
  on public.medication_master (lower(generic_name));

create table public.prescription (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  clinic_id uuid not null references public.clinic(id) on delete restrict,
  patient_id uuid not null references public.patient(id) on delete cascade,
  treatment_episode_id uuid not null references public.treatment_episode(id) on delete cascade,
  encounter_id uuid references public.encounter(id) on delete set null,
  doctor_id uuid references public.doctor_profile(id) on delete set null,
  parent_prescription_id uuid references public.prescription(id) on delete set null,
  prescription_kind public.prescription_kind_enum not null,
  issue_source public.prescription_source_enum not null,
  status public.prescription_status_enum not null default 'draft',
  issued_at timestamptz,
  effective_from date not null,
  effective_to date,
  days_supply_total integer,
  renewal_sequence_no integer not null default 0,
  clinical_note text,
  patient_friendly_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint prescription_effective_to_gte_from
    check (effective_to is null or effective_to >= effective_from),
  constraint prescription_days_supply_total_positive
    check (days_supply_total is null or days_supply_total > 0),
  constraint prescription_renewal_sequence_nonnegative
    check (renewal_sequence_no >= 0)
);

create table public.prescription_item (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references public.prescription(id) on delete cascade,
  line_no integer not null,
  medication_master_id uuid not null references public.medication_master(id) on delete restrict,
  indication_text text,
  dose_amount numeric(12,4) not null,
  dose_unit text not null,
  route public.route_enum not null,
  frequency_code text,
  frequency_text text not null,
  timing_relation public.timing_relation_enum not null default 'none',
  administration_instruction_text text not null,
  patient_instruction_text text not null,
  prn_flag boolean not null default false,
  prn_reason text,
  quantity_prescribed numeric(12,4) not null,
  quantity_unit text not null,
  days_supply integer not null,
  start_date date not null,
  end_date date,
  is_refillable boolean not null default false,
  max_refills_allowed integer not null default 0,
  requires_review_before_refill boolean not null default false,
  high_risk_review_flag boolean not null default false,
  status public.prescription_item_status_enum not null default 'active',
  stop_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint prescription_item_line_unique unique (prescription_id, line_no),
  constraint prescription_item_line_no_positive check (line_no > 0),
  constraint prescription_item_dose_amount_positive check (dose_amount > 0),
  constraint prescription_item_dose_unit_nonempty check (length(trim(dose_unit)) > 0),
  constraint prescription_item_frequency_text_nonempty check (length(trim(frequency_text)) > 0),
  constraint prescription_item_admin_instruction_nonempty
    check (length(trim(administration_instruction_text)) > 0),
  constraint prescription_item_patient_instruction_nonempty
    check (length(trim(patient_instruction_text)) > 0),
  constraint prescription_item_quantity_positive check (quantity_prescribed > 0),
  constraint prescription_item_quantity_unit_nonempty check (length(trim(quantity_unit)) > 0),
  constraint prescription_item_days_supply_positive check (days_supply > 0),
  constraint prescription_item_end_date_gte_start
    check (end_date is null or end_date >= start_date),
  constraint prescription_item_max_refills_nonnegative check (max_refills_allowed >= 0),
  constraint prescription_item_prn_reason_when_prn
    check ((prn_flag = false) or (prn_reason is not null and length(trim(prn_reason)) > 0))
);

create table public.dose_schedule (
  id uuid primary key default gen_random_uuid(),
  prescription_item_id uuid not null unique references public.prescription_item(id) on delete cascade,
  schedule_type public.dose_schedule_type_enum not null,
  timezone_mode public.timezone_mode_enum not null default 'patient_local_time',
  times_per_day integer,
  structured_schedule_json jsonb not null default '[]'::jsonb,
  first_dose_at timestamptz,
  last_dose_at timestamptz,
  grace_window_minutes integer not null default 60,
  mark_missed_after_minutes integer not null default 240,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dose_schedule_times_per_day_positive
    check (times_per_day is null or times_per_day > 0),
  constraint dose_schedule_grace_window_positive check (grace_window_minutes > 0),
  constraint dose_schedule_mark_missed_positive check (mark_missed_after_minutes > 0),
  constraint dose_schedule_last_dose_gte_first
    check (last_dose_at is null or first_dose_at is null or last_dose_at >= first_dose_at),
  constraint dose_schedule_json_is_object_or_array
    check (jsonb_typeof(structured_schedule_json) in ('array', 'object'))
);

create table public.refill_policy_snapshot (
  id uuid primary key default gen_random_uuid(),
  prescription_item_id uuid not null unique references public.prescription_item(id) on delete cascade,
  refill_mode public.refill_mode_enum not null,
  max_refills_allowed integer not null default 0,
  min_days_between_refills integer,
  earliest_refill_ratio numeric(5,4),
  review_required_after_date date,
  absolute_expiry_date date,
  late_refill_escalation_after_days integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint refill_policy_max_refills_nonnegative check (max_refills_allowed >= 0),
  constraint refill_policy_min_days_positive
    check (min_days_between_refills is null or min_days_between_refills > 0),
  constraint refill_policy_ratio_between_0_1
    check (earliest_refill_ratio is null or (earliest_refill_ratio >= 0 and earliest_refill_ratio <= 1)),
  constraint refill_policy_escalation_days_nonnegative
    check (late_refill_escalation_after_days is null or late_refill_escalation_after_days >= 0),
  constraint refill_policy_absolute_expiry_gte_review_date
    check (
      absolute_expiry_date is null
      or review_required_after_date is null
      or absolute_expiry_date >= review_required_after_date
    )
);

create table public.follow_up_plan (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  patient_id uuid not null references public.patient(id) on delete cascade,
  treatment_episode_id uuid not null references public.treatment_episode(id) on delete cascade,
  source_prescription_id uuid references public.prescription(id) on delete set null,
  owner_doctor_id uuid references public.doctor_profile(id) on delete set null,
  follow_up_type public.follow_up_type_enum not null,
  trigger_mode public.follow_up_trigger_mode_enum not null,
  due_at timestamptz,
  due_window_start_at timestamptz,
  due_window_end_at timestamptz,
  required_before_refill boolean not null default false,
  instruction_text text,
  status public.follow_up_status_enum not null default 'planned',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint follow_up_due_window_valid
    check (
      due_window_start_at is null
      or due_window_end_at is null
      or due_window_end_at >= due_window_start_at
    ),
  constraint follow_up_completed_at_logic
    check (
      (status <> 'completed')
      or completed_at is not null
    )
);

create table public.appointment (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  clinic_id uuid not null references public.clinic(id) on delete restrict,
  patient_id uuid not null references public.patient(id) on delete cascade,
  treatment_episode_id uuid not null references public.treatment_episode(id) on delete cascade,
  follow_up_plan_id uuid references public.follow_up_plan(id) on delete set null,
  doctor_id uuid references public.doctor_profile(id) on delete set null,
  appointment_type public.appointment_type_enum not null,
  scheduled_start_at timestamptz not null,
  scheduled_end_at timestamptz not null,
  status public.appointment_status_enum not null default 'scheduled',
  reason_text text,
  outcome_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointment_end_after_start check (scheduled_end_at > scheduled_start_at)
);

create table public.pre_visit_requirement (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointment(id) on delete cascade,
  requirement_type public.pre_visit_requirement_type_enum not null,
  instruction_text text not null,
  status public.pre_visit_requirement_status_enum not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pre_visit_instruction_nonempty check (length(trim(instruction_text)) > 0)
);

create table public.refill_request (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  patient_id uuid not null references public.patient(id) on delete cascade,
  treatment_episode_id uuid not null references public.treatment_episode(id) on delete cascade,
  request_scope public.request_scope_enum not null,
  source_prescription_id uuid not null references public.prescription(id) on delete restrict,
  requested_by_type public.requested_by_type_enum not null,
  requested_by_ref_id uuid,
  trigger_source public.refill_trigger_source_enum not null,
  preferred_fulfillment public.fulfillment_preference_enum not null default 'unspecified',
  patient_comment text,
  status public.refill_request_status_enum not null default 'submitted',
  submitted_at timestamptz not null default now(),
  triaged_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by_doctor_id uuid references public.doctor_profile(id) on delete set null,
  decision_note text,
  result_prescription_id uuid references public.prescription(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint refill_request_reviewed_at_logic
    check (
      reviewed_at is null
      or reviewed_at >= submitted_at
    )
);

create table public.refill_request_item (
  id uuid primary key default gen_random_uuid(),
  refill_request_id uuid not null references public.refill_request(id) on delete cascade,
  prescription_item_id uuid not null references public.prescription_item(id) on delete restrict,
  requested_quantity numeric(12,4),
  status public.refill_request_item_status_enum not null default 'pending',
  approved_quantity numeric(12,4),
  decision_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint refill_request_item_unique unique (refill_request_id, prescription_item_id),
  constraint refill_request_item_requested_qty_positive
    check (requested_quantity is null or requested_quantity > 0),
  constraint refill_request_item_approved_qty_positive
    check (approved_quantity is null or approved_quantity > 0)
);

create table public.treatment_event (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  patient_id uuid not null references public.patient(id) on delete cascade,
  treatment_episode_id uuid not null references public.treatment_episode(id) on delete cascade,
  entity_type public.treatment_entity_type_enum not null,
  entity_id uuid not null,
  event_type public.treatment_event_type_enum not null,
  event_at timestamptz not null default now(),
  actor_type public.actor_type_enum not null,
  actor_ref_id uuid,
  payload_json jsonb,
  visibility_scope public.visibility_scope_enum not null default 'internal_only',
  created_at timestamptz not null default now(),
  constraint treatment_event_payload_json_is_object_or_array
    check (payload_json is null or jsonb_typeof(payload_json) in ('array', 'object'))
);

-- ---------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------

create index clinic_organization_idx
  on public.clinic (organization_id);

create index user_account_org_clinic_role_idx
  on public.user_account (organization_id, clinic_id, role);

create index doctor_profile_default_clinic_idx
  on public.doctor_profile (default_clinic_id);

create index caregiver_link_patient_idx
  on public.caregiver_link (patient_id);

create index treatment_episode_org_clinic_status_idx
  on public.treatment_episode (organization_id, clinic_id, current_status);

create index treatment_episode_patient_status_idx
  on public.treatment_episode (patient_id, current_status);

create index treatment_episode_doctor_idx
  on public.treatment_episode (primary_doctor_id);

create index treatment_episode_next_review_due_idx
  on public.treatment_episode (next_review_due_at);

create index treatment_episode_last_activity_idx
  on public.treatment_episode (last_activity_at desc);

create index encounter_episode_at_idx
  on public.encounter (treatment_episode_id, encounter_at desc);

create index encounter_patient_at_idx
  on public.encounter (patient_id, encounter_at desc);

create index encounter_doctor_at_idx
  on public.encounter (doctor_id, encounter_at desc);

create index diagnosis_episode_idx
  on public.diagnosis (treatment_episode_id);

create index prescription_episode_status_idx
  on public.prescription (treatment_episode_id, status);

create index prescription_patient_status_idx
  on public.prescription (patient_id, status);

create index prescription_encounter_idx
  on public.prescription (encounter_id);

create index prescription_parent_idx
  on public.prescription (parent_prescription_id);

create index prescription_doctor_issued_at_idx
  on public.prescription (doctor_id, issued_at desc);

create index prescription_item_prescription_status_idx
  on public.prescription_item (prescription_id, status);

create index prescription_item_medication_idx
  on public.prescription_item (medication_master_id);

create index prescription_item_refillable_idx
  on public.prescription_item (is_refillable, requires_review_before_refill);

create index follow_up_plan_episode_status_due_idx
  on public.follow_up_plan (treatment_episode_id, status, due_at);

create index follow_up_plan_patient_status_due_idx
  on public.follow_up_plan (patient_id, status, due_at);

create index appointment_episode_status_start_idx
  on public.appointment (treatment_episode_id, status, scheduled_start_at);

create index appointment_patient_status_start_idx
  on public.appointment (patient_id, status, scheduled_start_at);

create index appointment_doctor_status_start_idx
  on public.appointment (doctor_id, status, scheduled_start_at);

create index pre_visit_requirement_appointment_status_idx
  on public.pre_visit_requirement (appointment_id, status);

create index refill_request_episode_status_submitted_idx
  on public.refill_request (treatment_episode_id, status, submitted_at desc);

create index refill_request_patient_status_submitted_idx
  on public.refill_request (patient_id, status, submitted_at desc);

create index refill_request_source_prescription_idx
  on public.refill_request (source_prescription_id);

create index refill_request_reviewed_by_idx
  on public.refill_request (reviewed_by_doctor_id, reviewed_at desc);

create index refill_request_item_prescription_item_idx
  on public.refill_request_item (prescription_item_id);

create index treatment_event_episode_time_idx
  on public.treatment_event (treatment_episode_id, event_at desc);

create index treatment_event_patient_time_idx
  on public.treatment_event (patient_id, event_at desc);

create index treatment_event_entity_idx
  on public.treatment_event (entity_type, entity_id, event_at desc);

create index treatment_event_type_time_idx
  on public.treatment_event (event_type, event_at desc);

-- ---------------------------------------------------------
-- Triggers: updated_at
-- ---------------------------------------------------------

create trigger set_updated_at_organization
before update on public.organization
for each row execute function public.set_updated_at();

create trigger set_updated_at_clinic
before update on public.clinic
for each row execute function public.set_updated_at();

create trigger set_updated_at_user_account
before update on public.user_account
for each row execute function public.set_updated_at();

create trigger set_updated_at_doctor_profile
before update on public.doctor_profile
for each row execute function public.set_updated_at();

create trigger set_updated_at_patient
before update on public.patient
for each row execute function public.set_updated_at();

create trigger set_updated_at_caregiver_link
before update on public.caregiver_link
for each row execute function public.set_updated_at();

create trigger set_updated_at_treatment_episode
before update on public.treatment_episode
for each row execute function public.set_updated_at();

create trigger set_updated_at_encounter
before update on public.encounter
for each row execute function public.set_updated_at();

create trigger set_updated_at_diagnosis
before update on public.diagnosis
for each row execute function public.set_updated_at();

create trigger set_updated_at_medication_master
before update on public.medication_master
for each row execute function public.set_updated_at();

create trigger set_updated_at_prescription
before update on public.prescription
for each row execute function public.set_updated_at();

create trigger set_updated_at_prescription_item
before update on public.prescription_item
for each row execute function public.set_updated_at();

create trigger set_updated_at_dose_schedule
before update on public.dose_schedule
for each row execute function public.set_updated_at();

create trigger set_updated_at_refill_policy_snapshot
before update on public.refill_policy_snapshot
for each row execute function public.set_updated_at();

create trigger set_updated_at_follow_up_plan
before update on public.follow_up_plan
for each row execute function public.set_updated_at();

create trigger set_updated_at_appointment
before update on public.appointment
for each row execute function public.set_updated_at();

create trigger set_updated_at_pre_visit_requirement
before update on public.pre_visit_requirement
for each row execute function public.set_updated_at();

create trigger set_updated_at_refill_request
before update on public.refill_request
for each row execute function public.set_updated_at();

create trigger set_updated_at_refill_request_item
before update on public.refill_request_item
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------
-- Helpful comments
-- ---------------------------------------------------------

comment on table public.organization is 'Top-level tenant / owning healthcare organization.';
comment on table public.clinic is 'Physical or logical clinic under an organization.';
comment on table public.user_account is 'Internal user account for staff roles.';
comment on table public.doctor_profile is 'Clinical doctor profile extending a user account.';
comment on table public.patient is 'Patient master record.';
comment on table public.caregiver_link is 'Linked caregiver/family member for a patient.';
comment on table public.treatment_episode is 'Top-level treatment journey for a condition or therapy course.';
comment on table public.encounter is 'Consultation, follow-up contact, or refill review.';
comment on table public.diagnosis is 'Diagnosis captured during an encounter and linked to an episode.';
comment on table public.medication_master is 'Medication catalog / normalized medication reference.';
comment on table public.prescription is 'Prescription header / one issuance event.';
comment on table public.prescription_item is 'Atomic medication line item within a prescription.';
comment on table public.dose_schedule is 'Structured dosing schedule for a prescription item.';
comment on table public.refill_policy_snapshot is 'Immutable refill policy snapshot for a prescription item.';
comment on table public.refill_request is 'Refill workflow request at the process level.';
comment on table public.refill_request_item is 'Medication line items requested for refill.';
comment on table public.follow_up_plan is 'Follow-up / review plan tied to an episode or prescription.';
comment on table public.appointment is 'Scheduled revisit / review appointment.';
comment on table public.pre_visit_requirement is 'Checklist item required before an appointment.';
comment on table public.treatment_event is 'Timeline / audit ledger across the treatment lifecycle.';

comment on column public.treatment_episode.condition_group is 'Open text taxonomy such as hypertension, diabetes, respiratory, post_op.';
comment on column public.prescription.parent_prescription_id is 'Links renewal/adjustment/continuation back to the prior prescription.';
comment on column public.dose_schedule.structured_schedule_json is 'JSON structure for fixed times, taper plans, cyclic schedules, etc.';
comment on column public.refill_request.result_prescription_id is 'New prescription generated after refill approval.';
comment on column public.treatment_event.entity_id is 'Polymorphic target row ID identified by entity_type.';
comment on column public.treatment_event.actor_ref_id is 'Polymorphic actor row ID identified by actor_type.';

-- ---------------------------------------------------------
-- End of Phase 1 lifecycle core migration
-- ---------------------------------------------------------
