-- Extracted table reference view
-- Source migration: 20260324110000_phase_10_three_lane_foundation.sql
-- Table: public.drug_contraindication
-- Note: canonical execution order still lives in the original migration file.
create table if not exists public.drug_contraindication (
  id uuid primary key default gen_random_uuid(),
  medication_catalog_id uuid not null references public.medication_catalog(id) on delete cascade,
  contraindication_code text,
  contraindication_label text not null,
  clinical_note text,
  severity public.interaction_severity_enum not null default 'major',
  status public.record_status_enum not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contraindication_label_nonempty check (length(trim(contraindication_label)) > 0)
);

