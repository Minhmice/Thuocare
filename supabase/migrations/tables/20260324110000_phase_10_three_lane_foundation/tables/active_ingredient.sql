-- Extracted table reference view
-- Source migration: 20260324110000_phase_10_three_lane_foundation.sql
-- Table: public.active_ingredient
-- Note: canonical execution order still lives in the original migration file.
create table if not exists public.active_ingredient (
  id uuid primary key default gen_random_uuid(),
  ingredient_code text,
  ingredient_name text not null,
  display_name text,
  standard_system text,
  status public.record_status_enum not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint active_ingredient_name_nonempty check (length(trim(ingredient_name)) > 0)
);

create unique index if not exists active_ingredient_name_unique
  on public.active_ingredient (lower(ingredient_name));

