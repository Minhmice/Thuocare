-- Extracted table reference view
-- Source migration: 20260324110000_phase_10_three_lane_foundation.sql
-- Table: public.drug_combination_guidance
-- Note: canonical execution order still lives in the original migration file.
create table if not exists public.drug_combination_guidance (
  id uuid primary key default gen_random_uuid(),
  medication_catalog_a_id uuid not null references public.medication_catalog(id) on delete cascade,
  medication_catalog_b_id uuid not null references public.medication_catalog(id) on delete cascade,
  guidance_text text not null,
  severity public.interaction_severity_enum not null default 'moderate',
  status public.record_status_enum not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint combination_guidance_nonempty check (length(trim(guidance_text)) > 0),
  constraint combination_not_same_medication check (medication_catalog_a_id <> medication_catalog_b_id)
);

create unique index if not exists drug_combination_guidance_pair_unique
  on public.drug_combination_guidance (
    least(medication_catalog_a_id, medication_catalog_b_id),
    greatest(medication_catalog_a_id, medication_catalog_b_id)
  );

