begin;

drop trigger if exists set_updated_at_organization on public.organization;
create trigger set_updated_at_organization
before update on public.organization
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_clinic on public.clinic;
create trigger set_updated_at_clinic
before update on public.clinic
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_user_account on public.user_account;
create trigger set_updated_at_user_account
before update on public.user_account
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_doctor_profile on public.doctor_profile;
create trigger set_updated_at_doctor_profile
before update on public.doctor_profile
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_patient on public.patient;
create trigger set_updated_at_patient
before update on public.patient
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_caregiver_link on public.caregiver_link;
create trigger set_updated_at_caregiver_link
before update on public.caregiver_link
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_treatment_episode on public.treatment_episode;
create trigger set_updated_at_treatment_episode
before update on public.treatment_episode
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_encounter on public.encounter;
create trigger set_updated_at_encounter
before update on public.encounter
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_diagnosis on public.diagnosis;
create trigger set_updated_at_diagnosis
before update on public.diagnosis
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_medication_master on public.medication_master;
create trigger set_updated_at_medication_master
before update on public.medication_master
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_prescription on public.prescription;
create trigger set_updated_at_prescription
before update on public.prescription
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_prescription_item on public.prescription_item;
create trigger set_updated_at_prescription_item
before update on public.prescription_item
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_dose_schedule on public.dose_schedule;
create trigger set_updated_at_dose_schedule
before update on public.dose_schedule
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_refill_policy_snapshot on public.refill_policy_snapshot;
create trigger set_updated_at_refill_policy_snapshot
before update on public.refill_policy_snapshot
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_follow_up_plan on public.follow_up_plan;
create trigger set_updated_at_follow_up_plan
before update on public.follow_up_plan
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_appointment on public.appointment;
create trigger set_updated_at_appointment
before update on public.appointment
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_pre_visit_requirement on public.pre_visit_requirement;
create trigger set_updated_at_pre_visit_requirement
before update on public.pre_visit_requirement
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_refill_request on public.refill_request;
create trigger set_updated_at_refill_request
before update on public.refill_request
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_refill_request_item on public.refill_request_item;
create trigger set_updated_at_refill_request_item
before update on public.refill_request_item
for each row execute function public.set_updated_at();

commit;

