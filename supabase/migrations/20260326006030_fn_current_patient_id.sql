-- =========================================================
-- Thuocare (split from 20260324000000_all_in_one_consolidated.sql)
-- Function: public.current_patient_id()
-- =========================================================

begin;

create or replace function public.current_patient_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.patient p
  where p.auth_user_id = auth.uid()
    and p.status = 'active'
  limit 1
$$;

grant execute on function public.current_patient_id() to authenticated;

commit;

