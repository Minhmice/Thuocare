-- =========================================================
-- Thuocare (split from 20260324000000_all_in_one_consolidated.sql)
-- Function: public.is_nurse()
-- =========================================================

begin;

create or replace function public.is_nurse()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_staff_role() = 'nurse'::public.user_role_enum
$$;

grant execute on function public.is_nurse() to authenticated;

commit;

