-- Extracted table reference view
-- Source migration: 20260324000000_all_in_one_consolidated.sql
-- Table: public.user_account
-- Note: canonical execution order still lives in the original migration file.
create table public.user_account (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  clinic_id uuid references public.clinic(id) on delete set null,
  role public.user_role_enum not null,
  full_name text not null,
  email text,
  phone text,
  status public.record_status_enum not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_account_full_name_nonempty check (length(trim(full_name)) > 0)
);

create unique index user_account_org_email_unique
  on public.user_account (organization_id, lower(email))
  where email is not null;

