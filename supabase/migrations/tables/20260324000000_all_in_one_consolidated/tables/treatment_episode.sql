-- Extracted table reference view
-- Source migration: 20260324000000_all_in_one_consolidated.sql
-- Table: public.treatment_episode
-- Note: canonical execution order still lives in the original migration file.
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

