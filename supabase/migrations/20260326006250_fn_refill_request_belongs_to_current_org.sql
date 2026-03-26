-- =========================================================
-- Thuocare (split from 20260324000000_all_in_one_consolidated.sql)
-- Function: public.refill_request_belongs_to_current_org(uuid)
-- =========================================================

begin;

create or replace function public.refill_request_belongs_to_current_org(target_refill_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.refill_request rr
    where rr.id = target_refill_request_id
      and rr.organization_id = public.current_organization_id()
  )
$$;

grant execute on function public.refill_request_belongs_to_current_org(uuid) to authenticated;

commit;

