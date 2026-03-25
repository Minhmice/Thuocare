-- Extracted table reference view
-- Source migration: 20260324110000_phase_10_three_lane_foundation.sql
-- Table: public.medication_ingredient_map
-- Note: canonical execution order still lives in the original migration file.
create table if not exists public.medication_ingredient_map (
  id uuid primary key default gen_random_uuid(),
  medication_catalog_id uuid not null references public.medication_catalog(id) on delete cascade,
  active_ingredient_id uuid not null references public.active_ingredient(id) on delete restrict,
  ingredient_strength_text text,
  strength_value numeric(14,6),
  strength_unit text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (medication_catalog_id, active_ingredient_id)
);

