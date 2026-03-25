-- Extracted table reference view
-- Source migration: 20260324110000_phase_10_three_lane_foundation.sql
-- Table: public.personal_profile
-- Note: canonical execution order still lives in the original migration file.
create table if not exists public.personal_profile (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  preferred_name text,
  language_code text,
  timezone text,
  profile_status public.record_status_enum not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint personal_profile_patient_unique unique (patient_id),
  constraint personal_profile_preferred_name_nonempty
    check (preferred_name is null or length(trim(preferred_name)) > 0)
);

create unique index if not exists personal_profile_auth_user_id_unique
  on public.personal_profile (auth_user_id)
  where auth_user_id is not null;

create index if not exists personal_profile_status_idx
  on public.personal_profile (profile_status);

