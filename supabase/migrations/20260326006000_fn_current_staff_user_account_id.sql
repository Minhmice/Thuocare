-- =========================================================
-- Thuocare (split from 20260324000000_all_in_one_consolidated.sql)
-- Function: public.current_staff_user_account_id()
-- =========================================================

begin;

create or replace function public.current_staff_user_account_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select ua.id
  from public.user_account ua
  where ua.auth_user_id = auth.uid()
    and ua.status = 'active'
  limit 1
$$;

grant execute on function public.current_staff_user_account_id() to authenticated;

commit;

