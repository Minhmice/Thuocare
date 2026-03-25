-- Extracted table reference view
-- Source migration: 20260324000000_all_in_one_consolidated.sql
-- Table: public.medication_adherence_log
-- Note: canonical execution order still lives in the original migration file.
create table public.medication_adherence_log (
  id                    uuid            primary key default gen_random_uuid(),
  organization_id       uuid            not null references public.organization(id),
  patient_id            uuid            not null references public.patient(id),
  prescription_item_id  uuid            not null references public.prescription_item(id),

  -- Scheduled dose information
  scheduled_date        date            not null,
  scheduled_time        timestamptz     not null,

  -- Outcome
  actual_taken_time     timestamptz,
  status                public.adherence_status_enum not null default 'scheduled',
  source                public.adherence_source_enum not null default 'system',
  notes                 text,

  created_at            timestamptz     not null default now(),
  updated_at            timestamptz     not null default now(),

  -- Prevent duplicate log entries for the same dose slot
  constraint uq_adherence_item_scheduled_time
    unique (prescription_item_id, scheduled_time)
);

comment on table public.medication_adherence_log is
  'Per-dose behavioral record. One row per scheduled dose slot per patient. '
  'Written by patient on take/skip, or by system cron on auto-miss. '
  'Foundation for adherence scoring, refill prediction, and doctor alerts.';

comment on column public.medication_adherence_log.scheduled_date is
  'DATE copy of scheduled_time for efficient date-range queries.';

comment on column public.medication_adherence_log.source is
  '''system'' = cron auto-miss; ''patient'' = patient app; ''caregiver'' = caregiver app.';

-- ---------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------

-- Primary query: patient's doses for a specific date (daily timeline)
create index idx_adherence_log_patient_date
  on public.medication_adherence_log (patient_id, scheduled_date);

-- Lookup for upsert on mark-taken / mark-skipped
create index idx_adherence_log_item_time
  on public.medication_adherence_log (prescription_item_id, scheduled_time);

-- System cron: find unresolved scheduled doses before a cutoff time
create index idx_adherence_log_org_status_time
  on public.medication_adherence_log (organization_id, status, scheduled_time)
  where status = 'scheduled';

-- Adherence summary by patient over a date range
create index idx_adherence_log_patient_status_date
  on public.medication_adherence_log (patient_id, status, scheduled_date);

-- ---------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------

create trigger set_updated_at_medication_adherence_log
  before update on public.medication_adherence_log
  for each row execute function public.set_updated_at();

