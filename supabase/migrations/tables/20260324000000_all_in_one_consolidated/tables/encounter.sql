-- Extracted table reference view
-- Source migration: 20260324000000_all_in_one_consolidated.sql
-- Table: public.encounter
-- Note: canonical execution order still lives in the original migration file.
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

