-- =========================================================
-- Thuocare (split from 20260324000000_all_in_one_consolidated.sql)
-- Function: public.can_write_prescriptions()
-- =========================================================

begin;

create or replace function public.can_write_prescriptions()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_staff_role() in (
    'doctor'::public.user_role_enum,
    'admin'::public.user_role_enum
  )
$$;

grant execute on function public.can_write_prescriptions() to authenticated;

commit;

