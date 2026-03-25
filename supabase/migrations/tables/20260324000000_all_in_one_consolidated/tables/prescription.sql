-- Extracted table reference view
-- Source migration: 20260324000000_all_in_one_consolidated.sql
-- Table: public.prescription
-- Note: canonical execution order still lives in the original migration file.
create table public.prescription (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  clinic_id uuid not null references public.clinic(id) on delete restrict,
  patient_id uuid not null references public.patient(id) on delete cascade,
  treatment_episode_id uuid not null references public.treatment_episode(id) on delete cascade,
  encounter_id uuid references public.encounter(id) on delete set null,
  doctor_id uuid references public.doctor_profile(id) on delete set null,
  parent_prescription_id uuid references public.prescription(id) on delete set null,
  prescription_kind public.prescription_kind_enum not null,
  issue_source public.prescription_source_enum not null,
  status public.prescription_status_enum not null default 'draft',
  issued_at timestamptz,
  effective_from date not null,
  effective_to date,
  days_supply_total integer,
  renewal_sequence_no integer not null default 0,
  clinical_note text,
  patient_friendly_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint prescription_effective_to_gte_from
    check (effective_to is null or effective_to >= effective_from),
  constraint prescription_days_supply_total_positive
    check (days_supply_total is null or days_supply_total > 0),
  constraint prescription_renewal_sequence_nonnegative
    check (renewal_sequence_no >= 0)
);

