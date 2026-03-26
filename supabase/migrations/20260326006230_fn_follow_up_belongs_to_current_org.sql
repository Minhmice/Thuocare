-- =========================================================
-- Thuocare (split from 20260324000000_all_in_one_consolidated.sql)
-- Function: public.follow_up_belongs_to_current_org(uuid)
-- =========================================================

begin;

create or replace function public.follow_up_belongs_to_current_org(target_follow_up_plan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.follow_up_plan fup
    where fup.id = target_follow_up_plan_id
      and fup.organization_id = public.current_organization_id()
  )
$$;

grant execute on function public.follow_up_belongs_to_current_org(uuid) to authenticated;

commit;

