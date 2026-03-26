begin;

drop trigger if exists set_updated_at_medication_adherence_log on public.medication_adherence_log;
create trigger set_updated_at_medication_adherence_log
  before update on public.medication_adherence_log
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_notification_event on public.notification_event;
create trigger set_updated_at_notification_event
  before update on public.notification_event
  for each row execute function public.set_updated_at();

commit;

