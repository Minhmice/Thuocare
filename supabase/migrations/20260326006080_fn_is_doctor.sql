-- =========================================================
-- Thuocare (split from 20260324000000_all_in_one_consolidated.sql)
-- Function: public.is_doctor()
-- =========================================================

begin;

create or replace function public.is_doctor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_staff_role() = 'doctor'::public.user_role_enum
$$;

grant execute on function public.is_doctor() to authenticated;

commit;

