-- Extracted table reference view
-- Source migration: 20260324000000_all_in_one_consolidated.sql
-- Table: public.doctor_profile
-- Note: canonical execution order still lives in the original migration file.
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

