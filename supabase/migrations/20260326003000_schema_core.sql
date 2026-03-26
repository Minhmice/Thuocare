begin;

create extension if not exists pgcrypto;

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

commit;

