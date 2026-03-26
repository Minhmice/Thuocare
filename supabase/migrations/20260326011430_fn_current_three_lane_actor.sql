-- =========================================================
-- Thuocare (split from 20260324110000_phase_10_three_lane_foundation.sql)
-- Function: public.current_three_lane_actor()
-- =========================================================

begin;

create or replace function public.current_three_lane_actor()
returns public.three_lane_actor_enum
language sql
stable
security definer
set search_path = public
as $$
  select
    case
      when public.current_personal_profile_id() is not null then 'personal'::public.three_lane_actor_enum
      when public.current_family_profile_id() is not null then 'family'::public.three_lane_actor_enum
      when public.current_staff_user_account_id() is not null then 'hospital'::public.three_lane_actor_enum
      when public.current_patient_id() is not null then 'hospital'::public.three_lane_actor_enum
      else 'unknown'::public.three_lane_actor_enum
    end
$$;

grant execute on function public.current_three_lane_actor() to authenticated;

commit;

