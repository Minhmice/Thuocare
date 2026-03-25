-- Extracted table reference view
-- Source migration: 20260325000000_phase_11_personal_lane_tables.sql
-- Table: public.personal_adherence_log
-- Note: canonical execution order still lives in the original migration file.
create table if not exists public.personal_adherence_log (
  id                     uuid        primary key default gen_random_uuid(),
  patient_id             uuid        not null references public.patient(id) on delete cascade,
  personal_medication_id uuid        not null references public.personal_medication(id) on delete cascade,
  scheduled_date         date        not null,
  scheduled_time         timestamptz not null,
  actual_taken_time      timestamptz,
  status                 public.personal_dose_status_enum not null default 'scheduled',
  -- 'user' = patient tapped the button; 'system' = automated miss detection
  source                 text        not null default 'user'
                           check (source in ('user', 'system')),
  notes                  text,
  created_at             timestamptz not null default now(),

  -- actual_taken_time only makes sense when the dose was actually taken
  constraint personal_adherence_log_taken_time_requires_taken
    check (actual_taken_time is null or status = 'taken')
);

-- Unique key used by the upsert in personal-adherence-repo.ts:
--   .upsert({ ... }, { onConflict: 'patient_id,personal_medication_id,scheduled_time' })
create unique index if not exists personal_adherence_log_upsert_key
  on public.personal_adherence_log (patient_id, personal_medication_id, scheduled_time);

-- Fast lookup by date (history view, summary)
create index if not exists personal_adherence_log_patient_date_idx
  on public.personal_adherence_log (patient_id, scheduled_date);

create index if not exists personal_adherence_log_medication_date_idx
  on public.personal_adherence_log (personal_medication_id, scheduled_date);

