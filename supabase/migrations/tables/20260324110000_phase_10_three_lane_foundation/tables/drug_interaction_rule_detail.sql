-- Extracted table reference view
-- Source migration: 20260324110000_phase_10_three_lane_foundation.sql
-- Table: public.drug_interaction_rule_detail
-- Note: canonical execution order still lives in the original migration file.
create table if not exists public.drug_interaction_rule_detail (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.drug_interaction_rule(id) on delete cascade,
  ingredient_a_id uuid not null references public.active_ingredient(id) on delete restrict,
  ingredient_b_id uuid not null references public.active_ingredient(id) on delete restrict,
  directionality text not null default 'bidirectional',
  dose_context text,
  population_context text,
  notes text,
  created_at timestamptz not null default now(),
  constraint interaction_pair_not_same check (ingredient_a_id <> ingredient_b_id)
);

create unique index if not exists drug_interaction_rule_detail_pair_unique
  on public.drug_interaction_rule_detail (
    rule_id,
    least(ingredient_a_id, ingredient_b_id),
    greatest(ingredient_a_id, ingredient_b_id)
  );

