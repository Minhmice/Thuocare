-- Extracted table reference view
-- Source migration: 20260324000000_all_in_one_consolidated.sql
-- Table: public.caregiver_link
-- Note: canonical execution order still lives in the original migration file.
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

