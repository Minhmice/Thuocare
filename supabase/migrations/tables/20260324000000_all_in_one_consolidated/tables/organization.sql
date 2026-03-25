-- Extracted table reference view
-- Source migration: 20260324000000_all_in_one_consolidated.sql
-- Table: public.organization
-- Note: canonical execution order still lives in the original migration file.
create table public.organization (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  org_type public.organization_type_enum not null,
  status public.record_status_enum not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_code_nonempty check (length(trim(code)) > 0),
  constraint organization_name_nonempty check (length(trim(name)) > 0)
);

