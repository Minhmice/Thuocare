-- Extracted table reference view
-- Source migration: 20260324000000_all_in_one_consolidated.sql
-- Table: public.patient
-- Note: canonical execution order still lives in the original migration file.
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

