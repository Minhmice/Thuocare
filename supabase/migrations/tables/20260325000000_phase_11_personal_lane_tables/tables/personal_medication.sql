-- Extracted table reference view
-- Source migration: 20260325000000_phase_11_personal_lane_tables.sql
-- Table: public.personal_medication
-- Note: canonical execution order still lives in the original migration file.
create table if not exists public.personal_medication (
  id                   uuid          primary key default gen_random_uuid(),
  patient_id           uuid          not null references public.patient(id) on delete cascade,
  personal_profile_id  uuid          not null references public.personal_profile(id) on delete cascade,
  -- source: linked catalog entry OR user-typed custom name (at least one required)
  catalog_id           uuid          references public.medication_catalog(id) on delete set null,
  custom_name          text,
  -- display_name = resolved name shown in UI (catalog generic_name or custom_name)
  display_name         text          not null,
  strength_text        text,
  dosage_form          text,
  dose_amount          numeric(10,3) not null,
  dose_unit            text          not null,
  frequency_code       public.frequency_code_enum not null,
  dose_schedule_json   jsonb         not null,
  start_date           date          not null,
  end_date             date,
  notes                text,
  status               public.personal_med_status_enum not null default 'active',
  created_at           timestamptz   not null default now(),
  updated_at           timestamptz   not null default now(),

  constraint personal_medication_display_name_nonempty
    check (length(trim(display_name)) > 0),
  constraint personal_medication_dose_amount_positive
    check (dose_amount > 0),
  constraint personal_medication_dose_unit_nonempty
    check (length(trim(dose_unit)) > 0),
  constraint personal_medication_end_after_start
    check (end_date is null or end_date >= start_date),
  constraint personal_medication_schedule_is_object
    check (jsonb_typeof(dose_schedule_json) = 'object'),
  -- Either a catalog entry or a custom name must be provided as the name source
  constraint personal_medication_custom_or_catalog
    check (
      catalog_id is not null
      or (custom_name is not null and length(trim(custom_name)) > 0)
    )
);

-- Common access patterns
create index if not exists personal_medication_patient_status_idx
  on public.personal_medication (patient_id, status);

create index if not exists personal_medication_personal_profile_idx
  on public.personal_medication (personal_profile_id);

create index if not exists personal_medication_start_date_idx
  on public.personal_medication (patient_id, start_date);

