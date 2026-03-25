-- =========================================================
-- Thuocare
-- Phase 11: Personal Lane medication tables
--
-- Adds:
--   public.personal_medication      — self-managed medication routines
--   public.personal_adherence_log   — per-dose adherence tracking
--
-- Design goals:
--   1) Additive and backward-compatible only.
--   2) Personal lane data is PRIVATE — staff cannot read/write these rows.
--   3) Ownership is resolved via current_three_lane_patient_id() so that
--      personal_profile.auth_user_id → patient_id is respected by RLS.
--   4) Upsert conflict key for personal_adherence_log matches the
--      onConflict clause in personal-adherence-repo.ts.
-- =========================================================

begin;

-- ---------------------------------------------------------
-- 0) Enum foundations (idempotent)
-- ---------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'personal_med_status_enum'
  ) then
    create type public.personal_med_status_enum as enum ('active', 'paused', 'stopped');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'personal_dose_status_enum'
  ) then
    create type public.personal_dose_status_enum as enum ('scheduled', 'taken', 'missed', 'skipped');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'frequency_code_enum'
  ) then
    create type public.frequency_code_enum as enum (
      'QD', 'BID', 'TID', 'QID', 'Q8H', 'Q12H', 'QHS', 'QOD', 'QW', 'PRN'
    );
  end if;
end
$$;

-- ---------------------------------------------------------
-- 1) personal_medication
--    One row = one active medication routine for a personal-lane patient.
-- ---------------------------------------------------------

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

-- Auto-update updated_at on row changes
create or replace function public.personal_medication_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

drop trigger if exists personal_medication_updated_at_trigger on public.personal_medication;
create trigger personal_medication_updated_at_trigger
  before update on public.personal_medication
  for each row execute function public.personal_medication_set_updated_at();

-- ---------------------------------------------------------
-- 2) personal_adherence_log
--    One row per dose slot (scheduled_time) per medication.
--    Upserted on every take/skip/miss update.
-- ---------------------------------------------------------

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

-- ---------------------------------------------------------
-- 3) Row-level security
--
--    Personal lane data is PRIVATE.
--    Only the owning patient (resolved via current_three_lane_patient_id())
--    may read or write these rows.  Staff are intentionally excluded.
-- ---------------------------------------------------------

alter table public.personal_medication     enable row level security;
alter table public.personal_adherence_log  enable row level security;

-- personal_medication policies ----------------------------------------

drop policy if exists personal_medication_select_own on public.personal_medication;
create policy personal_medication_select_own
  on public.personal_medication
  for select using (
    patient_id = public.current_three_lane_patient_id()
  );

drop policy if exists personal_medication_insert_own on public.personal_medication;
create policy personal_medication_insert_own
  on public.personal_medication
  for insert with check (
    patient_id = public.current_three_lane_patient_id()
  );

drop policy if exists personal_medication_update_own on public.personal_medication;
create policy personal_medication_update_own
  on public.personal_medication
  for update
  using  (patient_id = public.current_three_lane_patient_id())
  with check (patient_id = public.current_three_lane_patient_id());

drop policy if exists personal_medication_delete_own on public.personal_medication;
create policy personal_medication_delete_own
  on public.personal_medication
  for delete using (
    patient_id = public.current_three_lane_patient_id()
  );

-- personal_adherence_log policies -------------------------------------

drop policy if exists personal_adherence_log_select_own on public.personal_adherence_log;
create policy personal_adherence_log_select_own
  on public.personal_adherence_log
  for select using (
    patient_id = public.current_three_lane_patient_id()
  );

drop policy if exists personal_adherence_log_insert_own on public.personal_adherence_log;
create policy personal_adherence_log_insert_own
  on public.personal_adherence_log
  for insert with check (
    patient_id = public.current_three_lane_patient_id()
  );

drop policy if exists personal_adherence_log_update_own on public.personal_adherence_log;
create policy personal_adherence_log_update_own
  on public.personal_adherence_log
  for update
  using  (patient_id = public.current_three_lane_patient_id())
  with check (patient_id = public.current_three_lane_patient_id());

drop policy if exists personal_adherence_log_delete_own on public.personal_adherence_log;
create policy personal_adherence_log_delete_own
  on public.personal_adherence_log
  for delete using (
    patient_id = public.current_three_lane_patient_id()
  );

-- ---------------------------------------------------------
-- 4) Grants
-- ---------------------------------------------------------

grant select, insert, update, delete on public.personal_medication    to authenticated;
grant select, insert, update, delete on public.personal_adherence_log to authenticated;

commit;
