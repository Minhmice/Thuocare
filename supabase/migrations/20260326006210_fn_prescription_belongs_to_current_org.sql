-- =========================================================
-- Thuocare (split from 20260324000000_all_in_one_consolidated.sql)
-- Function: public.prescription_belongs_to_current_org(uuid)
-- =========================================================

begin;

create or replace function public.prescription_belongs_to_current_org(target_prescription_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.prescription p
    where p.id = target_prescription_id
      and p.organization_id = public.current_organization_id()
  )
$$;

grant execute on function public.prescription_belongs_to_current_org(uuid) to authenticated;

commit;

