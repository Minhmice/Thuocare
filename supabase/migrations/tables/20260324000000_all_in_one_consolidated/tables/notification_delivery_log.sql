-- Extracted table reference view
-- Source migration: 20260324000000_all_in_one_consolidated.sql
-- Table: public.notification_delivery_log
-- Note: canonical execution order still lives in the original migration file.
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

