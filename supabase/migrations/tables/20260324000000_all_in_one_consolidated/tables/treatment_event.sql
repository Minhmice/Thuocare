-- Extracted table reference view
-- Source migration: 20260324000000_all_in_one_consolidated.sql
-- Table: public.treatment_event
-- Note: canonical execution order still lives in the original migration file.
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

