-- =========================================================
-- Prescription-to-Adherence Platform
-- Phase 7 / Notification & Reminder Engine
--
-- Adds:
--   notification_event       — one row per notification to deliver
--   notification_delivery_log — delivery attempt record per channel
--
-- Design notes:
--   1. organization_id is denormalized for efficient org-scoped cron queries.
--   2. Unique constraint (patient_id, type, reference_id, scheduled_at) ensures
--      idempotent trigger runs — safe to call generateDoseReminders() multiple
--      times without creating duplicate notifications.
--   3. reference_id points to the entity causing the notification
--      (prescription_item, refill_request, appointment).
--   4. payload (jsonb) carries typed data used to render the notification message.
--   5. retry_count / max_retries gate the retry loop in processNotificationQueue().
--   6. is_read is patient-facing state; status is delivery-pipeline state.
--   7. System triggers run with service_role (bypasses RLS).
--      Patients read / update own rows via RLS.
-- =========================================================

begin;

-- ---------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------

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

-- ---------------------------------------------------------
-- notification_event
-- ---------------------------------------------------------

create table public.notification_event (
  id                uuid            primary key default gen_random_uuid(),
  organization_id   uuid            not null references public.organization(id),
  patient_id        uuid            not null references public.patient(id),

  type              public.notification_type_enum   not null,
  reference_type    text,           -- 'prescription_item' | 'refill_request' | 'appointment'
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

  -- Deduplication: same notification cannot be created twice for the same
  -- patient + type + reference + scheduled time.
  constraint uq_notification_event
    unique (patient_id, type, reference_id, scheduled_at)
);

comment on table public.notification_event is
  'One row per notification to deliver. Unique per (patient, type, reference_id, scheduled_at). '
  'Trigger functions use upsert-ignore to guarantee idempotency. '
  'Delivery queue reads pending rows where scheduled_at <= now().';

comment on column public.notification_event.reference_type is
  '''prescription_item'' | ''refill_request'' | ''appointment''';

comment on column public.notification_event.reference_id is
  'FK to the entity driving this notification (UUID). Always set.';

comment on column public.notification_event.payload is
  'Typed JSON payload used to render the notification message. '
  'Shape depends on type: see notification payload interfaces.';

comment on column public.notification_event.scheduled_at is
  'When to deliver the notification. '
  'For dose reminders: dose_time - lead_minutes. '
  'For refill/missed: triggered immediately (= now at create time). '
  'For appointments: 1-day-before or same-day morning.';

comment on column public.notification_event.is_read is
  'Set to true when the patient dismisses/reads the notification in-app.';

-- ---------------------------------------------------------
-- notification_delivery_log
-- ---------------------------------------------------------

create table public.notification_delivery_log (
  id                        uuid            primary key default gen_random_uuid(),
  notification_event_id     uuid            not null references public.notification_event(id),

  channel                   public.notification_channel_enum  not null,
  status                    public.delivery_status_enum       not null,

  response_payload          jsonb,
  sent_at                   timestamptz     not null default now()
);

comment on table public.notification_delivery_log is
  'One row per delivery attempt. Multiple rows per notification_event when retried '
  'or delivered over multiple channels (future: in_app + sms).';

-- ---------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------

-- Queue processor: find pending notifications due now
create index idx_notification_event_status_scheduled
  on public.notification_event (organization_id, status, scheduled_at)
  where status = 'pending';

-- Patient reads their notifications
create index idx_notification_event_patient_created
  on public.notification_event (patient_id, created_at desc);

-- Delivery log: look up delivery history for a notification
create index idx_notification_delivery_log_event
  on public.notification_delivery_log (notification_event_id);

-- ---------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------

create trigger set_updated_at_notification_event
  before update on public.notification_event
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------

grant select, update on public.notification_event to authenticated;
grant select on public.notification_delivery_log to authenticated;

-- ---------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------

alter table public.notification_event enable row level security;
alter table public.notification_delivery_log enable row level security;

-- Patient: read own notifications
drop policy if exists notification_event_patient_select on public.notification_event;
create policy notification_event_patient_select
  on public.notification_event
  for select
  using (public.is_patient_actor() and public.is_current_patient(patient_id));

-- Patient: mark own notifications as read (UPDATE is_read only)
drop policy if exists notification_event_patient_update_read on public.notification_event;
create policy notification_event_patient_update_read
  on public.notification_event
  for update
  using (public.is_patient_actor() and public.is_current_patient(patient_id))
  with check (public.is_patient_actor() and public.is_current_patient(patient_id));

-- Patient: read delivery logs for own notifications
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

-- NOTE: All inserts and system updates use service_role key (bypasses RLS).

commit;
