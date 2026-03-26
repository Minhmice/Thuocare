-- =========================================================
-- Thuocare (split from 20260324000000_all_in_one_consolidated.sql)
-- Function: public.current_doctor_profile_id()
-- =========================================================

begin;

create or replace function public.current_doctor_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select dp.id
  from public.doctor_profile dp
  join public.user_account ua on ua.id = dp.user_account_id
  where ua.auth_user_id = auth.uid()
    and ua.status = 'active'
    and dp.status = 'active'
  limit 1
$$;

grant execute on function public.current_doctor_profile_id() to authenticated;

commit;

