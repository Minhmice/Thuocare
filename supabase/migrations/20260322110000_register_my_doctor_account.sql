  -- Doctor self-registration: create user_account (doctor, no clinic) + doctor_profile when
  -- email is new in the org; otherwise reuse link_auth_user_to_staff.
  -- Security note: anyone who knows an org code can register as a doctor in that org.
  -- Tighten later with organization.allow_self_serve_doctor_registration if needed.

  begin;

  -- Extend onboarding issue codes for doctor registration failures.
  alter table public.onboarding_issue_log
    drop constraint if exists onboarding_issue_log_issue_code_check;

  alter table public.onboarding_issue_log
    add constraint onboarding_issue_log_issue_code_check check (
      issue_code in (
        'missing_actor_type',
        'unsupported_actor_type',
        'missing_email',
        'org_not_found',
        'no_matching_profile',
        'multiple_matching_profiles',
        'profile_already_linked',
        'claim_conflict',
        'missing_organization_code',
        'registration_full_name_required'
      )
    );

  -- Internal: callable from trigger (explicit auth user id) or from RPC (auth.uid()).
  create or replace function public.register_my_doctor_account_internal(
    p_auth_user_id uuid,
    p_email text,
    p_organization_code text,
    p_full_name text
  )
  returns uuid
  language plpgsql
  security definer
  set search_path = public, auth
  as $$
  declare
    v_email text;
    v_org_id uuid;
    v_full_name text;
    v_match_count int;
    v_user_account_id uuid;
  begin
    v_email := lower(nullif(trim(coalesce(p_email, '')), ''));
    v_full_name := nullif(trim(coalesce(p_full_name, '')), '');

    if p_auth_user_id is null then
      return null;
    end if;

    if v_email is null then
      perform public.log_onboarding_issue(
        null,
        'staff',
        p_auth_user_id,
        p_email,
        p_organization_code,
        'missing_email',
        jsonb_build_object('source', 'register_my_doctor_account_internal')
      );
      return null;
    end if;

    if v_full_name is null or length(v_full_name) = 0 then
      perform public.log_onboarding_issue(
        null,
        'staff',
        p_auth_user_id,
        v_email,
        p_organization_code,
        'registration_full_name_required',
        jsonb_build_object('source', 'register_my_doctor_account_internal')
      );
      return null;
    end if;

    if p_organization_code is null or length(trim(p_organization_code)) = 0 then
      perform public.log_onboarding_issue(
        null,
        'staff',
        p_auth_user_id,
        v_email,
        p_organization_code,
        'missing_organization_code',
        jsonb_build_object('source', 'register_my_doctor_account_internal')
      );
      return null;
    end if;

    v_org_id := public.resolve_organization_id_by_code(p_organization_code);
    if v_org_id is null then
      perform public.log_onboarding_issue(
        null,
        'staff',
        p_auth_user_id,
        v_email,
        p_organization_code,
        'org_not_found',
        jsonb_build_object('source', 'register_my_doctor_account_internal')
      );
      return null;
    end if;

    select count(*)::int
    into v_match_count
    from public.user_account ua
    where lower(ua.email) = v_email
      and ua.status = 'active'
      and ua.organization_id = v_org_id;

    if v_match_count >= 1 then
      return public.link_auth_user_to_staff(p_auth_user_id, v_email, p_organization_code);
    end if;

    begin
      insert into public.user_account (
        organization_id,
        clinic_id,
        role,
        full_name,
        email,
        status,
        auth_user_id
      ) values (
        v_org_id,
        null,
        'doctor',
        v_full_name,
        v_email,
        'active',
        p_auth_user_id
      )
      returning id into v_user_account_id;

      insert into public.doctor_profile (user_account_id, default_clinic_id, status)
      values (v_user_account_id, null, 'active');

      return v_user_account_id;
    exception
      when unique_violation then
        return public.link_auth_user_to_staff(p_auth_user_id, v_email, p_organization_code);
    end;
  end;
  $$;

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

  create or replace function public.handle_auth_user_onboarding()
  returns trigger
  language plpgsql
  security definer
  set search_path = public, auth
  as $$
  declare
    v_actor_type text;
    v_org_code text;
    v_email text;
    v_full_name text;
  begin
    v_actor_type := lower(coalesce(new.raw_user_meta_data ->> 'actor_type', ''));
    v_org_code := nullif(trim(coalesce(new.raw_user_meta_data ->> 'organization_code', '')), '');
    v_email := lower(nullif(trim(coalesce(new.email, '')), ''));

    if v_actor_type = '' then
      perform public.log_onboarding_issue(
        null,
        'unknown',
        new.id,
        v_email,
        v_org_code,
        'missing_actor_type',
        jsonb_build_object('source', 'handle_auth_user_onboarding')
      );
      return new;
    end if;

    if v_actor_type not in ('staff', 'patient', 'doctor') then
      perform public.log_onboarding_issue(
        null,
        'unknown',
        new.id,
        v_email,
        v_org_code,
        'unsupported_actor_type',
        jsonb_build_object('source', 'handle_auth_user_onboarding', 'actor_type', v_actor_type)
      );
      return new;
    end if;

    if v_email is null then
      perform public.log_onboarding_issue(
        null,
        case
          when v_actor_type = 'doctor' then 'staff'
          when v_actor_type in ('staff', 'patient') then v_actor_type
          else 'unknown'
        end,
        new.id,
        null,
        v_org_code,
        'missing_email',
        jsonb_build_object('source', 'handle_auth_user_onboarding')
      );
      return new;
    end if;

    if v_actor_type = 'doctor' then
      v_full_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');
      if v_full_name is null or length(v_full_name) = 0 then
        perform public.log_onboarding_issue(
          null,
          'staff',
          new.id,
          v_email,
          v_org_code,
          'registration_full_name_required',
          jsonb_build_object('source', 'handle_auth_user_onboarding')
        );
        return new;
      end if;

      if v_org_code is null or length(v_org_code) = 0 then
        perform public.log_onboarding_issue(
          null,
          'staff',
          new.id,
          v_email,
          v_org_code,
          'missing_organization_code',
          jsonb_build_object('source', 'handle_auth_user_onboarding')
        );
        return new;
      end if;

      perform public.register_my_doctor_account_internal(new.id, v_email, v_org_code, v_full_name);
      return new;
    end if;

    if v_actor_type = 'staff' then
      perform public.link_auth_user_to_staff(new.id, v_email, v_org_code);
    else
      perform public.link_auth_user_to_patient(new.id, v_email, v_org_code);
    end if;

    return new;
  end;
  $$;

  comment on function public.handle_auth_user_onboarding() is
    'On signup: links staff/patient by email, or registers a new doctor (user_account + doctor_profile) when actor_type=doctor with org code + full_name.';

  comment on function public.register_my_doctor_account(text, text) is
    'Authenticated user: register or link as doctor in organization identified by code.';

  comment on function public.register_my_doctor_account_internal(uuid, text, text, text) is
    'Internal doctor registration / link; used by signup trigger and register_my_doctor_account RPC.';

  revoke all on function public.register_my_doctor_account_internal(uuid, text, text, text)
    from public, anon, authenticated;
  revoke all on function public.register_my_doctor_account(text, text)
    from public, anon, authenticated;

  grant execute on function public.register_my_doctor_account(text, text) to authenticated;

  commit;
