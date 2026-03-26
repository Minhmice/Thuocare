-- =========================================================
-- Thuocare (split from 20260324000000_all_in_one_consolidated.sql)
-- Function: public.is_admin()
-- =========================================================

begin;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_staff_role() = 'admin'::public.user_role_enum
$$;

grant execute on function public.is_admin() to authenticated;

commit;

