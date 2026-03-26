-- =========================================================
-- Thuocare (split from 20260324000000_all_in_one_consolidated.sql)
-- Function: public.belongs_to_current_org(uuid)
-- =========================================================

begin;

create or replace function public.belongs_to_current_org(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_org_id = public.current_organization_id()
$$;

grant execute on function public.belongs_to_current_org(uuid) to authenticated;

commit;

