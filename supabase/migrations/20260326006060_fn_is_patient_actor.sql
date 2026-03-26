-- =========================================================
-- Thuocare (split from 20260324000000_all_in_one_consolidated.sql)
-- Function: public.is_patient_actor()
-- =========================================================

begin;

create or replace function public.is_patient_actor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_patient_id() is not null
$$;

grant execute on function public.is_patient_actor() to authenticated;

commit;

