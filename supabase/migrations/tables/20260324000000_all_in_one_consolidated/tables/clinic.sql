-- Extracted table reference view
-- Source migration: 20260324000000_all_in_one_consolidated.sql
-- Table: public.clinic
-- Note: canonical execution order still lives in the original migration file.
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

