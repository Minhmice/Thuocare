-- =========================================================
-- Thuocare (split from 20260324110000_phase_10_three_lane_foundation.sql)
-- Function: public.current_personal_profile_id()
-- =========================================================

begin;

create or replace function public.current_personal_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select pp.id
  from public.personal_profile pp
  where pp.auth_user_id = auth.uid()
    and pp.profile_status = 'active'
  limit 1
$$;

grant execute on function public.current_personal_profile_id() to authenticated;

commit;

