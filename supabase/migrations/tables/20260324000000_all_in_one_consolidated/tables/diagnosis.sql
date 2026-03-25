-- Extracted table reference view
-- Source migration: 20260324000000_all_in_one_consolidated.sql
-- Table: public.diagnosis
-- Note: canonical execution order still lives in the original migration file.
create table public.diagnosis (
  id uuid primary key default gen_random_uuid(),
  encounter_id uuid not null references public.encounter(id) on delete cascade,
  treatment_episode_id uuid not null references public.treatment_episode(id) on delete cascade,
  coding_system text,
  diagnosis_code text,
  diagnosis_label text not null,
  is_primary boolean not null default false,
  clinical_status public.diagnosis_status_enum not null default 'active',
  noted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint diagnosis_label_nonempty check (length(trim(diagnosis_label)) > 0)
);

create unique index diagnosis_one_primary_per_encounter
  on public.diagnosis (encounter_id)
  where is_primary = true;

