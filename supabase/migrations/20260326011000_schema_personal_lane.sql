begin;

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

create table if not exists public.personal_medication (
  id                   uuid          primary key default gen_random_uuid(),
  patient_id           uuid          not null references public.patient(id) on delete cascade,
  personal_profile_id  uuid          not null references public.personal_profile(id) on delete cascade,
  catalog_id           uuid          references public.medication_catalog(id) on delete set null,
  custom_name          text,
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
  constraint personal_medication_custom_or_catalog
    check (
      catalog_id is not null
      or (custom_name is not null and length(trim(custom_name)) > 0)
    )
);

create index if not exists personal_medication_patient_status_idx
  on public.personal_medication (patient_id, status);

create index if not exists personal_medication_personal_profile_idx
  on public.personal_medication (personal_profile_id);

create index if not exists personal_medication_start_date_idx
  on public.personal_medication (patient_id, start_date);

create table if not exists public.personal_adherence_log (
  id                     uuid        primary key default gen_random_uuid(),
  patient_id             uuid        not null references public.patient(id) on delete cascade,
  personal_medication_id uuid        not null references public.personal_medication(id) on delete cascade,
  scheduled_date         date        not null,
  scheduled_time         timestamptz not null,
  actual_taken_time      timestamptz,
  status                 public.personal_dose_status_enum not null default 'scheduled',
  source                 text        not null default 'user'
                           check (source in ('user', 'system')),
  notes                  text,
  created_at             timestamptz not null default now(),
  constraint personal_adherence_log_taken_time_requires_taken
    check (actual_taken_time is null or status = 'taken')
);

create unique index if not exists personal_adherence_log_upsert_key
  on public.personal_adherence_log (patient_id, personal_medication_id, scheduled_time);

create index if not exists personal_adherence_log_patient_date_idx
  on public.personal_adherence_log (patient_id, scheduled_date);

create index if not exists personal_adherence_log_medication_date_idx
  on public.personal_adherence_log (personal_medication_id, scheduled_date);

commit;

