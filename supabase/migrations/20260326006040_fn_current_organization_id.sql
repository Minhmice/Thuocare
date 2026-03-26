-- =========================================================
-- Thuocare (split from 20260324000000_all_in_one_consolidated.sql)
-- Function: public.current_organization_id()
-- =========================================================

begin;

create or replace function public.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select x.organization_id
  from (
    select ua.organization_id, 1 as priority
    from public.user_account ua
    where ua.auth_user_id = auth.uid()
      and ua.status = 'active'

    union all

    select p.organization_id, 2 as priority
    from public.patient p
    where p.auth_user_id = auth.uid()
      and p.status = 'active'
  ) x
  order by x.priority
  limit 1
$$;

grant execute on function public.current_organization_id() to authenticated;

commit;

