-- Thuocare merged SQL bundle
-- Deterministic order: migrations by timestamp asc, seed.sql last


-- ============================================================
-- SOURCE: supabase/migrations/20260322020100_phase_1_lifecycle_core_supabase.sql
-- ============================================================


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




-- ============================================================
-- SOURCE: supabase/migrations/20260322020200_phase_1_lifecycle_core_rls_policies.sql
-- ============================================================

-- =========================================================
-- Prescription-to-Adherence Platform
-- Phase 1 / Lifecycle Core
-- Supabase RLS + helper auth bridge
--
-- Assumptions:
-- 1) Staff users authenticate with auth.users and map to public.user_account.auth_user_id.
-- 2) Patients authenticate with auth.users and map to public.patient.auth_user_id.
-- 3) Caregiver direct login is not modeled yet in this baseline.
-- 4) service_role bypasses RLS as usual in Supabase.
-- =========================================================

begin;

-- ---------------------------------------------------------
-- Auth bridge columns
-- ---------------------------------------------------------

alter table public.user_account
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

alter table public.patient
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create unique index if not exists user_account_auth_user_id_unique
  on public.user_account (auth_user_id)
  where auth_user_id is not null;

create unique index if not exists patient_auth_user_id_unique
  on public.patient (auth_user_id)
  where auth_user_id is not null;

comment on column public.user_account.auth_user_id is 'Links staff account to auth.users.id for Supabase RLS.';
comment on column public.patient.auth_user_id is 'Links patient account to auth.users.id for Supabase RLS.';

-- ---------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------

create or replace function public.current_staff_user_account_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select ua.id
  from public.user_account ua
  where ua.auth_user_id = auth.uid()
    and ua.status = 'active'
  limit 1
$$;

create or replace function public.current_staff_role()
returns public.user_role_enum
language sql
stable
security definer
set search_path = public
as $$
  select ua.role
  from public.user_account ua
  where ua.auth_user_id = auth.uid()
    and ua.status = 'active'
  limit 1
$$;

create or replace function public.current_doctor_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select dp.id
  from public.doctor_profile dp
  join public.user_account ua on ua.id = dp.user_account_id
  where ua.auth_user_id = auth.uid()
    and ua.status = 'active'
    and dp.status = 'active'
  limit 1
$$;

create or replace function public.current_patient_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.patient p
  where p.auth_user_id = auth.uid()
    and p.status = 'active'
  limit 1
$$;

create or replace function public.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select x.organization_id
  from (
    select ua.organization_id, 1 as priority
    from public.user_account ua
    where ua.auth_user_id = auth.uid()
      and ua.status = 'active'

    union all

    select p.organization_id, 2 as priority
    from public.patient p
    where p.auth_user_id = auth.uid()
      and p.status = 'active'
  ) x
  order by x.priority
  limit 1
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_staff_user_account_id() is not null
$$;

create or replace function public.is_patient_actor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_patient_id() is not null
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_staff_role() = 'admin'::public.user_role_enum
$$;

create or replace function public.is_doctor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_staff_role() = 'doctor'::public.user_role_enum
$$;

create or replace function public.is_nurse()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_staff_role() = 'nurse'::public.user_role_enum
$$;

create or replace function public.is_pharmacist()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_staff_role() = 'pharmacist'::public.user_role_enum
$$;

create or replace function public.is_care_coordinator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_staff_role() = 'care_coordinator'::public.user_role_enum
$$;

create or replace function public.can_write_clinical_data()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_staff_role() in (
    'doctor'::public.user_role_enum,
    'nurse'::public.user_role_enum,
    'care_coordinator'::public.user_role_enum,
    'admin'::public.user_role_enum
  )
$$;

create or replace function public.can_write_prescriptions()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_staff_role() in (
    'doctor'::public.user_role_enum,
    'admin'::public.user_role_enum
  )
$$;

create or replace function public.can_manage_refills()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_staff_role() in (
    'doctor'::public.user_role_enum,
    'nurse'::public.user_role_enum,
    'pharmacist'::public.user_role_enum,
    'care_coordinator'::public.user_role_enum,
    'admin'::public.user_role_enum
  )
$$;

create or replace function public.can_manage_medication_catalog()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_staff_role() in (
    'pharmacist'::public.user_role_enum,
    'admin'::public.user_role_enum
  )
$$;

create or replace function public.belongs_to_current_org(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_org_id = public.current_organization_id()
$$;

create or replace function public.is_current_patient(target_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_patient_id = public.current_patient_id()
$$;

create or replace function public.patient_belongs_to_current_org(target_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.patient p
    where p.id = target_patient_id
      and p.organization_id = public.current_organization_id()
  )
$$;

create or replace function public.episode_belongs_to_current_org(target_episode_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.treatment_episode te
    where te.id = target_episode_id
      and te.organization_id = public.current_organization_id()
  )
$$;

create or replace function public.encounter_belongs_to_current_org(target_encounter_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.encounter e
    where e.id = target_encounter_id
      and e.organization_id = public.current_organization_id()
  )
$$;

create or replace function public.prescription_belongs_to_current_org(target_prescription_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.prescription p
    where p.id = target_prescription_id
      and p.organization_id = public.current_organization_id()
  )
$$;

create or replace function public.prescription_item_belongs_to_current_org(target_prescription_item_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.prescription_item pi
    join public.prescription p on p.id = pi.prescription_id
    where pi.id = target_prescription_item_id
      and p.organization_id = public.current_organization_id()
  )
$$;

create or replace function public.follow_up_belongs_to_current_org(target_follow_up_plan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.follow_up_plan fup
    where fup.id = target_follow_up_plan_id
      and fup.organization_id = public.current_organization_id()
  )
$$;

create or replace function public.appointment_belongs_to_current_org(target_appointment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.appointment a
    where a.id = target_appointment_id
      and a.organization_id = public.current_organization_id()
  )
$$;

create or replace function public.refill_request_belongs_to_current_org(target_refill_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.refill_request rr
    where rr.id = target_refill_request_id
      and rr.organization_id = public.current_organization_id()
  )
$$;

grant execute on function public.current_staff_user_account_id() to authenticated;
grant execute on function public.current_staff_role() to authenticated;
grant execute on function public.current_doctor_profile_id() to authenticated;
grant execute on function public.current_patient_id() to authenticated;
grant execute on function public.current_organization_id() to authenticated;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_patient_actor() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_doctor() to authenticated;
grant execute on function public.is_nurse() to authenticated;
grant execute on function public.is_pharmacist() to authenticated;
grant execute on function public.is_care_coordinator() to authenticated;
grant execute on function public.can_write_clinical_data() to authenticated;
grant execute on function public.can_write_prescriptions() to authenticated;
grant execute on function public.can_manage_refills() to authenticated;
grant execute on function public.can_manage_medication_catalog() to authenticated;
grant execute on function public.belongs_to_current_org(uuid) to authenticated;
grant execute on function public.is_current_patient(uuid) to authenticated;
grant execute on function public.patient_belongs_to_current_org(uuid) to authenticated;
grant execute on function public.episode_belongs_to_current_org(uuid) to authenticated;
grant execute on function public.encounter_belongs_to_current_org(uuid) to authenticated;
grant execute on function public.prescription_belongs_to_current_org(uuid) to authenticated;
grant execute on function public.prescription_item_belongs_to_current_org(uuid) to authenticated;
grant execute on function public.follow_up_belongs_to_current_org(uuid) to authenticated;
grant execute on function public.appointment_belongs_to_current_org(uuid) to authenticated;
grant execute on function public.refill_request_belongs_to_current_org(uuid) to authenticated;

-- ---------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------

revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;

grant usage on schema public to authenticated;
grant select, insert, update on all tables in schema public to authenticated;

-- ---------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------

alter table public.organization enable row level security;
alter table public.clinic enable row level security;
alter table public.user_account enable row level security;
alter table public.doctor_profile enable row level security;
alter table public.patient enable row level security;
alter table public.caregiver_link enable row level security;
alter table public.treatment_episode enable row level security;
alter table public.encounter enable row level security;
alter table public.diagnosis enable row level security;
alter table public.medication_master enable row level security;
alter table public.prescription enable row level security;
alter table public.prescription_item enable row level security;
alter table public.dose_schedule enable row level security;
alter table public.refill_policy_snapshot enable row level security;
alter table public.follow_up_plan enable row level security;
alter table public.appointment enable row level security;
alter table public.pre_visit_requirement enable row level security;
alter table public.refill_request enable row level security;
alter table public.refill_request_item enable row level security;
alter table public.treatment_event enable row level security;

-- ---------------------------------------------------------
-- organization
-- ---------------------------------------------------------

drop policy if exists organization_staff_select_own_org on public.organization;
create policy organization_staff_select_own_org
on public.organization
for select
using (public.is_staff() and public.belongs_to_current_org(id));

drop policy if exists organization_admin_update_own_org on public.organization;
create policy organization_admin_update_own_org
on public.organization
for update
using (public.is_admin() and public.belongs_to_current_org(id))
with check (public.is_admin() and public.belongs_to_current_org(id));

-- ---------------------------------------------------------
-- clinic
-- ---------------------------------------------------------

drop policy if exists clinic_staff_select_same_org on public.clinic;
create policy clinic_staff_select_same_org
on public.clinic
for select
using (public.is_staff() and public.belongs_to_current_org(organization_id));

drop policy if exists clinic_admin_manage_same_org on public.clinic;
create policy clinic_admin_manage_same_org
on public.clinic
for all
using (public.is_admin() and public.belongs_to_current_org(organization_id))
with check (public.is_admin() and public.belongs_to_current_org(organization_id));

-- ---------------------------------------------------------
-- user_account
-- ---------------------------------------------------------

drop policy if exists user_account_staff_select_same_org on public.user_account;
create policy user_account_staff_select_same_org
on public.user_account
for select
using (public.is_staff() and public.belongs_to_current_org(organization_id));

drop policy if exists user_account_self_select on public.user_account;
create policy user_account_self_select
on public.user_account
for select
using (auth.uid() = auth_user_id);

drop policy if exists user_account_admin_manage_same_org on public.user_account;
create policy user_account_admin_manage_same_org
on public.user_account
for all
using (public.is_admin() and public.belongs_to_current_org(organization_id))
with check (public.is_admin() and public.belongs_to_current_org(organization_id));

-- ---------------------------------------------------------
-- doctor_profile
-- ---------------------------------------------------------

drop policy if exists doctor_profile_staff_select_same_org on public.doctor_profile;
create policy doctor_profile_staff_select_same_org
on public.doctor_profile
for select
using (
  public.is_staff()
  and exists (
    select 1
    from public.user_account ua
    where ua.id = user_account_id
      and ua.organization_id = public.current_organization_id()
  )
);

drop policy if exists doctor_profile_self_select on public.doctor_profile;
create policy doctor_profile_self_select
on public.doctor_profile
for select
using (
  exists (
    select 1
    from public.user_account ua
    where ua.id = user_account_id
      and ua.auth_user_id = auth.uid()
  )
);

drop policy if exists doctor_profile_admin_manage_same_org on public.doctor_profile;
create policy doctor_profile_admin_manage_same_org
on public.doctor_profile
for all
using (
  public.is_admin()
  and exists (
    select 1
    from public.user_account ua
    where ua.id = user_account_id
      and ua.organization_id = public.current_organization_id()
  )
)
with check (
  public.is_admin()
  and exists (
    select 1
    from public.user_account ua
    where ua.id = user_account_id
      and ua.organization_id = public.current_organization_id()
  )
);

-- ---------------------------------------------------------
-- patient
-- ---------------------------------------------------------

drop policy if exists patient_staff_select_same_org on public.patient;
create policy patient_staff_select_same_org
on public.patient
for select
using (public.is_staff() and public.belongs_to_current_org(organization_id));

drop policy if exists patient_self_select on public.patient;
create policy patient_self_select
on public.patient
for select
using (auth.uid() = auth_user_id);

drop policy if exists patient_staff_insert_same_org on public.patient;
create policy patient_staff_insert_same_org
on public.patient
for insert
with check (public.can_write_clinical_data() and public.belongs_to_current_org(organization_id));

drop policy if exists patient_staff_update_same_org on public.patient;
create policy patient_staff_update_same_org
on public.patient
for update
using (public.can_write_clinical_data() and public.belongs_to_current_org(organization_id))
with check (public.can_write_clinical_data() and public.belongs_to_current_org(organization_id));

-- ---------------------------------------------------------
-- caregiver_link
-- ---------------------------------------------------------

drop policy if exists caregiver_link_staff_select_same_org on public.caregiver_link;
create policy caregiver_link_staff_select_same_org
on public.caregiver_link
for select
using (public.is_staff() and public.patient_belongs_to_current_org(patient_id));

drop policy if exists caregiver_link_patient_select_own on public.caregiver_link;
create policy caregiver_link_patient_select_own
on public.caregiver_link
for select
using (public.is_current_patient(patient_id));

drop policy if exists caregiver_link_staff_manage_same_org on public.caregiver_link;
create policy caregiver_link_staff_manage_same_org
on public.caregiver_link
for all
using (public.can_write_clinical_data() and public.patient_belongs_to_current_org(patient_id))
with check (public.can_write_clinical_data() and public.patient_belongs_to_current_org(patient_id));

-- ---------------------------------------------------------
-- treatment_episode
-- ---------------------------------------------------------

drop policy if exists treatment_episode_staff_select_same_org on public.treatment_episode;
create policy treatment_episode_staff_select_same_org
on public.treatment_episode
for select
using (public.is_staff() and public.belongs_to_current_org(organization_id));

drop policy if exists treatment_episode_patient_select_own on public.treatment_episode;
create policy treatment_episode_patient_select_own
on public.treatment_episode
for select
using (public.is_current_patient(patient_id));

drop policy if exists treatment_episode_staff_manage_same_org on public.treatment_episode;
create policy treatment_episode_staff_manage_same_org
on public.treatment_episode
for all
using (public.can_write_clinical_data() and public.belongs_to_current_org(organization_id))
with check (public.can_write_clinical_data() and public.belongs_to_current_org(organization_id));

-- ---------------------------------------------------------
-- encounter
-- ---------------------------------------------------------

drop policy if exists encounter_staff_select_same_org on public.encounter;
create policy encounter_staff_select_same_org
on public.encounter
for select
using (public.is_staff() and public.belongs_to_current_org(organization_id));

drop policy if exists encounter_patient_select_own on public.encounter;
create policy encounter_patient_select_own
on public.encounter
for select
using (public.is_current_patient(patient_id));

drop policy if exists encounter_staff_manage_same_org on public.encounter;
create policy encounter_staff_manage_same_org
on public.encounter
for all
using (public.can_write_clinical_data() and public.belongs_to_current_org(organization_id))
with check (public.can_write_clinical_data() and public.belongs_to_current_org(organization_id));

-- ---------------------------------------------------------
-- diagnosis
-- ---------------------------------------------------------

drop policy if exists diagnosis_staff_select_same_org on public.diagnosis;
create policy diagnosis_staff_select_same_org
on public.diagnosis
for select
using (public.is_staff() and public.episode_belongs_to_current_org(treatment_episode_id));

drop policy if exists diagnosis_patient_select_own on public.diagnosis;
create policy diagnosis_patient_select_own
on public.diagnosis
for select
using (
  exists (
    select 1
    from public.treatment_episode te
    where te.id = treatment_episode_id
      and te.patient_id = public.current_patient_id()
  )
);

drop policy if exists diagnosis_staff_manage_same_org on public.diagnosis;
create policy diagnosis_staff_manage_same_org
on public.diagnosis
for all
using (public.can_write_clinical_data() and public.episode_belongs_to_current_org(treatment_episode_id))
with check (public.can_write_clinical_data() and public.episode_belongs_to_current_org(treatment_episode_id));

-- ---------------------------------------------------------
-- medication_master
-- ---------------------------------------------------------

drop policy if exists medication_master_staff_select on public.medication_master;
create policy medication_master_staff_select
on public.medication_master
for select
using (public.is_staff());

drop policy if exists medication_master_catalog_manage on public.medication_master;
create policy medication_master_catalog_manage
on public.medication_master
for all
using (public.can_manage_medication_catalog())
with check (public.can_manage_medication_catalog());

-- ---------------------------------------------------------
-- prescription
-- ---------------------------------------------------------

drop policy if exists prescription_staff_select_same_org on public.prescription;
create policy prescription_staff_select_same_org
on public.prescription
for select
using (public.is_staff() and public.belongs_to_current_org(organization_id));

drop policy if exists prescription_patient_select_own on public.prescription;
create policy prescription_patient_select_own
on public.prescription
for select
using (public.is_current_patient(patient_id));

drop policy if exists prescription_staff_manage_same_org on public.prescription;
create policy prescription_staff_manage_same_org
on public.prescription
for all
using (public.can_write_prescriptions() and public.belongs_to_current_org(organization_id))
with check (public.can_write_prescriptions() and public.belongs_to_current_org(organization_id));

-- ---------------------------------------------------------
-- prescription_item
-- ---------------------------------------------------------

drop policy if exists prescription_item_staff_select_same_org on public.prescription_item;
create policy prescription_item_staff_select_same_org
on public.prescription_item
for select
using (public.is_staff() and public.prescription_belongs_to_current_org(prescription_id));

drop policy if exists prescription_item_patient_select_own on public.prescription_item;
create policy prescription_item_patient_select_own
on public.prescription_item
for select
using (
  exists (
    select 1
    from public.prescription p
    where p.id = prescription_id
      and p.patient_id = public.current_patient_id()
  )
);

drop policy if exists prescription_item_staff_manage_same_org on public.prescription_item;
create policy prescription_item_staff_manage_same_org
on public.prescription_item
for all
using (public.can_write_prescriptions() and public.prescription_belongs_to_current_org(prescription_id))
with check (public.can_write_prescriptions() and public.prescription_belongs_to_current_org(prescription_id));

-- ---------------------------------------------------------
-- dose_schedule
-- ---------------------------------------------------------

drop policy if exists dose_schedule_staff_select_same_org on public.dose_schedule;
create policy dose_schedule_staff_select_same_org
on public.dose_schedule
for select
using (public.is_staff() and public.prescription_item_belongs_to_current_org(prescription_item_id));

drop policy if exists dose_schedule_patient_select_own on public.dose_schedule;
create policy dose_schedule_patient_select_own
on public.dose_schedule
for select
using (
  exists (
    select 1
    from public.prescription_item pi
    join public.prescription p on p.id = pi.prescription_id
    where pi.id = prescription_item_id
      and p.patient_id = public.current_patient_id()
  )
);

drop policy if exists dose_schedule_staff_manage_same_org on public.dose_schedule;
create policy dose_schedule_staff_manage_same_org
on public.dose_schedule
for all
using (public.can_write_prescriptions() and public.prescription_item_belongs_to_current_org(prescription_item_id))
with check (public.can_write_prescriptions() and public.prescription_item_belongs_to_current_org(prescription_item_id));

-- ---------------------------------------------------------
-- refill_policy_snapshot
-- ---------------------------------------------------------

drop policy if exists refill_policy_snapshot_staff_select_same_org on public.refill_policy_snapshot;
create policy refill_policy_snapshot_staff_select_same_org
on public.refill_policy_snapshot
for select
using (public.is_staff() and public.prescription_item_belongs_to_current_org(prescription_item_id));

drop policy if exists refill_policy_snapshot_patient_select_own on public.refill_policy_snapshot;
create policy refill_policy_snapshot_patient_select_own
on public.refill_policy_snapshot
for select
using (
  exists (
    select 1
    from public.prescription_item pi
    join public.prescription p on p.id = pi.prescription_id
    where pi.id = prescription_item_id
      and p.patient_id = public.current_patient_id()
  )
);

drop policy if exists refill_policy_snapshot_staff_manage_same_org on public.refill_policy_snapshot;
create policy refill_policy_snapshot_staff_manage_same_org
on public.refill_policy_snapshot
for all
using (public.can_write_prescriptions() and public.prescription_item_belongs_to_current_org(prescription_item_id))
with check (public.can_write_prescriptions() and public.prescription_item_belongs_to_current_org(prescription_item_id));

-- ---------------------------------------------------------
-- follow_up_plan
-- ---------------------------------------------------------

drop policy if exists follow_up_plan_staff_select_same_org on public.follow_up_plan;
create policy follow_up_plan_staff_select_same_org
on public.follow_up_plan
for select
using (public.is_staff() and public.belongs_to_current_org(organization_id));

drop policy if exists follow_up_plan_patient_select_own on public.follow_up_plan;
create policy follow_up_plan_patient_select_own
on public.follow_up_plan
for select
using (public.is_current_patient(patient_id));

drop policy if exists follow_up_plan_staff_manage_same_org on public.follow_up_plan;
create policy follow_up_plan_staff_manage_same_org
on public.follow_up_plan
for all
using (public.can_write_clinical_data() and public.belongs_to_current_org(organization_id))
with check (public.can_write_clinical_data() and public.belongs_to_current_org(organization_id));

-- ---------------------------------------------------------
-- appointment
-- ---------------------------------------------------------

drop policy if exists appointment_staff_select_same_org on public.appointment;
create policy appointment_staff_select_same_org
on public.appointment
for select
using (public.is_staff() and public.belongs_to_current_org(organization_id));

drop policy if exists appointment_patient_select_own on public.appointment;
create policy appointment_patient_select_own
on public.appointment
for select
using (public.is_current_patient(patient_id));

drop policy if exists appointment_staff_manage_same_org on public.appointment;
create policy appointment_staff_manage_same_org
on public.appointment
for all
using (public.can_write_clinical_data() and public.belongs_to_current_org(organization_id))
with check (public.can_write_clinical_data() and public.belongs_to_current_org(organization_id));

-- ---------------------------------------------------------
-- pre_visit_requirement
-- ---------------------------------------------------------

drop policy if exists pre_visit_requirement_staff_select_same_org on public.pre_visit_requirement;
create policy pre_visit_requirement_staff_select_same_org
on public.pre_visit_requirement
for select
using (public.is_staff() and public.appointment_belongs_to_current_org(appointment_id));

drop policy if exists pre_visit_requirement_patient_select_own on public.pre_visit_requirement;
create policy pre_visit_requirement_patient_select_own
on public.pre_visit_requirement
for select
using (
  exists (
    select 1
    from public.appointment a
    where a.id = appointment_id
      and a.patient_id = public.current_patient_id()
  )
);

drop policy if exists pre_visit_requirement_staff_manage_same_org on public.pre_visit_requirement;
create policy pre_visit_requirement_staff_manage_same_org
on public.pre_visit_requirement
for all
using (public.can_write_clinical_data() and public.appointment_belongs_to_current_org(appointment_id))
with check (public.can_write_clinical_data() and public.appointment_belongs_to_current_org(appointment_id));

-- ---------------------------------------------------------
-- refill_request
-- ---------------------------------------------------------

drop policy if exists refill_request_staff_select_same_org on public.refill_request;
create policy refill_request_staff_select_same_org
on public.refill_request
for select
using (public.is_staff() and public.belongs_to_current_org(organization_id));

drop policy if exists refill_request_patient_select_own on public.refill_request;
create policy refill_request_patient_select_own
on public.refill_request
for select
using (public.is_current_patient(patient_id));

drop policy if exists refill_request_patient_insert_own on public.refill_request;
create policy refill_request_patient_insert_own
on public.refill_request
for insert
with check (
  public.is_patient_actor()
  and public.is_current_patient(patient_id)
  and public.belongs_to_current_org(organization_id)
  and requested_by_type = 'patient'::public.requested_by_type_enum
  and (requested_by_ref_id is null or requested_by_ref_id = public.current_patient_id())
  and exists (
    select 1
    from public.prescription p
    where p.id = source_prescription_id
      and p.patient_id = public.current_patient_id()
      and p.treatment_episode_id = treatment_episode_id
      and p.organization_id = organization_id
  )
);

drop policy if exists refill_request_staff_manage_same_org on public.refill_request;
create policy refill_request_staff_manage_same_org
on public.refill_request
for all
using (public.can_manage_refills() and public.belongs_to_current_org(organization_id))
with check (public.can_manage_refills() and public.belongs_to_current_org(organization_id));

-- ---------------------------------------------------------
-- refill_request_item
-- ---------------------------------------------------------

drop policy if exists refill_request_item_staff_select_same_org on public.refill_request_item;
create policy refill_request_item_staff_select_same_org
on public.refill_request_item
for select
using (public.is_staff() and public.refill_request_belongs_to_current_org(refill_request_id));

drop policy if exists refill_request_item_patient_select_own on public.refill_request_item;
create policy refill_request_item_patient_select_own
on public.refill_request_item
for select
using (
  exists (
    select 1
    from public.refill_request rr
    where rr.id = refill_request_id
      and rr.patient_id = public.current_patient_id()
  )
);

drop policy if exists refill_request_item_patient_insert_own on public.refill_request_item;
create policy refill_request_item_patient_insert_own
on public.refill_request_item
for insert
with check (
  public.is_patient_actor()
  and exists (
    select 1
    from public.refill_request rr
    join public.prescription_item pi on pi.id = prescription_item_id
    where rr.id = refill_request_id
      and rr.patient_id = public.current_patient_id()
      and rr.status = 'submitted'::public.refill_request_status_enum
      and pi.prescription_id = rr.source_prescription_id
  )
);

drop policy if exists refill_request_item_staff_manage_same_org on public.refill_request_item;
create policy refill_request_item_staff_manage_same_org
on public.refill_request_item
for all
using (public.can_manage_refills() and public.refill_request_belongs_to_current_org(refill_request_id))
with check (public.can_manage_refills() and public.refill_request_belongs_to_current_org(refill_request_id));

-- ---------------------------------------------------------
-- treatment_event
-- ---------------------------------------------------------

drop policy if exists treatment_event_staff_select_same_org on public.treatment_event;
create policy treatment_event_staff_select_same_org
on public.treatment_event
for select
using (public.is_staff() and public.belongs_to_current_org(organization_id));

drop policy if exists treatment_event_patient_select_visible_own on public.treatment_event;
create policy treatment_event_patient_select_visible_own
on public.treatment_event
for select
using (
  public.is_current_patient(patient_id)
  and visibility_scope = 'patient_visible'::public.visibility_scope_enum
);

commit;




-- ============================================================
-- SOURCE: supabase/migrations/20260322020300_phase_1_auth_onboarding_helpers.sql
-- ============================================================

-- =========================================================
-- Prescription-to-Adherence Platform
-- Phase 1 / Supabase Auth Onboarding Helpers
--
-- Purpose:
-- 1) Safely map auth.users -> public.user_account / public.patient
-- 2) Support automatic linking on signup using raw_user_meta_data
-- 3) Provide manual self-claim RPCs for repair / re-link flows
-- 4) Log onboarding failures for admin/service-role review
--
-- Expected signup metadata examples:
--   { "actor_type": "staff",   "organization_code": "ORG_DEMO" }
--   { "actor_type": "patient", "organization_code": "ORG_DEMO" }
--
-- Run order:
-- 1) phase_1_lifecycle_core_supabase.sql
-- 2) phase_1_lifecycle_core_rls_policies.sql
-- 3) THIS FILE
-- =========================================================

begin;

-- ---------------------------------------------------------
-- Email uniqueness to support safe patient self-claim in one org
-- ---------------------------------------------------------

create unique index if not exists patient_org_email_unique
  on public.patient (organization_id, lower(email))
  where email is not null;

comment on index public.patient_org_email_unique is 'Ensures one patient email per organization for auth self-claim.';

-- ---------------------------------------------------------
-- Operational log for onboarding failures / mismatches
-- ---------------------------------------------------------

create table if not exists public.onboarding_issue_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organization(id) on delete set null,
  actor_type text not null check (actor_type in ('staff', 'patient', 'unknown')),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  auth_email text,
  organization_code text,
  issue_code text not null check (
    issue_code in (
      'missing_actor_type',
      'unsupported_actor_type',
      'missing_email',
      'org_not_found',
      'no_matching_profile',
      'multiple_matching_profiles',
      'profile_already_linked',
      'claim_conflict'
    )
  ),
  details jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  resolved_by_user_account_id uuid references public.user_account(id) on delete set null,
  resolution_note text,
  created_at timestamptz not null default now()
);

create index if not exists onboarding_issue_log_org_created_idx
  on public.onboarding_issue_log (organization_id, created_at desc);

create index if not exists onboarding_issue_log_auth_user_idx
  on public.onboarding_issue_log (auth_user_id, created_at desc);

create index if not exists onboarding_issue_log_unresolved_idx
  on public.onboarding_issue_log (created_at desc)
  where resolved_at is null;

comment on table public.onboarding_issue_log is 'Internal operational log for failed or ambiguous auth onboarding/linking attempts.';

alter table public.onboarding_issue_log enable row level security;

-- service_role bypasses RLS as usual; admins can inspect only their own org issues.
drop policy if exists onboarding_issue_log_admin_select on public.onboarding_issue_log;
create policy onboarding_issue_log_admin_select
  on public.onboarding_issue_log
  for select
  using (
    public.is_admin()
    and organization_id is not null
    and public.belongs_to_current_org(organization_id)
  );

drop policy if exists onboarding_issue_log_admin_update on public.onboarding_issue_log;
create policy onboarding_issue_log_admin_update
  on public.onboarding_issue_log
  for update
  using (
    public.is_admin()
    and organization_id is not null
    and public.belongs_to_current_org(organization_id)
  )
  with check (
    public.is_admin()
    and organization_id is not null
    and public.belongs_to_current_org(organization_id)
  );

grant select, update on public.onboarding_issue_log to authenticated;

-- ---------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------

create or replace function public.current_user_email()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select lower(nullif(coalesce(auth.jwt() ->> 'email', ''), ''))
$$;

create or replace function public.resolve_organization_id_by_code(p_organization_code text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select o.id
  from public.organization o
  where lower(o.code) = lower(trim(p_organization_code))
    and o.status = 'active'
  limit 1
$$;

create or replace function public.log_onboarding_issue(
  p_organization_id uuid,
  p_actor_type text,
  p_auth_user_id uuid,
  p_auth_email text,
  p_organization_code text,
  p_issue_code text,
  p_details jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_issue_id uuid;
begin
  insert into public.onboarding_issue_log (
    organization_id,
    actor_type,
    auth_user_id,
    auth_email,
    organization_code,
    issue_code,
    details
  )
  values (
    p_organization_id,
    case when p_actor_type in ('staff', 'patient', 'unknown') then p_actor_type else 'unknown' end,
    p_auth_user_id,
    lower(nullif(trim(coalesce(p_auth_email, '')), '')),
    nullif(trim(coalesce(p_organization_code, '')), ''),
    p_issue_code,
    coalesce(p_details, '{}'::jsonb)
  )
  returning id into v_issue_id;

  return v_issue_id;
end;
$$;

create or replace function public.link_auth_user_to_staff(
  p_auth_user_id uuid,
  p_email text,
  p_organization_code text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text;
  v_org_id uuid;
  v_match_count integer;
  v_user_account_id uuid;
  v_existing_auth_user_id uuid;
begin
  v_email := lower(nullif(trim(coalesce(p_email, '')), ''));

  if v_email is null then
    perform public.log_onboarding_issue(
      null,
      'staff',
      p_auth_user_id,
      p_email,
      p_organization_code,
      'missing_email',
      jsonb_build_object('source', 'link_auth_user_to_staff')
    );
    return null;
  end if;

  if p_organization_code is not null then
    v_org_id := public.resolve_organization_id_by_code(p_organization_code);
    if v_org_id is null then
      perform public.log_onboarding_issue(
        null,
        'staff',
        p_auth_user_id,
        v_email,
        p_organization_code,
        'org_not_found',
        jsonb_build_object('source', 'link_auth_user_to_staff')
      );
      return null;
    end if;
  end if;

  select count(*)::int
  into v_match_count
  from public.user_account ua
  where lower(ua.email) = v_email
    and ua.status = 'active'
    and (v_org_id is null or ua.organization_id = v_org_id);

  if v_match_count = 0 then
    perform public.log_onboarding_issue(
      v_org_id,
      'staff',
      p_auth_user_id,
      v_email,
      p_organization_code,
      'no_matching_profile',
      jsonb_build_object('source', 'link_auth_user_to_staff')
    );
    return null;
  elsif v_match_count > 1 then
    perform public.log_onboarding_issue(
      v_org_id,
      'staff',
      p_auth_user_id,
      v_email,
      p_organization_code,
      'multiple_matching_profiles',
      jsonb_build_object('source', 'link_auth_user_to_staff', 'match_count', v_match_count)
    );
    return null;
  end if;

  select ua.id, ua.auth_user_id
  into v_user_account_id, v_existing_auth_user_id
  from public.user_account ua
  where lower(ua.email) = v_email
    and ua.status = 'active'
    and (v_org_id is null or ua.organization_id = v_org_id)
  limit 1;

  if v_existing_auth_user_id is not null and v_existing_auth_user_id <> p_auth_user_id then
    perform public.log_onboarding_issue(
      v_org_id,
      'staff',
      p_auth_user_id,
      v_email,
      p_organization_code,
      'profile_already_linked',
      jsonb_build_object(
        'source', 'link_auth_user_to_staff',
        'user_account_id', v_user_account_id,
        'linked_auth_user_id', v_existing_auth_user_id
      )
    );
    return null;
  end if;

  update public.user_account ua
  set auth_user_id = p_auth_user_id,
      updated_at = now()
  where ua.id = v_user_account_id
    and (ua.auth_user_id is null or ua.auth_user_id = p_auth_user_id);

  return v_user_account_id;
end;
$$;

create or replace function public.link_auth_user_to_patient(
  p_auth_user_id uuid,
  p_email text,
  p_organization_code text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text;
  v_org_id uuid;
  v_match_count integer;
  v_patient_id uuid;
  v_existing_auth_user_id uuid;
begin
  v_email := lower(nullif(trim(coalesce(p_email, '')), ''));

  if v_email is null then
    perform public.log_onboarding_issue(
      null,
      'patient',
      p_auth_user_id,
      p_email,
      p_organization_code,
      'missing_email',
      jsonb_build_object('source', 'link_auth_user_to_patient')
    );
    return null;
  end if;

  if p_organization_code is not null then
    v_org_id := public.resolve_organization_id_by_code(p_organization_code);
    if v_org_id is null then
      perform public.log_onboarding_issue(
        null,
        'patient',
        p_auth_user_id,
        v_email,
        p_organization_code,
        'org_not_found',
        jsonb_build_object('source', 'link_auth_user_to_patient')
      );
      return null;
    end if;
  end if;

  select count(*)::int
  into v_match_count
  from public.patient p
  where lower(p.email) = v_email
    and p.status = 'active'
    and (v_org_id is null or p.organization_id = v_org_id);

  if v_match_count = 0 then
    perform public.log_onboarding_issue(
      v_org_id,
      'patient',
      p_auth_user_id,
      v_email,
      p_organization_code,
      'no_matching_profile',
      jsonb_build_object('source', 'link_auth_user_to_patient')
    );
    return null;
  elsif v_match_count > 1 then
    perform public.log_onboarding_issue(
      v_org_id,
      'patient',
      p_auth_user_id,
      v_email,
      p_organization_code,
      'multiple_matching_profiles',
      jsonb_build_object('source', 'link_auth_user_to_patient', 'match_count', v_match_count)
    );
    return null;
  end if;

  select p.id, p.auth_user_id
  into v_patient_id, v_existing_auth_user_id
  from public.patient p
  where lower(p.email) = v_email
    and p.status = 'active'
    and (v_org_id is null or p.organization_id = v_org_id)
  limit 1;

  if v_existing_auth_user_id is not null and v_existing_auth_user_id <> p_auth_user_id then
    perform public.log_onboarding_issue(
      v_org_id,
      'patient',
      p_auth_user_id,
      v_email,
      p_organization_code,
      'profile_already_linked',
      jsonb_build_object(
        'source', 'link_auth_user_to_patient',
        'patient_id', v_patient_id,
        'linked_auth_user_id', v_existing_auth_user_id
      )
    );
    return null;
  end if;

  update public.patient p
  set auth_user_id = p_auth_user_id,
      updated_at = now()
  where p.id = v_patient_id
    and (p.auth_user_id is null or p.auth_user_id = p_auth_user_id);

  return v_patient_id;
end;
$$;

-- ---------------------------------------------------------
-- Manual self-claim RPCs (for authenticated users)
-- ---------------------------------------------------------

create or replace function public.claim_my_staff_account(
  p_organization_code text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_auth_user_id uuid;
  v_email text;
  v_linked_user_account_id uuid;
begin
  v_auth_user_id := auth.uid();
  v_email := public.current_user_email();

  if v_auth_user_id is null then
    raise exception 'Not authenticated';
  end if;

  v_linked_user_account_id := public.link_auth_user_to_staff(
    v_auth_user_id,
    v_email,
    p_organization_code
  );

  return v_linked_user_account_id;
end;
$$;

create or replace function public.claim_my_patient_account(
  p_organization_code text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_auth_user_id uuid;
  v_email text;
  v_linked_patient_id uuid;
begin
  v_auth_user_id := auth.uid();
  v_email := public.current_user_email();

  if v_auth_user_id is null then
    raise exception 'Not authenticated';
  end if;

  v_linked_patient_id := public.link_auth_user_to_patient(
    v_auth_user_id,
    v_email,
    p_organization_code
  );

  return v_linked_patient_id;
end;
$$;

create or replace function public.my_auth_binding_status()
returns jsonb
language sql
stable
security definer
set search_path = public, auth
as $$
  select jsonb_build_object(
    'auth_user_id', auth.uid(),
    'email', public.current_user_email(),
    'staff_user_account_id', public.current_staff_user_account_id(),
    'staff_role', public.current_staff_role(),
    'doctor_profile_id', public.current_doctor_profile_id(),
    'patient_id', public.current_patient_id(),
    'organization_id', public.current_organization_id()
  )
$$;

-- ---------------------------------------------------------
-- Automatic auth.users -> public profile linking on signup
-- ---------------------------------------------------------

create or replace function public.handle_auth_user_onboarding()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_actor_type text;
  v_org_code text;
  v_email text;
begin
  v_actor_type := lower(coalesce(new.raw_user_meta_data ->> 'actor_type', ''));
  v_org_code := nullif(trim(coalesce(new.raw_user_meta_data ->> 'organization_code', '')), '');
  v_email := lower(nullif(trim(coalesce(new.email, '')), ''));

  if v_actor_type = '' then
    perform public.log_onboarding_issue(
      null,
      'unknown',
      new.id,
      v_email,
      v_org_code,
      'missing_actor_type',
      jsonb_build_object('source', 'handle_auth_user_onboarding')
    );
    return new;
  end if;

  if v_actor_type not in ('staff', 'patient') then
    perform public.log_onboarding_issue(
      null,
      'unknown',
      new.id,
      v_email,
      v_org_code,
      'unsupported_actor_type',
      jsonb_build_object('source', 'handle_auth_user_onboarding', 'actor_type', v_actor_type)
    );
    return new;
  end if;

  if v_email is null then
    perform public.log_onboarding_issue(
      null,
      v_actor_type,
      new.id,
      null,
      v_org_code,
      'missing_email',
      jsonb_build_object('source', 'handle_auth_user_onboarding')
    );
    return new;
  end if;

  if v_actor_type = 'staff' then
    perform public.link_auth_user_to_staff(new.id, v_email, v_org_code);
  else
    perform public.link_auth_user_to_patient(new.id, v_email, v_org_code);
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_link_profile on auth.users;
create trigger on_auth_user_created_link_profile
  after insert on auth.users
  for each row
  execute procedure public.handle_auth_user_onboarding();

comment on function public.handle_auth_user_onboarding() is 'Automatically attempts to link new auth.users rows to staff/patient profiles by email + optional organization_code.';

-- ---------------------------------------------------------
-- Function grants / revokes
-- ---------------------------------------------------------

revoke all on function public.resolve_organization_id_by_code(text) from public, anon, authenticated;
revoke all on function public.log_onboarding_issue(uuid, text, uuid, text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.link_auth_user_to_staff(uuid, text, text) from public, anon, authenticated;
revoke all on function public.link_auth_user_to_patient(uuid, text, text) from public, anon, authenticated;
revoke all on function public.handle_auth_user_onboarding() from public, anon, authenticated;

grant execute on function public.current_user_email() to authenticated;
grant execute on function public.claim_my_staff_account(text) to authenticated;
grant execute on function public.claim_my_patient_account(text) to authenticated;
grant execute on function public.my_auth_binding_status() to authenticated;

commit;




-- ============================================================
-- SOURCE: supabase/migrations/20260322030000_phase_5_medication_adherence_log.sql
-- ============================================================

-- =========================================================
-- Prescription-to-Adherence Platform
-- Phase 5 / Patient Medication Timeline & Adherence Tracking
--
-- Adds:
--   medication_adherence_log  — per-dose behavioral record
--
-- Design notes:
--   1. organization_id is denormalized onto the table to keep RLS
--      efficient (same pattern as prescription, treatment_event).
--   2. scheduled_date (DATE) is a separate column so common queries
--      ("what happened today?") avoid casting scheduled_time.
--   3. Unique constraint on (prescription_item_id, scheduled_time)
--      prevents duplicate log entries for the same dose slot.
--   4. Status lifecycle: scheduled → taken | skipped | missed
--      "scheduled" is only written by the system to pre-register doses;
--      take/skip/miss writes come from patient UI or the cron job.
-- =========================================================

begin;

-- ---------------------------------------------------------
-- New enum types
-- ---------------------------------------------------------

create type public.adherence_status_enum as enum (
  'scheduled',
  'taken',
  'missed',
  'skipped'
);

create type public.adherence_source_enum as enum (
  'patient',
  'caregiver',
  'system'
);

-- ---------------------------------------------------------
-- medication_adherence_log
-- ---------------------------------------------------------

create table public.medication_adherence_log (
  id                    uuid            primary key default gen_random_uuid(),
  organization_id       uuid            not null references public.organization(id),
  patient_id            uuid            not null references public.patient(id),
  prescription_item_id  uuid            not null references public.prescription_item(id),

  -- Scheduled dose information
  scheduled_date        date            not null,
  scheduled_time        timestamptz     not null,

  -- Outcome
  actual_taken_time     timestamptz,
  status                public.adherence_status_enum not null default 'scheduled',
  source                public.adherence_source_enum not null default 'system',
  notes                 text,

  created_at            timestamptz     not null default now(),
  updated_at            timestamptz     not null default now(),

  -- Prevent duplicate log entries for the same dose slot
  constraint uq_adherence_item_scheduled_time
    unique (prescription_item_id, scheduled_time)
);

comment on table public.medication_adherence_log is
  'Per-dose behavioral record. One row per scheduled dose slot per patient. '
  'Written by patient on take/skip, or by system cron on auto-miss. '
  'Foundation for adherence scoring, refill prediction, and doctor alerts.';

comment on column public.medication_adherence_log.scheduled_date is
  'DATE copy of scheduled_time for efficient date-range queries.';

comment on column public.medication_adherence_log.source is
  '''system'' = cron auto-miss; ''patient'' = patient app; ''caregiver'' = caregiver app.';

-- ---------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------

-- Primary query: patient's doses for a specific date (daily timeline)
create index idx_adherence_log_patient_date
  on public.medication_adherence_log (patient_id, scheduled_date);

-- Lookup for upsert on mark-taken / mark-skipped
create index idx_adherence_log_item_time
  on public.medication_adherence_log (prescription_item_id, scheduled_time);

-- System cron: find unresolved scheduled doses before a cutoff time
create index idx_adherence_log_org_status_time
  on public.medication_adherence_log (organization_id, status, scheduled_time)
  where status = 'scheduled';

-- Adherence summary by patient over a date range
create index idx_adherence_log_patient_status_date
  on public.medication_adherence_log (patient_id, status, scheduled_date);

-- ---------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------

create trigger set_updated_at_medication_adherence_log
  before update on public.medication_adherence_log
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------

grant select, insert, update on public.medication_adherence_log to authenticated;

-- ---------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------

alter table public.medication_adherence_log enable row level security;

-- Staff: read all logs in their organization
drop policy if exists adherence_log_staff_select_own_org on public.medication_adherence_log;
create policy adherence_log_staff_select_own_org
  on public.medication_adherence_log
  for select
  using (public.is_staff() and public.belongs_to_current_org(organization_id));

-- Patient: read own logs only
drop policy if exists adherence_log_patient_select_own on public.medication_adherence_log;
create policy adherence_log_patient_select_own
  on public.medication_adherence_log
  for select
  using (public.is_patient_actor() and public.is_current_patient(patient_id));

-- Patient: insert own logs (mark taken / skipped)
drop policy if exists adherence_log_patient_insert_own on public.medication_adherence_log;
create policy adherence_log_patient_insert_own
  on public.medication_adherence_log
  for insert
  with check (public.is_patient_actor() and public.is_current_patient(patient_id));

-- Patient: update own logs (e.g., late-mark taken after missed)
drop policy if exists adherence_log_patient_update_own on public.medication_adherence_log;
create policy adherence_log_patient_update_own
  on public.medication_adherence_log
  for update
  using (public.is_patient_actor() and public.is_current_patient(patient_id))
  with check (public.is_patient_actor() and public.is_current_patient(patient_id));

-- NOTE: processMissedDoses() must run with service_role key (bypasses RLS).
-- Regular authenticated users cannot auto-miss doses.

commit;




-- ============================================================
-- SOURCE: supabase/migrations/20260322040000_phase_7_notification_events.sql
-- ============================================================

-- =========================================================
-- Prescription-to-Adherence Platform
-- Phase 7 / Notification & Reminder Engine
--
-- Adds:
--   notification_event       — one row per notification to deliver
--   notification_delivery_log — delivery attempt record per channel
--
-- Design notes:
--   1. organization_id is denormalized for efficient org-scoped cron queries.
--   2. Unique constraint (patient_id, type, reference_id, scheduled_at) ensures
--      idempotent trigger runs — safe to call generateDoseReminders() multiple
--      times without creating duplicate notifications.
--   3. reference_id points to the entity causing the notification
--      (prescription_item, refill_request, appointment).
--   4. payload (jsonb) carries typed data used to render the notification message.
--   5. retry_count / max_retries gate the retry loop in processNotificationQueue().
--   6. is_read is patient-facing state; status is delivery-pipeline state.
--   7. System triggers run with service_role (bypasses RLS).
--      Patients read / update own rows via RLS.
-- =========================================================

begin;

-- ---------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------

create type public.notification_type_enum as enum (
  'dose_reminder',
  'missed_dose_alert',
  'refill_reminder',
  'refill_update',
  'appointment_reminder'
);

create type public.notification_status_enum as enum (
  'pending',
  'sent',
  'failed',
  'cancelled'
);

create type public.notification_channel_enum as enum (
  'in_app',
  'sms',
  'email'
);

create type public.delivery_status_enum as enum (
  'success',
  'failed'
);

-- ---------------------------------------------------------
-- notification_event
-- ---------------------------------------------------------

create table public.notification_event (
  id                uuid            primary key default gen_random_uuid(),
  organization_id   uuid            not null references public.organization(id),
  patient_id        uuid            not null references public.patient(id),

  type              public.notification_type_enum   not null,
  reference_type    text,           -- 'prescription_item' | 'refill_request' | 'appointment'
  reference_id      uuid            not null,

  payload           jsonb           not null default '{}',

  scheduled_at      timestamptz     not null,
  status            public.notification_status_enum not null default 'pending',

  is_read           boolean         not null default false,

  retry_count       integer         not null default 0,
  max_retries       integer         not null default 3,
  last_error        text,

  created_at        timestamptz     not null default now(),
  updated_at        timestamptz     not null default now(),

  -- Deduplication: same notification cannot be created twice for the same
  -- patient + type + reference + scheduled time.
  constraint uq_notification_event
    unique (patient_id, type, reference_id, scheduled_at)
);

comment on table public.notification_event is
  'One row per notification to deliver. Unique per (patient, type, reference_id, scheduled_at). '
  'Trigger functions use upsert-ignore to guarantee idempotency. '
  'Delivery queue reads pending rows where scheduled_at <= now().';

comment on column public.notification_event.reference_type is
  '''prescription_item'' | ''refill_request'' | ''appointment''';

comment on column public.notification_event.reference_id is
  'FK to the entity driving this notification (UUID). Always set.';

comment on column public.notification_event.payload is
  'Typed JSON payload used to render the notification message. '
  'Shape depends on type: see notification payload interfaces.';

comment on column public.notification_event.scheduled_at is
  'When to deliver the notification. '
  'For dose reminders: dose_time - lead_minutes. '
  'For refill/missed: triggered immediately (= now at create time). '
  'For appointments: 1-day-before or same-day morning.';

comment on column public.notification_event.is_read is
  'Set to true when the patient dismisses/reads the notification in-app.';

-- ---------------------------------------------------------
-- notification_delivery_log
-- ---------------------------------------------------------

create table public.notification_delivery_log (
  id                        uuid            primary key default gen_random_uuid(),
  notification_event_id     uuid            not null references public.notification_event(id),

  channel                   public.notification_channel_enum  not null,
  status                    public.delivery_status_enum       not null,

  response_payload          jsonb,
  sent_at                   timestamptz     not null default now()
);

comment on table public.notification_delivery_log is
  'One row per delivery attempt. Multiple rows per notification_event when retried '
  'or delivered over multiple channels (future: in_app + sms).';

-- ---------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------

-- Queue processor: find pending notifications due now
create index idx_notification_event_status_scheduled
  on public.notification_event (organization_id, status, scheduled_at)
  where status = 'pending';

-- Patient reads their notifications
create index idx_notification_event_patient_created
  on public.notification_event (patient_id, created_at desc);

-- Delivery log: look up delivery history for a notification
create index idx_notification_delivery_log_event
  on public.notification_delivery_log (notification_event_id);

-- ---------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------

create trigger set_updated_at_notification_event
  before update on public.notification_event
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------

grant select, update on public.notification_event to authenticated;
grant select on public.notification_delivery_log to authenticated;

-- ---------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------

alter table public.notification_event enable row level security;
alter table public.notification_delivery_log enable row level security;

-- Patient: read own notifications
drop policy if exists notification_event_patient_select on public.notification_event;
create policy notification_event_patient_select
  on public.notification_event
  for select
  using (public.is_patient_actor() and public.is_current_patient(patient_id));

-- Patient: mark own notifications as read (UPDATE is_read only)
drop policy if exists notification_event_patient_update_read on public.notification_event;
create policy notification_event_patient_update_read
  on public.notification_event
  for update
  using (public.is_patient_actor() and public.is_current_patient(patient_id))
  with check (public.is_patient_actor() and public.is_current_patient(patient_id));

-- Patient: read delivery logs for own notifications
drop policy if exists notification_delivery_log_patient_select on public.notification_delivery_log;
create policy notification_delivery_log_patient_select
  on public.notification_delivery_log
  for select
  using (
    exists (
      select 1 from public.notification_event ne
      where ne.id = notification_event_id
        and public.is_current_patient(ne.patient_id)
    )
  );

-- NOTE: All inserts and system updates use service_role key (bypasses RLS).

commit;




-- ============================================================
-- SOURCE: supabase/migrations/20260322050000_fix_my_auth_binding_status_return_type.sql
-- ============================================================

-- =========================================================
-- Fix: my_auth_binding_status() return type
--
-- Problem: The original function returns `jsonb` (a scalar type).
-- PostgREST wraps scalar returns as { "my_auth_binding_status": <value> },
-- so the client receives [{"my_auth_binding_status": {...}}] instead of
-- [{auth_user_id: "...", ...}]. The Zod schema parse then fails.
--
-- Fix: Change to RETURNS TABLE(...) so PostgREST returns rows directly
-- as [{auth_user_id: "...", email: "...", ...}], which the TypeScript
-- single-element array unwrapper handles correctly.
-- =========================================================

begin;

create or replace function public.my_auth_binding_status()
returns table(
  auth_user_id      uuid,
  email             text,
  staff_user_account_id uuid,
  staff_role        text,
  doctor_profile_id uuid,
  patient_id        uuid,
  organization_id   uuid
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    auth.uid(),
    public.current_user_email(),
    public.current_staff_user_account_id(),
    public.current_staff_role()::text,
    public.current_doctor_profile_id(),
    public.current_patient_id(),
    public.current_organization_id()
$$;

-- Grant is unchanged — same function name, same callers.
grant execute on function public.my_auth_binding_status() to authenticated;

commit;




-- ============================================================
-- SOURCE: supabase/migrations/20260322100000_onboarding_issue_log_self_read.sql
-- ============================================================

-- Allow authenticated users to read their own onboarding_issue_log rows.
-- Without this, claim_my_staff_account failures (org_not_found, no_matching_profile, …)
-- could not be surfaced in the self-service onboarding UI — only admins saw logs.

begin;

drop policy if exists onboarding_issue_log_self_select on public.onboarding_issue_log;

create policy onboarding_issue_log_self_select
  on public.onboarding_issue_log
  for select
  using (auth.uid() = auth_user_id);

commit;




-- ============================================================
-- SOURCE: supabase/migrations/20260322110000_register_my_doctor_account.sql
-- ============================================================

  -- Doctor self-registration: create user_account (doctor, no clinic) + doctor_profile when
  -- email is new in the org; otherwise reuse link_auth_user_to_staff.
  -- Security note: anyone who knows an org code can register as a doctor in that org.
  -- Tighten later with organization.allow_self_serve_doctor_registration if needed.

  begin;

  -- Extend onboarding issue codes for doctor registration failures.
  alter table public.onboarding_issue_log
    drop constraint if exists onboarding_issue_log_issue_code_check;

  alter table public.onboarding_issue_log
    add constraint onboarding_issue_log_issue_code_check check (
      issue_code in (
        'missing_actor_type',
        'unsupported_actor_type',
        'missing_email',
        'org_not_found',
        'no_matching_profile',
        'multiple_matching_profiles',
        'profile_already_linked',
        'claim_conflict',
        'missing_organization_code',
        'registration_full_name_required'
      )
    );

  -- Internal: callable from trigger (explicit auth user id) or from RPC (auth.uid()).
  create or replace function public.register_my_doctor_account_internal(
    p_auth_user_id uuid,
    p_email text,
    p_organization_code text,
    p_full_name text
  )
  returns uuid
  language plpgsql
  security definer
  set search_path = public, auth
  as $$
  declare
    v_email text;
    v_org_id uuid;
    v_full_name text;
    v_match_count int;
    v_user_account_id uuid;
  begin
    v_email := lower(nullif(trim(coalesce(p_email, '')), ''));
    v_full_name := nullif(trim(coalesce(p_full_name, '')), '');

    if p_auth_user_id is null then
      return null;
    end if;

    if v_email is null then
      perform public.log_onboarding_issue(
        null,
        'staff',
        p_auth_user_id,
        p_email,
        p_organization_code,
        'missing_email',
        jsonb_build_object('source', 'register_my_doctor_account_internal')
      );
      return null;
    end if;

    if v_full_name is null or length(v_full_name) = 0 then
      perform public.log_onboarding_issue(
        null,
        'staff',
        p_auth_user_id,
        v_email,
        p_organization_code,
        'registration_full_name_required',
        jsonb_build_object('source', 'register_my_doctor_account_internal')
      );
      return null;
    end if;

    if p_organization_code is null or length(trim(p_organization_code)) = 0 then
      perform public.log_onboarding_issue(
        null,
        'staff',
        p_auth_user_id,
        v_email,
        p_organization_code,
        'missing_organization_code',
        jsonb_build_object('source', 'register_my_doctor_account_internal')
      );
      return null;
    end if;

    v_org_id := public.resolve_organization_id_by_code(p_organization_code);
    if v_org_id is null then
      perform public.log_onboarding_issue(
        null,
        'staff',
        p_auth_user_id,
        v_email,
        p_organization_code,
        'org_not_found',
        jsonb_build_object('source', 'register_my_doctor_account_internal')
      );
      return null;
    end if;

    select count(*)::int
    into v_match_count
    from public.user_account ua
    where lower(ua.email) = v_email
      and ua.status = 'active'
      and ua.organization_id = v_org_id;

    if v_match_count >= 1 then
      return public.link_auth_user_to_staff(p_auth_user_id, v_email, p_organization_code);
    end if;

    begin
      insert into public.user_account (
        organization_id,
        clinic_id,
        role,
        full_name,
        email,
        status,
        auth_user_id
      ) values (
        v_org_id,
        null,
        'doctor',
        v_full_name,
        v_email,
        'active',
        p_auth_user_id
      )
      returning id into v_user_account_id;

      insert into public.doctor_profile (user_account_id, default_clinic_id, status)
      values (v_user_account_id, null, 'active');

      return v_user_account_id;
    exception
      when unique_violation then
        return public.link_auth_user_to_staff(p_auth_user_id, v_email, p_organization_code);
    end;
  end;
  $$;

  create or replace function public.register_my_doctor_account(
    p_organization_code text,
    p_full_name text
  )
  returns uuid
  language plpgsql
  security definer
  set search_path = public, auth
  as $$
  declare
    v_uid uuid;
    v_email text;
  begin
    v_uid := auth.uid();
    if v_uid is null then
      return null;
    end if;

    v_email := public.current_user_email();
    return public.register_my_doctor_account_internal(
      v_uid,
      v_email,
      p_organization_code,
      p_full_name
    );
  end;
  $$;

  create or replace function public.handle_auth_user_onboarding()
  returns trigger
  language plpgsql
  security definer
  set search_path = public, auth
  as $$
  declare
    v_actor_type text;
    v_org_code text;
    v_email text;
    v_full_name text;
  begin
    v_actor_type := lower(coalesce(new.raw_user_meta_data ->> 'actor_type', ''));
    v_org_code := nullif(trim(coalesce(new.raw_user_meta_data ->> 'organization_code', '')), '');
    v_email := lower(nullif(trim(coalesce(new.email, '')), ''));

    if v_actor_type = '' then
      perform public.log_onboarding_issue(
        null,
        'unknown',
        new.id,
        v_email,
        v_org_code,
        'missing_actor_type',
        jsonb_build_object('source', 'handle_auth_user_onboarding')
      );
      return new;
    end if;

    if v_actor_type not in ('staff', 'patient', 'doctor') then
      perform public.log_onboarding_issue(
        null,
        'unknown',
        new.id,
        v_email,
        v_org_code,
        'unsupported_actor_type',
        jsonb_build_object('source', 'handle_auth_user_onboarding', 'actor_type', v_actor_type)
      );
      return new;
    end if;

    if v_email is null then
      perform public.log_onboarding_issue(
        null,
        case
          when v_actor_type = 'doctor' then 'staff'
          when v_actor_type in ('staff', 'patient') then v_actor_type
          else 'unknown'
        end,
        new.id,
        null,
        v_org_code,
        'missing_email',
        jsonb_build_object('source', 'handle_auth_user_onboarding')
      );
      return new;
    end if;

    if v_actor_type = 'doctor' then
      v_full_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');
      if v_full_name is null or length(v_full_name) = 0 then
        perform public.log_onboarding_issue(
          null,
          'staff',
          new.id,
          v_email,
          v_org_code,
          'registration_full_name_required',
          jsonb_build_object('source', 'handle_auth_user_onboarding')
        );
        return new;
      end if;

      if v_org_code is null or length(v_org_code) = 0 then
        perform public.log_onboarding_issue(
          null,
          'staff',
          new.id,
          v_email,
          v_org_code,
          'missing_organization_code',
          jsonb_build_object('source', 'handle_auth_user_onboarding')
        );
        return new;
      end if;

      perform public.register_my_doctor_account_internal(new.id, v_email, v_org_code, v_full_name);
      return new;
    end if;

    if v_actor_type = 'staff' then
      perform public.link_auth_user_to_staff(new.id, v_email, v_org_code);
    else
      perform public.link_auth_user_to_patient(new.id, v_email, v_org_code);
    end if;

    return new;
  end;
  $$;

  comment on function public.handle_auth_user_onboarding() is
    'On signup: links staff/patient by email, or registers a new doctor (user_account + doctor_profile) when actor_type=doctor with org code + full_name.';

  comment on function public.register_my_doctor_account(text, text) is
    'Authenticated user: register or link as doctor in organization identified by code.';

  comment on function public.register_my_doctor_account_internal(uuid, text, text, text) is
    'Internal doctor registration / link; used by signup trigger and register_my_doctor_account RPC.';

  revoke all on function public.register_my_doctor_account_internal(uuid, text, text, text)
    from public, anon, authenticated;
  revoke all on function public.register_my_doctor_account(text, text)
    from public, anon, authenticated;

  grant execute on function public.register_my_doctor_account(text, text) to authenticated;

  commit;




-- ============================================================
-- SOURCE: supabase/migrations/20260322120000_register_my_doctor_account_runtime_fix.sql
-- ============================================================

-- Fix register_my_doctor_account RPC failures in the wild:
-- 1) Avoid RAISE EXCEPTION when auth.uid() is missing (return null like other paths).
-- 2) Ensure function owner is postgres so SECURITY DEFINER inserts bypass RLS on public tables.
-- 3) Nudge PostgREST to reload the schema cache after DDL.

begin;

create or replace function public.register_my_doctor_account(
  p_organization_code text,
  p_full_name text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid;
  v_email text;
begin
  v_uid := auth.uid();
  if v_uid is null then
    return null;
  end if;

  v_email := public.current_user_email();
  return public.register_my_doctor_account_internal(
    v_uid,
    v_email,
    p_organization_code,
    p_full_name
  );
end;
$$;

-- Table owner bypasses RLS; invoker (authenticated) does not. Best-effort (needs superuser).
do $owner$
begin
  alter function public.register_my_doctor_account(text, text) owner to postgres;
  alter function public.register_my_doctor_account_internal(uuid, text, text, text) owner to postgres;
exception
  when others then
    raise warning 'register_my_doctor_account owner alter skipped: %', sqlerrm;
end $owner$;

grant execute on function public.register_my_doctor_account(text, text) to authenticated;

notify pgrst, 'reload schema';

commit;




-- ============================================================
-- SOURCE: supabase/migrations/20260323130000_mobile_preflight_rls_hardening.sql
-- ============================================================

-- =========================================================
-- Mobile preflight hardening (Phase 9 -> mobile readiness)
--
-- Goals:
-- 1) Fix patient read joins for medication details.
-- 2) Tighten patient adherence writes to own org/item only.
-- 3) Harden refill request patient insert checks.
-- 4) Enable safe patient cancel flow for pending refill requests.
-- =========================================================

begin;

-- ---------------------------------------------------------
-- Helper: ensure prescription_item belongs to current patient
-- ---------------------------------------------------------

create or replace function public.prescription_item_belongs_to_current_patient(
  target_prescription_item_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.prescription_item pi
    join public.prescription p on p.id = pi.prescription_id
    where pi.id = target_prescription_item_id
      and p.patient_id = public.current_patient_id()
  )
$$;

grant execute on function public.prescription_item_belongs_to_current_patient(uuid) to authenticated;

-- ---------------------------------------------------------
-- medication_master: allow patient read for medications linked to own Rx items
-- ---------------------------------------------------------

drop policy if exists medication_master_patient_select_own on public.medication_master;
create policy medication_master_patient_select_own
  on public.medication_master
  for select
  using (
    public.is_patient_actor()
    and exists (
      select 1
      from public.prescription_item pi
      join public.prescription p on p.id = pi.prescription_id
      where pi.medication_master_id = medication_master.id
        and p.patient_id = public.current_patient_id()
    )
  );

-- ---------------------------------------------------------
-- medication_adherence_log: tighten patient writes
-- ---------------------------------------------------------

drop policy if exists adherence_log_patient_insert_own on public.medication_adherence_log;
create policy adherence_log_patient_insert_own
  on public.medication_adherence_log
  for insert
  with check (
    public.is_patient_actor()
    and public.is_current_patient(patient_id)
    and organization_id = public.current_organization_id()
    and source in (
      'patient'::public.adherence_source_enum,
      'caregiver'::public.adherence_source_enum
    )
    and status in (
      'taken'::public.adherence_status_enum,
      'skipped'::public.adherence_status_enum
    )
    and public.prescription_item_belongs_to_current_patient(prescription_item_id)
    and exists (
      select 1
      from public.prescription_item pi
      join public.prescription p on p.id = pi.prescription_id
      where pi.id = prescription_item_id
        and p.organization_id = organization_id
    )
  );

drop policy if exists adherence_log_patient_update_own on public.medication_adherence_log;
create policy adherence_log_patient_update_own
  on public.medication_adherence_log
  for update
  using (
    public.is_patient_actor()
    and public.is_current_patient(patient_id)
    and public.prescription_item_belongs_to_current_patient(prescription_item_id)
  )
  with check (
    public.is_patient_actor()
    and public.is_current_patient(patient_id)
    and organization_id = public.current_organization_id()
    and source in (
      'patient'::public.adherence_source_enum,
      'caregiver'::public.adherence_source_enum
    )
    and status in (
      'taken'::public.adherence_status_enum,
      'skipped'::public.adherence_status_enum
    )
    and public.prescription_item_belongs_to_current_patient(prescription_item_id)
    and exists (
      select 1
      from public.prescription_item pi
      join public.prescription p on p.id = pi.prescription_id
      where pi.id = prescription_item_id
        and p.organization_id = organization_id
    )
  );

-- ---------------------------------------------------------
-- refill_request: tighten patient create + allow safe cancel
-- ---------------------------------------------------------

drop policy if exists refill_request_patient_insert_own on public.refill_request;
create policy refill_request_patient_insert_own
  on public.refill_request
  for insert
  with check (
    public.is_patient_actor()
    and public.is_current_patient(patient_id)
    and public.belongs_to_current_org(organization_id)
    and requested_by_type = 'patient'::public.requested_by_type_enum
    and (requested_by_ref_id is null or requested_by_ref_id = public.current_patient_id())
    and status = 'submitted'::public.refill_request_status_enum
    and triaged_at is null
    and reviewed_at is null
    and reviewed_by_doctor_id is null
    and result_prescription_id is null
    and exists (
      select 1
      from public.prescription p
      where p.id = source_prescription_id
        and p.patient_id = public.current_patient_id()
        and p.treatment_episode_id = treatment_episode_id
        and p.organization_id = organization_id
    )
  );

drop policy if exists refill_request_patient_cancel_own on public.refill_request;
create policy refill_request_patient_cancel_own
  on public.refill_request
  for update
  using (
    public.is_patient_actor()
    and public.is_current_patient(patient_id)
    and status in (
      'submitted'::public.refill_request_status_enum,
      'triaging'::public.refill_request_status_enum,
      'awaiting_doctor_review'::public.refill_request_status_enum
    )
  )
  with check (
    public.is_patient_actor()
    and public.is_current_patient(patient_id)
    and status = 'cancelled'::public.refill_request_status_enum
    and requested_by_type = 'patient'::public.requested_by_type_enum
    and (requested_by_ref_id is null or requested_by_ref_id = public.current_patient_id())
    and reviewed_at is null
    and reviewed_by_doctor_id is null
    and result_prescription_id is null
  );

commit;




-- ============================================================
-- SOURCE: supabase/seed.sql
-- ============================================================

-- =============================================================
-- Thuocare — FULL demo seed (one doctor + rich clinical test data)
--
-- Chạy trong Supabase SQL Editor (postgres / service_role).
-- UUID cố định (chỉ 0-9a-f) để dễ tham chiếu và ON CONFLICT (id).
--
-- Web / onboarding:
--   Organization code: DEMO
--   Bác sĩ (staff):      doctor@demo.com
--   Bệnh nhân (data):    patient.an@example.com , patient.binh@example.com
--
-- Sau khi tạo user auth doctor@demo.com, bỏ comment khối UPDATE cuối file
-- hoặc dùng trang "Link my staff account" với code DEMO.
-- =============================================================

-- ─── Core tenant & staff ─────────────────────────────────────

insert into public.organization (id, code, name, org_type, status)
values (
  'a0000000-0000-0000-0000-000000000001',
  'DEMO',
  'Demo Clinic',
  'independent_clinic',
  'active'
)
on conflict (id) do nothing;

insert into public.clinic (
  id,
  organization_id,
  code,
  name,
  address_text,
  phone,
  status
)
values (
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'MAIN',
  'Demo Clinic — Main site',
  '123 Nguyen Hue, District 1, Ho Chi Minh City',
  '+842812345678',
  'active'
)
on conflict (id) do nothing;

insert into public.user_account (
  id,
  organization_id,
  clinic_id,
  role,
  full_name,
  email,
  phone,
  status
)
values (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'doctor',
  'Dr. Nguyen Demo',
  'doctor@demo.com',
  '+84901234567',
  'active'
)
on conflict (id) do nothing;

insert into public.doctor_profile (
  id,
  user_account_id,
  license_no,
  specialty,
  title,
  default_clinic_id,
  status
)
values (
  'd0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'GND-2024-001',
  'General Internal Medicine',
  'Dr.',
  'a0000000-0000-0000-0000-000000000002',
  'active'
)
on conflict (id) do nothing;

-- ─── Patients ────────────────────────────────────────────────

insert into public.patient (
  id,
  organization_id,
  external_patient_code,
  full_name,
  date_of_birth,
  sex,
  phone,
  email,
  address_text,
  preferred_language,
  communication_preference,
  status
)
values
  (
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'PT-DEMO-001',
    'Tran Thi An',
    '1985-06-12',
    'female',
    '+84987654321',
    'patient.an@example.com',
    '45 Le Loi, Q1, HCMC',
    'vi',
    'app',
    'active'
  ),
  (
    'a0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'PT-DEMO-002',
    'Le Van Binh',
    '1992-03-22',
    'male',
    '+84901112233',
    'patient.binh@example.com',
    '12 Vo Van Tan, Q3, HCMC',
    'vi',
    'mixed',
    'active'
  )
on conflict (id) do nothing;

insert into public.caregiver_link (
  id,
  patient_id,
  caregiver_name,
  relationship_type,
  phone,
  notification_scope,
  is_primary,
  status
)
values (
  'a0000000-0000-0000-0000-000000000005',
  'a0000000-0000-0000-0000-000000000003',
  'Tran Van Hai',
  'spouse',
  '+84905556677',
  'missed_dose_only',
  true,
  'active'
)
on conflict (id) do nothing;

-- ─── Episode + encounter + diagnosis ─────────────────────────

insert into public.treatment_episode (
  id,
  organization_id,
  clinic_id,
  patient_id,
  primary_doctor_id,
  episode_type,
  condition_group,
  title,
  clinical_summary,
  start_date,
  target_end_date,
  current_status,
  risk_tier,
  next_review_due_at,
  last_activity_at
)
values (
  'a0000000-0000-0000-0000-000000000010',
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'd0000000-0000-0000-0000-000000000001',
  'chronic_management',
  'Metabolic / CV risk',
  'Type 2 diabetes & hypertension — long-term care',
  'HbA1c elevated on last visit; BP borderline. Lifestyle counseling ongoing.',
  '2025-11-01',
  null,
  'active',
  'medium',
  (now() + interval '14 days'),
  now()
)
on conflict (id) do nothing;

insert into public.treatment_episode (
  id,
  organization_id,
  clinic_id,
  patient_id,
  primary_doctor_id,
  episode_type,
  title,
  clinical_summary,
  start_date,
  current_status,
  risk_tier
)
values (
  'a0000000-0000-0000-0000-000000000011',
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000004',
  'd0000000-0000-0000-0000-000000000001',
  'acute_course',
  'URI follow-up',
  'Resolved upper respiratory infection; routine check.',
  '2026-02-01',
  'monitoring',
  'low'
)
on conflict (id) do nothing;

insert into public.encounter (
  id,
  organization_id,
  clinic_id,
  patient_id,
  treatment_episode_id,
  doctor_id,
  encounter_type,
  encounter_at,
  chief_complaint,
  assessment_summary,
  plan_summary,
  next_follow_up_recommendation_at
)
values (
  'a0000000-0000-0000-0000-000000000012',
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000010',
  'd0000000-0000-0000-0000-000000000001',
  'in_person',
  '2026-01-10 09:30:00+07',
  'Follow-up diabetes and blood pressure',
  'T2DM on OAD; BP 138/86. Continue current meds, reinforce diet.',
  'Renew metformin and amlodipine; HbA1c in 3 months.',
  '2026-04-10 09:00:00+07'
)
on conflict (id) do nothing;

insert into public.diagnosis (
  id,
  encounter_id,
  treatment_episode_id,
  coding_system,
  diagnosis_code,
  diagnosis_label,
  is_primary,
  clinical_status,
  noted_at
)
values
  (
    'a0000000-0000-0000-0000-000000000013',
    'a0000000-0000-0000-0000-000000000012',
    'a0000000-0000-0000-0000-000000000010',
    'ICD-10',
    'E11.9',
    'Type 2 diabetes mellitus without complications',
    true,
    'active',
    '2026-01-10 09:30:00+07'
  ),
  (
    'a0000000-0000-0000-0000-000000000014',
    'a0000000-0000-0000-0000-000000000012',
    'a0000000-0000-0000-0000-000000000010',
    'ICD-10',
    'I10',
    'Essential (primary) hypertension',
    false,
    'active',
    '2026-01-10 09:30:00+07'
  )
on conflict (id) do nothing;

-- ─── Medication catalog ──────────────────────────────────────

insert into public.medication_master (
  id,
  standard_code,
  generic_name,
  brand_name,
  strength_text,
  dosage_form,
  route,
  atc_class,
  is_high_risk,
  is_controlled_substance,
  status
)
values
  (
    'a0000000-0000-0000-0000-000000000015',
    'VN-MET-850',
    'Metformin',
    'Glucophage',
    '850 mg',
    'tablet',
    'oral',
    'A10BA02',
    false,
    false,
    'active'
  ),
  (
    'a0000000-0000-0000-0000-000000000016',
    'VN-AML-5',
    'Amlodipine',
    'Norvasc',
    '5 mg',
    'tablet',
    'oral',
    'C08CA01',
    false,
    false,
    'active'
  )
on conflict (id) do nothing;

-- ─── Prescription + items + schedule + refill policy ─────────

insert into public.prescription (
  id,
  organization_id,
  clinic_id,
  patient_id,
  treatment_episode_id,
  encounter_id,
  doctor_id,
  prescription_kind,
  issue_source,
  status,
  issued_at,
  effective_from,
  effective_to,
  days_supply_total,
  renewal_sequence_no,
  clinical_note,
  patient_friendly_summary
)
values (
  'a0000000-0000-0000-0000-000000000017',
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000010',
  'a0000000-0000-0000-0000-000000000012',
  'd0000000-0000-0000-0000-000000000001',
  'initial',
  'visit',
  'active',
  '2026-01-10 10:00:00+07',
  '2026-01-10',
  null,
  60,
  0,
  'OAD + CCB for DM2 + HTN.',
  'Take metformin twice daily after meals; amlodipine once in the morning.'
)
on conflict (id) do nothing;

insert into public.prescription_item (
  id,
  prescription_id,
  line_no,
  medication_master_id,
  indication_text,
  dose_amount,
  dose_unit,
  route,
  frequency_code,
  frequency_text,
  timing_relation,
  administration_instruction_text,
  patient_instruction_text,
  prn_flag,
  quantity_prescribed,
  quantity_unit,
  days_supply,
  start_date,
  end_date,
  is_refillable,
  max_refills_allowed,
  requires_review_before_refill,
  high_risk_review_flag,
  status
)
values
  (
    'a0000000-0000-0000-0000-000000000018',
    'a0000000-0000-0000-0000-000000000017',
    1,
    'a0000000-0000-0000-0000-000000000015',
    'Type 2 diabetes',
    1,
    'tablet',
    'oral',
    'BID',
    '2 times daily after breakfast and dinner',
    'after_meal',
    'Swallow whole with water.',
    'Take after meals to reduce stomach upset.',
    false,
    60,
    'tablet',
    30,
    '2026-01-10',
    null,
    true,
    3,
    false,
    false,
    'active'
  ),
  (
    'a0000000-0000-0000-0000-000000000019',
    'a0000000-0000-0000-0000-000000000017',
    2,
    'a0000000-0000-0000-0000-000000000016',
    'Hypertension',
    1,
    'tablet',
    'oral',
    'OD',
    'Once daily in the morning',
    'none',
    'May take with or without food.',
    'Take at the same time each morning.',
    false,
    30,
    'tablet',
    30,
    '2026-01-10',
    null,
    true,
    2,
    true,
    false,
    'active'
  )
on conflict (id) do nothing;

insert into public.dose_schedule (
  id,
  prescription_item_id,
  schedule_type,
  timezone_mode,
  times_per_day,
  structured_schedule_json,
  first_dose_at,
  grace_window_minutes,
  mark_missed_after_minutes
)
values
  (
    'a0000000-0000-0000-0000-00000000001a',
    'a0000000-0000-0000-0000-000000000018',
    'fixed_times_daily',
    'patient_local_time',
    2,
    '[
      {"slot": "morning", "time": "08:00", "label": "After breakfast"},
      {"slot": "evening", "time": "20:00", "label": "After dinner"}
    ]'::jsonb,
    '2026-01-11 08:00:00+07',
    45,
    180
  ),
  (
    'a0000000-0000-0000-0000-00000000001b',
    'a0000000-0000-0000-0000-000000000019',
    'fixed_times_daily',
    'patient_local_time',
    1,
    '[{"slot": "morning", "time": "07:30", "label": "Morning"}]'::jsonb,
    '2026-01-11 07:30:00+07',
    60,
    240
  )
on conflict (id) do nothing;

insert into public.refill_policy_snapshot (
  id,
  prescription_item_id,
  refill_mode,
  max_refills_allowed,
  min_days_between_refills,
  earliest_refill_ratio,
  notes
)
values
  (
    'a0000000-0000-0000-0000-00000000001c',
    'a0000000-0000-0000-0000-000000000018',
    'patient_request_allowed',
    3,
    25,
    0.8000,
    'Allow early refill at ~80% depletion.'
  ),
  (
    'a0000000-0000-0000-0000-00000000001d',
    'a0000000-0000-0000-0000-000000000019',
    'doctor_review_required',
    2,
    20,
    0.7500,
    'CCB — doctor review before each refill.'
  )
on conflict (id) do nothing;

-- ─── Follow-up + appointment + pre-visit ───────────────────

insert into public.follow_up_plan (
  id,
  organization_id,
  patient_id,
  treatment_episode_id,
  source_prescription_id,
  owner_doctor_id,
  follow_up_type,
  trigger_mode,
  due_at,
  required_before_refill,
  instruction_text,
  status
)
values (
  'a0000000-0000-0000-0000-00000000001e',
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000010',
  'a0000000-0000-0000-0000-000000000017',
  'd0000000-0000-0000-0000-000000000001',
  'lab_review',
  'relative_to_issue_date',
  '2026-04-10 09:00:00+07',
  false,
  'HbA1c and lipid panel before next visit.',
  'planned'
)
on conflict (id) do nothing;

insert into public.appointment (
  id,
  organization_id,
  clinic_id,
  patient_id,
  treatment_episode_id,
  follow_up_plan_id,
  doctor_id,
  appointment_type,
  scheduled_start_at,
  scheduled_end_at,
  status,
  reason_text
)
values (
  'a0000000-0000-0000-0000-00000000001f',
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000010',
  'a0000000-0000-0000-0000-00000000001e',
  'd0000000-0000-0000-0000-000000000001',
  'in_person_revisit',
  '2026-04-10 09:00:00+07',
  '2026-04-10 09:30:00+07',
  'scheduled',
  'Chronic follow-up: diabetes & BP review + labs'
)
on conflict (id) do nothing;

insert into public.pre_visit_requirement (
  id,
  appointment_id,
  requirement_type,
  instruction_text,
  status
)
values (
  'a0000000-0000-0000-0000-000000000020',
  'a0000000-0000-0000-0000-00000000001f',
  'fasting_required',
  'Fast 8 hours before appointment if lab is same day.',
  'pending'
)
on conflict (id) do nothing;

-- ─── Refill request (hàng chờ bác sĩ) ─────────────────────────

insert into public.refill_request (
  id,
  organization_id,
  patient_id,
  treatment_episode_id,
  request_scope,
  source_prescription_id,
  requested_by_type,
  requested_by_ref_id,
  trigger_source,
  preferred_fulfillment,
  patient_comment,
  status,
  submitted_at
)
values (
  'a0000000-0000-0000-0000-000000000021',
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000010',
  'selected_items',
  'a0000000-0000-0000-0000-000000000017',
  'patient',
  'a0000000-0000-0000-0000-000000000003',
  'manual_request',
  'pickup',
  'Running low on metformin after travel.',
  'awaiting_doctor_review',
  '2026-03-18 14:00:00+07'
)
on conflict (id) do nothing;

insert into public.refill_request_item (
  id,
  refill_request_id,
  prescription_item_id,
  requested_quantity,
  status
)
values (
  'a0000000-0000-0000-0000-000000000022',
  'a0000000-0000-0000-0000-000000000021',
  'a0000000-0000-0000-0000-000000000018',
  60,
  'pending'
)
on conflict (id) do nothing;

-- ─── Adherence (timeline bệnh nhân) ───────────────────────────

insert into public.medication_adherence_log (
  id,
  organization_id,
  patient_id,
  prescription_item_id,
  scheduled_date,
  scheduled_time,
  actual_taken_time,
  status,
  source,
  notes
)
values
  (
    'a0000000-0000-0000-0000-000000000023',
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000018',
    '2026-03-20',
    '2026-03-20 08:05:00+07',
    '2026-03-20 08:08:00+07',
    'taken',
    'patient',
    null
  ),
  (
    'a0000000-0000-0000-0000-000000000024',
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000018',
    '2026-03-20',
    '2026-03-20 20:00:00+07',
    null,
    'scheduled',
    'system',
    null
  ),
  (
    'a0000000-0000-0000-0000-000000000025',
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000019',
    '2026-03-21',
    '2026-03-21 07:30:00+07',
    null,
    'missed',
    'system',
    'Auto-missed (demo)'
  )
on conflict (id) do nothing;

-- ─── Notifications ─────────────────────────────────────────

insert into public.notification_event (
  id,
  organization_id,
  patient_id,
  type,
  reference_type,
  reference_id,
  payload,
  scheduled_at,
  status,
  is_read
)
values (
  'a0000000-0000-0000-0000-000000000026',
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000003',
  'dose_reminder',
  'prescription_item',
  'a0000000-0000-0000-0000-000000000018',
  '{"medication": "Metformin 850 mg", "dose_time": "20:00", "lead_minutes": 15}'::jsonb,
  '2026-03-22 19:45:00+07',
  'pending',
  false
)
on conflict (id) do nothing;

insert into public.notification_delivery_log (
  id,
  notification_event_id,
  channel,
  status,
  response_payload
)
values (
  'a0000000-0000-0000-0000-000000000027',
  'a0000000-0000-0000-0000-000000000026',
  'in_app',
  'success',
  '{"delivered": true}'::jsonb
)
on conflict (id) do nothing;

-- ─── Treatment timeline events ───────────────────────────────

insert into public.treatment_event (
  id,
  organization_id,
  patient_id,
  treatment_episode_id,
  entity_type,
  entity_id,
  event_type,
  event_at,
  actor_type,
  actor_ref_id,
  payload_json,
  visibility_scope
)
values
  (
    'a0000000-0000-0000-0000-000000000028',
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000010',
    'episode',
    'a0000000-0000-0000-0000-000000000010',
    'episode_created',
    '2025-11-01 10:00:00+07',
    'doctor',
    'd0000000-0000-0000-0000-000000000001',
    '{"title": "Chronic care episode opened"}'::jsonb,
    'doctor_and_staff'
  ),
  (
    'a0000000-0000-0000-0000-000000000029',
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000010',
    'prescription',
    'a0000000-0000-0000-0000-000000000017',
    'prescription_issued',
    '2026-01-10 10:00:00+07',
    'doctor',
    'd0000000-0000-0000-0000-000000000001',
    '{"lines": 2}'::jsonb,
    'patient_visible'
  ),
  (
    'a0000000-0000-0000-0000-00000000002a',
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000010',
    'refill_request',
    'a0000000-0000-0000-0000-000000000021',
    'refill_requested',
    '2026-03-18 14:00:00+07',
    'patient',
    'a0000000-0000-0000-0000-000000000003',
    null,
    'patient_visible'
  )
on conflict (id) do nothing;

-- =============================================================
-- Gắn auth.users → user_account (bác sĩ)
-- Chạy SAU KHI đã có user Supabase Auth email doctor@demo.com
-- =============================================================
-- update public.user_account ua
-- set auth_user_id = u.id
-- from auth.users u
-- where lower(u.email) = lower('doctor@demo.com')
--   and ua.id = 'b0000000-0000-0000-0000-000000000001';



