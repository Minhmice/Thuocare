begin;

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

create table public.medication_adherence_log (
  id                    uuid            primary key default gen_random_uuid(),
  organization_id       uuid            not null references public.organization(id),
  patient_id            uuid            not null references public.patient(id),
  prescription_item_id  uuid            not null references public.prescription_item(id),
  scheduled_date        date            not null,
  scheduled_time        timestamptz     not null,
  actual_taken_time     timestamptz,
  status                public.adherence_status_enum not null default 'scheduled',
  source                public.adherence_source_enum not null default 'system',
  notes                 text,
  created_at            timestamptz     not null default now(),
  updated_at            timestamptz     not null default now(),
  constraint uq_adherence_item_scheduled_time
    unique (prescription_item_id, scheduled_time)
);

create index idx_adherence_log_patient_date
  on public.medication_adherence_log (patient_id, scheduled_date);

create index idx_adherence_log_item_time
  on public.medication_adherence_log (prescription_item_id, scheduled_time);

create index idx_adherence_log_org_status_time
  on public.medication_adherence_log (organization_id, status, scheduled_time)
  where status = 'scheduled';

create index idx_adherence_log_patient_status_date
  on public.medication_adherence_log (patient_id, status, scheduled_date);

grant select, insert, update on public.medication_adherence_log to authenticated;

alter table public.medication_adherence_log enable row level security;

drop policy if exists adherence_log_staff_select_own_org on public.medication_adherence_log;
create policy adherence_log_staff_select_own_org
  on public.medication_adherence_log
  for select
  using (public.is_staff() and public.belongs_to_current_org(organization_id));

drop policy if exists adherence_log_patient_select_own on public.medication_adherence_log;
create policy adherence_log_patient_select_own
  on public.medication_adherence_log
  for select
  using (public.is_patient_actor() and public.is_current_patient(patient_id));

drop policy if exists adherence_log_patient_insert_own on public.medication_adherence_log;
create policy adherence_log_patient_insert_own
  on public.medication_adherence_log
  for insert
  with check (public.is_patient_actor() and public.is_current_patient(patient_id));

drop policy if exists adherence_log_patient_update_own on public.medication_adherence_log;
create policy adherence_log_patient_update_own
  on public.medication_adherence_log
  for update
  using (public.is_patient_actor() and public.is_current_patient(patient_id))
  with check (public.is_patient_actor() and public.is_current_patient(patient_id));

commit;

