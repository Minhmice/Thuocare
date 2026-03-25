-- Extracted table reference view
-- Source migration: 20260324110000_phase_10_three_lane_foundation.sql
-- Table: public.shared_care_profile
-- Note: canonical execution order still lives in the original migration file.
create table if not exists public.shared_care_profile (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient(id) on delete cascade,
  personal_profile_id uuid references public.personal_profile(id) on delete set null,
  display_name text,
  care_preferences_json jsonb not null default '{}'::jsonb,
  status public.care_profile_status_enum not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shared_care_profile_patient_unique unique (patient_id),
  constraint shared_care_profile_display_name_nonempty
    check (display_name is null or length(trim(display_name)) > 0),
  constraint shared_care_profile_preferences_is_object
    check (jsonb_typeof(care_preferences_json) = 'object')
);

create index if not exists shared_care_profile_status_idx
  on public.shared_care_profile (status);

