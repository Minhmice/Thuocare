-- Extracted table reference view
-- Source migration: 20260324000000_all_in_one_consolidated.sql
-- Table: public.appointment
-- Note: canonical execution order still lives in the original migration file.
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

