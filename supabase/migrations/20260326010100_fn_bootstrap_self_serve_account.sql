-- =========================================================
-- Thuocare (split from 20260325010000_phase_12_personal_lane_bootstrap.sql)
-- Function: public.bootstrap_self_serve_account(text)
-- =========================================================

begin;

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
  v_auth_user_id := auth.uid();
  if v_auth_user_id is null then
    raise exception 'bootstrap_self_serve_account: not authenticated';
  end if;

  if p_care_lane not in ('personal', 'family') then
    raise exception 'bootstrap_self_serve_account: unsupported lane "%". Must be personal or family.', p_care_lane;
  end if;
  v_lane := p_care_lane::public.care_lane_enum;

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

  if v_full_name is null or trim(v_full_name) = '' then
    v_full_name := split_part(v_email, '@', 1);
  end if;

  select p.id
  into v_patient_id
  from public.patient p
  where p.auth_user_id = v_auth_user_id
  limit 1;

  if v_patient_id is not null then
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

  insert into public.patient (
    organization_id,
    auth_user_id,
    full_name,
    email,
    status
  ) values (
    null,
    v_auth_user_id,
    v_full_name,
    v_email,
    'active'
  )
  returning id into v_patient_id;

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

commit;

