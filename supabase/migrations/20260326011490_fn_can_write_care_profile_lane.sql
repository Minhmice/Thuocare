-- =========================================================
-- Thuocare (split from 20260324110000_phase_10_three_lane_foundation.sql)
-- Function: public.can_write_care_profile_lane(public.care_lane_enum, uuid, uuid, uuid)
-- =========================================================

begin;

create or replace function public.can_write_care_profile_lane(
  lane_value public.care_lane_enum,
  owner_pid uuid,
  subject_pid uuid,
  org_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when lane_value = 'personal'::public.care_lane_enum then
      public.is_patient_actor() and public.is_current_patient(owner_pid)
    when lane_value = 'family'::public.care_lane_enum then
      public.current_family_patient_id() is not null
      and owner_pid = public.current_family_patient_id()
    when lane_value = 'hospital'::public.care_lane_enum then
      public.can_write_clinical_data()
      and org_id is not null
      and public.belongs_to_current_org(org_id)
      and public.has_active_org_consent(owner_pid, subject_pid, org_id, 'write_alert_log')
    else false
  end
$$;

grant execute on function public.can_write_care_profile_lane(public.care_lane_enum, uuid, uuid, uuid) to authenticated;

commit;

