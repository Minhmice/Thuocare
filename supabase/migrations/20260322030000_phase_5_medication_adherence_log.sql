-- =========================================================
-- Prescription-to-Adherence Platform
-- Phase 5 / Patient Medication Timeline & Adherence Tracking
--
-- Adds:
--   medication_adherence_log  — per-dose behavioral record
--
-- Design notes:
--   1. organization_id is denormalized onto the table to keep RLS
--      efficient (same pattern as prescription, treatment_event).
--   2. scheduled_date (DATE) is a separate column so common queries
--      ("what happened today?") avoid casting scheduled_time.
--   3. Unique constraint on (prescription_item_id, scheduled_time)
--      prevents duplicate log entries for the same dose slot.
--   4. Status lifecycle: scheduled → taken | skipped | missed
--      "scheduled" is only written by the system to pre-register doses;
--      take/skip/miss writes come from patient UI or the cron job.
-- =========================================================

begin;

-- ---------------------------------------------------------
-- New enum types
-- ---------------------------------------------------------

create type public.adherence_status_enum as enum (
  'scheduled',
  'taken',
  'missed',
  'skipped'
);

create type public.adherence_source_enum as enum (
  'patient',
  'caregiver',
  'system'
);

-- ---------------------------------------------------------
-- medication_adherence_log
-- ---------------------------------------------------------

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

-- ---------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------

grant select, insert, update on public.medication_adherence_log to authenticated;

-- ---------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------

alter table public.medication_adherence_log enable row level security;

-- Staff: read all logs in their organization
drop policy if exists adherence_log_staff_select_own_org on public.medication_adherence_log;
create policy adherence_log_staff_select_own_org
  on public.medication_adherence_log
  for select
  using (public.is_staff() and public.belongs_to_current_org(organization_id));

-- Patient: read own logs only
drop policy if exists adherence_log_patient_select_own on public.medication_adherence_log;
create policy adherence_log_patient_select_own
  on public.medication_adherence_log
  for select
  using (public.is_patient_actor() and public.is_current_patient(patient_id));

-- Patient: insert own logs (mark taken / skipped)
drop policy if exists adherence_log_patient_insert_own on public.medication_adherence_log;
create policy adherence_log_patient_insert_own
  on public.medication_adherence_log
  for insert
  with check (public.is_patient_actor() and public.is_current_patient(patient_id));

-- Patient: update own logs (e.g., late-mark taken after missed)
drop policy if exists adherence_log_patient_update_own on public.medication_adherence_log;
create policy adherence_log_patient_update_own
  on public.medication_adherence_log
  for update
  using (public.is_patient_actor() and public.is_current_patient(patient_id))
  with check (public.is_patient_actor() and public.is_current_patient(patient_id));

-- NOTE: processMissedDoses() must run with service_role key (bypasses RLS).
-- Regular authenticated users cannot auto-miss doses.

commit;
