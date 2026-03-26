begin;

drop trigger if exists personal_medication_updated_at_trigger on public.personal_medication;
create trigger personal_medication_updated_at_trigger
  before update on public.personal_medication
  for each row execute function public.personal_medication_set_updated_at();

alter table public.personal_medication     enable row level security;
alter table public.personal_adherence_log  enable row level security;

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

grant select, insert, update, delete on public.personal_medication    to authenticated;
grant select, insert, update, delete on public.personal_adherence_log to authenticated;

commit;

