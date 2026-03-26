-- =========================================================
-- Thuocare (split from 20260324000000_all_in_one_consolidated.sql)
-- Function: public.can_manage_medication_catalog()
-- =========================================================

begin;

create or replace function public.can_manage_medication_catalog()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_staff_role() in (
    'pharmacist'::public.user_role_enum,
    'admin'::public.user_role_enum
  )
$$;

grant execute on function public.can_manage_medication_catalog() to authenticated;

commit;

