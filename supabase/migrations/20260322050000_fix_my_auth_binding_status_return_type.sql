-- =========================================================
-- Fix: my_auth_binding_status() return type
--
-- Problem: The original function returns `jsonb` (a scalar type).
-- PostgREST wraps scalar returns as { "my_auth_binding_status": <value> },
-- so the client receives [{"my_auth_binding_status": {...}}] instead of
-- [{auth_user_id: "...", ...}]. The Zod schema parse then fails.
--
-- Fix: Change to RETURNS TABLE(...) so PostgREST returns rows directly
-- as [{auth_user_id: "...", email: "...", ...}], which the TypeScript
-- single-element array unwrapper handles correctly.
-- =========================================================

begin;

create or replace function public.my_auth_binding_status()
returns table(
  auth_user_id      uuid,
  email             text,
  staff_user_account_id uuid,
  staff_role        text,
  doctor_profile_id uuid,
  patient_id        uuid,
  organization_id   uuid
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    auth.uid(),
    public.current_user_email(),
    public.current_staff_user_account_id(),
    public.current_staff_role()::text,
    public.current_doctor_profile_id(),
    public.current_patient_id(),
    public.current_organization_id()
$$;

-- Grant is unchanged — same function name, same callers.
grant execute on function public.my_auth_binding_status() to authenticated;

commit;
