-- Extracted table reference view
-- Source migration: 20260324110000_phase_10_three_lane_foundation.sql
-- Table: public.drug_interaction_rule
-- Note: canonical execution order still lives in the original migration file.
create table if not exists public.drug_interaction_rule (
  id uuid primary key default gen_random_uuid(),
  rule_code text,
  title text not null,
  severity public.interaction_severity_enum not null,
  clinical_effect text,
  mechanism text,
  recommendation text,
  evidence_level text,
  source_ref text,
  status public.record_status_enum not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint drug_interaction_rule_title_nonempty check (length(trim(title)) > 0)
);

create unique index if not exists drug_interaction_rule_code_unique
  on public.drug_interaction_rule (rule_code)
  where rule_code is not null;

