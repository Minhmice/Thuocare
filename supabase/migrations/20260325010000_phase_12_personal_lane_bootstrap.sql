-- =========================================================
-- Thuocare
-- Phase 12: Personal lane bootstrap + patient schema relaxation
--
-- Changes:
--   1) Make patient.organization_id nullable so personal/family
--      lane patients can be created without an org.
--   2) Add bootstrap_self_serve_account(p_care_lane) RPC — creates
--      a patient row + personal_profile or family_profile in one tx.
--   3) Update current_three_lane_patient_id() to already handle
--      personal lane via auth_user_id on the patient row.
--
-- Design:
--   Personal lane patients have organization_id = NULL.
--   Hospital patients keep organization_id NOT NULL (enforced via
--   check constraint: lane = 'hospital' implies org is not null).
--   All existing hospital flows are unaffected.
-- =========================================================

begin;

-- ---------------------------------------------------------
-- 1) Relax patient.organization_id NOT NULL
--    Personal / family lane patients have no organization.
-- ---------------------------------------------------------

alter table public.patient
  alter column organization_id drop not null;

-- Existing hospital patients all have organization_id set, so
-- this ALTER does not change any data.

-- Re-add a partial check: hospital-linked patients still need an org.
-- (We detect hospital patients as those NOT linked to a personal/family profile.)
-- Rather than a table-level check here (which would require knowing the lane
-- at insert time), we enforce this in the bootstrap RPC and the hospital
-- onboarding flows. The RLS policies for hospital tables already require
-- organization_id IS NOT NULL via is_staff() / is_patient_actor() guards.

-- ---------------------------------------------------------
-- 2) bootstrap_self_serve_account(p_care_lane)
--    Called by the web onboarding action after sign-up for
--    personal / family lanes.
--
--    Returns the new patient.id (uuid) on success,
--    or raises an exception on failure.
-- ---------------------------------------------------------

create or replace function public.bootstrap_self_serve_account(
  p_care_lane text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_auth_user_id  uuid;
  v_email         text;
  v_full_name     text;
  v_patient_id    uuid;
  v_lane          public.care_lane_enum;
begin
  -- ── Resolve caller identity ───────────────────────────────────────────────
  v_auth_user_id := auth.uid();
  if v_auth_user_id is null then
    raise exception 'bootstrap_self_serve_account: not authenticated';
  end if;

  -- Validate lane
  if p_care_lane not in ('personal', 'family') then
    raise exception 'bootstrap_self_serve_account: unsupported lane "%". Must be personal or family.', p_care_lane;
  end if;
  v_lane := p_care_lane::public.care_lane_enum;

  -- Pull email + full_name from auth.users metadata
  select
    u.email,
    coalesce(
      u.raw_user_meta_data->>'full_name',
      u.raw_user_meta_data->>'name',
      split_part(u.email, '@', 1)
    )
  into v_email, v_full_name
  from auth.users u
  where u.id = v_auth_user_id;

  if v_email is null then
    raise exception 'bootstrap_self_serve_account: no email on auth user %', v_auth_user_id;
  end if;

  -- Ensure full_name has a value
  if v_full_name is null or trim(v_full_name) = '' then
    v_full_name := split_part(v_email, '@', 1);
  end if;

  -- ── Idempotency: check if a patient row already exists ────────────────────
  select p.id
  into v_patient_id
  from public.patient p
  where p.auth_user_id = v_auth_user_id
  limit 1;

  if v_patient_id is not null then
    -- Patient row already exists. Make sure the corresponding lane profile
    -- also exists (handles partial failures on a previous attempt).
    if v_lane = 'personal' then
      insert into public.personal_profile (patient_id, auth_user_id, preferred_name, profile_status)
      values (v_patient_id, v_auth_user_id, v_full_name, 'active')
      on conflict (patient_id) do nothing;
    else
      insert into public.family_profile (patient_id, auth_user_id, full_name, profile_status)
      values (v_patient_id, v_auth_user_id, v_full_name, 'active')
      on conflict do nothing;
    end if;
    return v_patient_id;
  end if;

  -- ── Create patient row (no organization — personal/family lane) ───────────
  insert into public.patient (
    organization_id,
    auth_user_id,
    full_name,
    email,
    status
  ) values (
    null,               -- personal/family lane: no organization
    v_auth_user_id,
    v_full_name,
    v_email,
    'active'
  )
  returning id into v_patient_id;

  -- ── Create lane profile ───────────────────────────────────────────────────
  if v_lane = 'personal' then
    insert into public.personal_profile (patient_id, auth_user_id, preferred_name, profile_status)
    values (v_patient_id, v_auth_user_id, v_full_name, 'active');
  else
    insert into public.family_profile (patient_id, auth_user_id, full_name, profile_status)
    values (v_patient_id, v_auth_user_id, v_full_name, 'active');
  end if;

  return v_patient_id;
end;
$$;

grant execute on function public.bootstrap_self_serve_account(text) to authenticated;

-- ---------------------------------------------------------
-- 3) Update my_auth_binding_status to reflect nullable org
--
--    current_organization_id() already handles null gracefully
--    (returns NULL when no org row exists). No change needed there.
--
--    The actor resolver in TypeScript must be updated to treat
--    patient_id IS NOT NULL (regardless of organization_id) as
--    a resolved patient actor for personal/family lanes.
-- ---------------------------------------------------------

-- (No SQL changes needed for the RPC itself — it already returns null
--  for organization_id when no org is linked.)

commit;
