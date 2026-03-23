-- Fix register_my_doctor_account RPC failures in the wild:
-- 1) Avoid RAISE EXCEPTION when auth.uid() is missing (return null like other paths).
-- 2) Ensure function owner is postgres so SECURITY DEFINER inserts bypass RLS on public tables.
-- 3) Nudge PostgREST to reload the schema cache after DDL.

begin;

create or replace function public.register_my_doctor_account(
  p_organization_code text,
  p_full_name text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid;
  v_email text;
begin
  v_uid := auth.uid();
  if v_uid is null then
    return null;
  end if;

  v_email := public.current_user_email();
  return public.register_my_doctor_account_internal(
    v_uid,
    v_email,
    p_organization_code,
    p_full_name
  );
end;
$$;

-- Table owner bypasses RLS; invoker (authenticated) does not. Best-effort (needs superuser).
do $owner$
begin
  alter function public.register_my_doctor_account(text, text) owner to postgres;
  alter function public.register_my_doctor_account_internal(uuid, text, text, text) owner to postgres;
exception
  when others then
    raise warning 'register_my_doctor_account owner alter skipped: %', sqlerrm;
end $owner$;

grant execute on function public.register_my_doctor_account(text, text) to authenticated;

notify pgrst, 'reload schema';

commit;
