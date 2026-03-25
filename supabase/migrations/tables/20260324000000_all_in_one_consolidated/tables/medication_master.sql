-- Extracted table reference view
-- Source migration: 20260324000000_all_in_one_consolidated.sql
-- Table: public.medication_master
-- Note: canonical execution order still lives in the original migration file.
create table public.medication_master (
  id uuid primary key default gen_random_uuid(),
  standard_code text,
  generic_name text not null,
  brand_name text,
  strength_text text not null,
  dosage_form public.dosage_form_enum not null,
  route public.route_enum not null,
  atc_class text,
  is_high_risk boolean not null default false,
  is_controlled_substance boolean not null default false,
  status public.record_status_enum not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint medication_generic_name_nonempty check (length(trim(generic_name)) > 0),
  constraint medication_strength_text_nonempty check (length(trim(strength_text)) > 0)
);

create unique index medication_master_standard_code_unique
  on public.medication_master (standard_code)
  where standard_code is not null;

create index medication_master_generic_name_idx
  on public.medication_master (lower(generic_name));

