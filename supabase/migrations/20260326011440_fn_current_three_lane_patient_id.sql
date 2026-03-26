-- =========================================================
-- Thuocare (split from 20260324110000_phase_10_three_lane_foundation.sql)
-- Function: public.current_three_lane_patient_id()
-- =========================================================

begin;

create or replace function public.current_three_lane_patient_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select x.patient_id
  from (
    select pp.patient_id, 1 as priority
    from public.personal_profile pp
    where pp.auth_user_id = auth.uid()
      and pp.profile_status = 'active'
    union all
    select fp.patient_id, 2 as priority
    from public.family_profile fp
    where fp.auth_user_id = auth.uid()
      and fp.profile_status = 'active'
    union all
    select p.id as patient_id, 3 as priority
    from public.patient p
    where p.auth_user_id = auth.uid()
      and p.status = 'active'
  ) x
  order by x.priority
  limit 1
$$;

grant execute on function public.current_three_lane_patient_id() to authenticated;

commit;

