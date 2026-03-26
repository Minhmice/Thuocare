begin;

create type public.notification_type_enum as enum (
  'dose_reminder',
  'missed_dose_alert',
  'refill_reminder',
  'refill_update',
  'appointment_reminder'
);

create type public.notification_status_enum as enum (
  'pending',
  'sent',
  'failed',
  'cancelled'
);

create type public.notification_channel_enum as enum (
  'in_app',
  'sms',
  'email'
);

create type public.delivery_status_enum as enum (
  'success',
  'failed'
);

create table public.notification_event (
  id                uuid            primary key default gen_random_uuid(),
  organization_id   uuid            not null references public.organization(id),
  patient_id        uuid            not null references public.patient(id),
  type              public.notification_type_enum   not null,
  reference_type    text,
  reference_id      uuid            not null,
  payload           jsonb           not null default '{}',
  scheduled_at      timestamptz     not null,
  status            public.notification_status_enum not null default 'pending',
  is_read           boolean         not null default false,
  retry_count       integer         not null default 0,
  max_retries       integer         not null default 3,
  last_error        text,
  created_at        timestamptz     not null default now(),
  updated_at        timestamptz     not null default now(),
  constraint uq_notification_event
    unique (patient_id, type, reference_id, scheduled_at)
);

create table public.notification_delivery_log (
  id                        uuid            primary key default gen_random_uuid(),
  notification_event_id     uuid            not null references public.notification_event(id),
  channel                   public.notification_channel_enum  not null,
  status                    public.delivery_status_enum       not null,
  response_payload          jsonb,
  sent_at                   timestamptz     not null default now()
);

create index idx_notification_event_status_scheduled
  on public.notification_event (organization_id, status, scheduled_at)
  where status = 'pending';

create index idx_notification_event_patient_created
  on public.notification_event (patient_id, created_at desc);

create index idx_notification_delivery_log_event
  on public.notification_delivery_log (notification_event_id);

grant select, update on public.notification_event to authenticated;
grant select on public.notification_delivery_log to authenticated;

alter table public.notification_event enable row level security;
alter table public.notification_delivery_log enable row level security;

drop policy if exists notification_event_patient_select on public.notification_event;
create policy notification_event_patient_select
  on public.notification_event
  for select
  using (public.is_patient_actor() and public.is_current_patient(patient_id));

drop policy if exists notification_event_patient_update_read on public.notification_event;
create policy notification_event_patient_update_read
  on public.notification_event
  for update
  using (public.is_patient_actor() and public.is_current_patient(patient_id))
  with check (public.is_patient_actor() and public.is_current_patient(patient_id));

drop policy if exists notification_delivery_log_patient_select on public.notification_delivery_log;
create policy notification_delivery_log_patient_select
  on public.notification_delivery_log
  for select
  using (
    exists (
      select 1 from public.notification_event ne
      where ne.id = notification_event_id
        and public.is_current_patient(ne.patient_id)
    )
  );

commit;

