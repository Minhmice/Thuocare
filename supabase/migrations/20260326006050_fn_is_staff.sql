-- =========================================================
-- Thuocare (split from 20260324000000_all_in_one_consolidated.sql)
-- Function: public.is_staff()
-- =========================================================

begin;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_staff_user_account_id() is not null
$$;

grant execute on function public.is_staff() to authenticated;

commit;

