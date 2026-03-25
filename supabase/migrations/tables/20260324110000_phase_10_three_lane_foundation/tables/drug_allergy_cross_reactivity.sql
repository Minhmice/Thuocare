-- Extracted table reference view
-- Source migration: 20260324110000_phase_10_three_lane_foundation.sql
-- Table: public.drug_allergy_cross_reactivity
-- Note: canonical execution order still lives in the original migration file.
create table if not exists public.drug_allergy_cross_reactivity (
  id uuid primary key default gen_random_uuid(),
  active_ingredient_id uuid not null references public.active_ingredient(id) on delete cascade,
  allergy_group_code text,
  allergy_group_label text not null,
  risk_note text,
  severity public.interaction_severity_enum not null default 'moderate',
  status public.record_status_enum not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint allergy_group_label_nonempty check (length(trim(allergy_group_label)) > 0)
);

