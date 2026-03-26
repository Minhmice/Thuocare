-- =========================================================
-- Thuocare (split from 20260324110000_phase_10_three_lane_foundation.sql)
-- Function: public.current_family_patient_id()
-- =========================================================

begin;

create or replace function public.current_family_patient_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select fp.patient_id
  from public.family_profile fp
  where fp.auth_user_id = auth.uid()
    and fp.profile_status = 'active'
  limit 1
$$;

grant execute on function public.current_family_patient_id() to authenticated;

commit;

