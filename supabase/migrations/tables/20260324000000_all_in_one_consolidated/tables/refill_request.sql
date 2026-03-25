-- Extracted table reference view
-- Source migration: 20260324000000_all_in_one_consolidated.sql
-- Table: public.refill_request
-- Note: canonical execution order still lives in the original migration file.
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

