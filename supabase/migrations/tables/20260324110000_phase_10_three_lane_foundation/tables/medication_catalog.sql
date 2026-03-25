-- Extracted table reference view
-- Source migration: 20260324110000_phase_10_three_lane_foundation.sql
-- Table: public.medication_catalog
-- Note: canonical execution order still lives in the original migration file.
create table if not exists public.medication_catalog (
  id uuid primary key default gen_random_uuid(),
  medication_master_id uuid references public.medication_master(id) on delete set null,
  catalog_code text,
  generic_name text not null,
  brand_name text,
  strength_text text not null,
  dosage_form public.dosage_form_enum not null,
  route public.route_enum not null,
  atc_class text,
  is_high_risk boolean not null default false,
  is_controlled_substance boolean not null default false,
  status public.record_status_enum not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint medication_catalog_generic_name_nonempty check (length(trim(generic_name)) > 0),
  constraint medication_catalog_strength_text_nonempty check (length(trim(strength_text)) > 0)
);

create unique index if not exists medication_catalog_code_unique
  on public.medication_catalog (catalog_code)
  where catalog_code is not null;

create unique index if not exists medication_catalog_medication_master_unique
  on public.medication_catalog (medication_master_id)
  where medication_master_id is not null;

