-- Extracted table reference view
-- Source migration: 20260324000000_all_in_one_consolidated.sql
-- Table: public.notification_event
-- Note: canonical execution order still lives in the original migration file.
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

