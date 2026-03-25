-- Extracted table reference view
-- Source migration: 20260324000000_all_in_one_consolidated.sql
-- Table: public.dose_schedule
-- Note: canonical execution order still lives in the original migration file.
create table public.dose_schedule (
  id uuid primary key default gen_random_uuid(),
  prescription_item_id uuid not null unique references public.prescription_item(id) on delete cascade,
  schedule_type public.dose_schedule_type_enum not null,
  timezone_mode public.timezone_mode_enum not null default 'patient_local_time',
  times_per_day integer,
  structured_schedule_json jsonb not null default '[]'::jsonb,
  first_dose_at timestamptz,
  last_dose_at timestamptz,
  grace_window_minutes integer not null default 60,
  mark_missed_after_minutes integer not null default 240,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dose_schedule_times_per_day_positive
    check (times_per_day is null or times_per_day > 0),
  constraint dose_schedule_grace_window_positive check (grace_window_minutes > 0),
  constraint dose_schedule_mark_missed_positive check (mark_missed_after_minutes > 0),
  constraint dose_schedule_last_dose_gte_first
    check (last_dose_at is null or first_dose_at is null or last_dose_at >= first_dose_at),
  constraint dose_schedule_json_is_object_or_array
    check (jsonb_typeof(structured_schedule_json) in ('array', 'object'))
);

