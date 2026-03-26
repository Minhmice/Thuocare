-- =========================================================
-- Thuocare (split from 20260324000000_all_in_one_consolidated.sql)
-- Function: public.patient_belongs_to_current_org(uuid)
-- =========================================================

begin;

create or replace function public.patient_belongs_to_current_org(target_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.patient p
    where p.id = target_patient_id
      and p.organization_id = public.current_organization_id()
  )
$$;

grant execute on function public.patient_belongs_to_current_org(uuid) to authenticated;

commit;

