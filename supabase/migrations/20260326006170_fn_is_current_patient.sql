-- =========================================================
-- Thuocare (split from 20260324000000_all_in_one_consolidated.sql)
-- Function: public.is_current_patient(uuid)
-- =========================================================

begin;

create or replace function public.is_current_patient(target_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_patient_id = public.current_patient_id()
$$;

grant execute on function public.is_current_patient(uuid) to authenticated;

commit;

