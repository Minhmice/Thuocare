-- =========================================================
-- Prescription-to-Adherence Platform
-- Phase 1 / Supabase Auth Onboarding Helpers
--
-- Purpose:
-- 1) Safely map auth.users -> public.user_account / public.patient
-- 2) Support automatic linking on signup using raw_user_meta_data
-- 3) Provide manual self-claim RPCs for repair / re-link flows
-- 4) Log onboarding failures for admin/service-role review
--
-- Expected signup metadata examples:
--   { "actor_type": "staff",   "organization_code": "ORG_DEMO" }
--   { "actor_type": "patient", "organization_code": "ORG_DEMO" }
--
-- Run order:
-- 1) phase_1_lifecycle_core_supabase.sql
-- 2) phase_1_lifecycle_core_rls_policies.sql
-- 3) THIS FILE
-- =========================================================

begin;

-- ---------------------------------------------------------
-- Email uniqueness to support safe patient self-claim in one org
-- ---------------------------------------------------------

create unique index if not exists patient_org_email_unique
  on public.patient (organization_id, lower(email))
  where email is not null;

comment on index public.patient_org_email_unique is 'Ensures one patient email per organization for auth self-claim.';

-- ---------------------------------------------------------
-- Operational log for onboarding failures / mismatches
-- ---------------------------------------------------------

create table if not exists public.onboarding_issue_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organization(id) on delete set null,
  actor_type text not null check (actor_type in ('staff', 'patient', 'unknown')),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  auth_email text,
  organization_code text,
  issue_code text not null check (
    issue_code in (
      'missing_actor_type',
      'unsupported_actor_type',
      'missing_email',
      'org_not_found',
      'no_matching_profile',
      'multiple_matching_profiles',
      'profile_already_linked',
      'claim_conflict'
    )
  ),
  details jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  resolved_by_user_account_id uuid references public.user_account(id) on delete set null,
  resolution_note text,
  created_at timestamptz not null default now()
);

create index if not exists onboarding_issue_log_org_created_idx
  on public.onboarding_issue_log (organization_id, created_at desc);

create index if not exists onboarding_issue_log_auth_user_idx
  on public.onboarding_issue_log (auth_user_id, created_at desc);

create index if not exists onboarding_issue_log_unresolved_idx
  on public.onboarding_issue_log (created_at desc)
  where resolved_at is null;

comment on table public.onboarding_issue_log is 'Internal operational log for failed or ambiguous auth onboarding/linking attempts.';

alter table public.onboarding_issue_log enable row level security;

-- service_role bypasses RLS as usual; admins can inspect only their own org issues.
drop policy if exists onboarding_issue_log_admin_select on public.onboarding_issue_log;
create policy onboarding_issue_log_admin_select
  on public.onboarding_issue_log
  for select
  using (
    public.is_admin()
    and organization_id is not null
    and public.belongs_to_current_org(organization_id)
  );

drop policy if exists onboarding_issue_log_admin_update on public.onboarding_issue_log;
create policy onboarding_issue_log_admin_update
  on public.onboarding_issue_log
  for update
  using (
    public.is_admin()
    and organization_id is not null
    and public.belongs_to_current_org(organization_id)
  )
  with check (
    public.is_admin()
    and organization_id is not null
    and public.belongs_to_current_org(organization_id)
  );

grant select, update on public.onboarding_issue_log to authenticated;

-- ---------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------

create or replace function public.current_user_email()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select lower(nullif(coalesce(auth.jwt() ->> 'email', ''), ''))
$$;

create or replace function public.resolve_organization_id_by_code(p_organization_code text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select o.id
  from public.organization o
  where lower(o.code) = lower(trim(p_organization_code))
    and o.status = 'active'
  limit 1
$$;

create or replace function public.log_onboarding_issue(
  p_organization_id uuid,
  p_actor_type text,
  p_auth_user_id uuid,
  p_auth_email text,
  p_organization_code text,
  p_issue_code text,
  p_details jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_issue_id uuid;
begin
  insert into public.onboarding_issue_log (
    organization_id,
    actor_type,
    auth_user_id,
    auth_email,
    organization_code,
    issue_code,
    details
  )
  values (
    p_organization_id,
    case when p_actor_type in ('staff', 'patient', 'unknown') then p_actor_type else 'unknown' end,
    p_auth_user_id,
    lower(nullif(trim(coalesce(p_auth_email, '')), '')),
    nullif(trim(coalesce(p_organization_code, '')), ''),
    p_issue_code,
    coalesce(p_details, '{}'::jsonb)
  )
  returning id into v_issue_id;

  return v_issue_id;
end;
$$;

create or replace function public.link_auth_user_to_staff(
  p_auth_user_id uuid,
  p_email text,
  p_organization_code text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text;
  v_org_id uuid;
  v_match_count integer;
  v_user_account_id uuid;
  v_existing_auth_user_id uuid;
begin
  v_email := lower(nullif(trim(coalesce(p_email, '')), ''));

  if v_email is null then
    perform public.log_onboarding_issue(
      null,
      'staff',
      p_auth_user_id,
      p_email,
      p_organization_code,
      'missing_email',
      jsonb_build_object('source', 'link_auth_user_to_staff')
    );
    return null;
  end if;

  if p_organization_code is not null then
    v_org_id := public.resolve_organization_id_by_code(p_organization_code);
    if v_org_id is null then
      perform public.log_onboarding_issue(
        null,
        'staff',
        p_auth_user_id,
        v_email,
        p_organization_code,
        'org_not_found',
        jsonb_build_object('source', 'link_auth_user_to_staff')
      );
      return null;
    end if;
  end if;

  select count(*)::int
  into v_match_count
  from public.user_account ua
  where lower(ua.email) = v_email
    and ua.status = 'active'
    and (v_org_id is null or ua.organization_id = v_org_id);

  if v_match_count = 0 then
    perform public.log_onboarding_issue(
      v_org_id,
      'staff',
      p_auth_user_id,
      v_email,
      p_organization_code,
      'no_matching_profile',
      jsonb_build_object('source', 'link_auth_user_to_staff')
    );
    return null;
  elsif v_match_count > 1 then
    perform public.log_onboarding_issue(
      v_org_id,
      'staff',
      p_auth_user_id,
      v_email,
      p_organization_code,
      'multiple_matching_profiles',
      jsonb_build_object('source', 'link_auth_user_to_staff', 'match_count', v_match_count)
    );
    return null;
  end if;

  select ua.id, ua.auth_user_id
  into v_user_account_id, v_existing_auth_user_id
  from public.user_account ua
  where lower(ua.email) = v_email
    and ua.status = 'active'
    and (v_org_id is null or ua.organization_id = v_org_id)
  limit 1;

  if v_existing_auth_user_id is not null and v_existing_auth_user_id <> p_auth_user_id then
    perform public.log_onboarding_issue(
      v_org_id,
      'staff',
      p_auth_user_id,
      v_email,
      p_organization_code,
      'profile_already_linked',
      jsonb_build_object(
        'source', 'link_auth_user_to_staff',
        'user_account_id', v_user_account_id,
        'linked_auth_user_id', v_existing_auth_user_id
      )
    );
    return null;
  end if;

  update public.user_account ua
  set auth_user_id = p_auth_user_id,
      updated_at = now()
  where ua.id = v_user_account_id
    and (ua.auth_user_id is null or ua.auth_user_id = p_auth_user_id);

  return v_user_account_id;
end;
$$;

create or replace function public.link_auth_user_to_patient(
  p_auth_user_id uuid,
  p_email text,
  p_organization_code text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text;
  v_org_id uuid;
  v_match_count integer;
  v_patient_id uuid;
  v_existing_auth_user_id uuid;
begin
  v_email := lower(nullif(trim(coalesce(p_email, '')), ''));

  if v_email is null then
    perform public.log_onboarding_issue(
      null,
      'patient',
      p_auth_user_id,
      p_email,
      p_organization_code,
      'missing_email',
      jsonb_build_object('source', 'link_auth_user_to_patient')
    );
    return null;
  end if;

  if p_organization_code is not null then
    v_org_id := public.resolve_organization_id_by_code(p_organization_code);
    if v_org_id is null then
      perform public.log_onboarding_issue(
        null,
        'patient',
        p_auth_user_id,
        v_email,
        p_organization_code,
        'org_not_found',
        jsonb_build_object('source', 'link_auth_user_to_patient')
      );
      return null;
    end if;
  end if;

  select count(*)::int
  into v_match_count
  from public.patient p
  where lower(p.email) = v_email
    and p.status = 'active'
    and (v_org_id is null or p.organization_id = v_org_id);

  if v_match_count = 0 then
    perform public.log_onboarding_issue(
      v_org_id,
      'patient',
      p_auth_user_id,
      v_email,
      p_organization_code,
      'no_matching_profile',
      jsonb_build_object('source', 'link_auth_user_to_patient')
    );
    return null;
  elsif v_match_count > 1 then
    perform public.log_onboarding_issue(
      v_org_id,
      'patient',
      p_auth_user_id,
      v_email,
      p_organization_code,
      'multiple_matching_profiles',
      jsonb_build_object('source', 'link_auth_user_to_patient', 'match_count', v_match_count)
    );
    return null;
  end if;

  select p.id, p.auth_user_id
  into v_patient_id, v_existing_auth_user_id
  from public.patient p
  where lower(p.email) = v_email
    and p.status = 'active'
    and (v_org_id is null or p.organization_id = v_org_id)
  limit 1;

  if v_existing_auth_user_id is not null and v_existing_auth_user_id <> p_auth_user_id then
    perform public.log_onboarding_issue(
      v_org_id,
      'patient',
      p_auth_user_id,
      v_email,
      p_organization_code,
      'profile_already_linked',
      jsonb_build_object(
        'source', 'link_auth_user_to_patient',
        'patient_id', v_patient_id,
        'linked_auth_user_id', v_existing_auth_user_id
      )
    );
    return null;
  end if;

  update public.patient p
  set auth_user_id = p_auth_user_id,
      updated_at = now()
  where p.id = v_patient_id
    and (p.auth_user_id is null or p.auth_user_id = p_auth_user_id);

  return v_patient_id;
end;
$$;

-- ---------------------------------------------------------
-- Manual self-claim RPCs (for authenticated users)
-- ---------------------------------------------------------

create or replace function public.claim_my_staff_account(
  p_organization_code text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_auth_user_id uuid;
  v_email text;
  v_linked_user_account_id uuid;
begin
  v_auth_user_id := auth.uid();
  v_email := public.current_user_email();

  if v_auth_user_id is null then
    raise exception 'Not authenticated';
  end if;

  v_linked_user_account_id := public.link_auth_user_to_staff(
    v_auth_user_id,
    v_email,
    p_organization_code
  );

  return v_linked_user_account_id;
end;
$$;

create or replace function public.claim_my_patient_account(
  p_organization_code text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_auth_user_id uuid;
  v_email text;
  v_linked_patient_id uuid;
begin
  v_auth_user_id := auth.uid();
  v_email := public.current_user_email();

  if v_auth_user_id is null then
    raise exception 'Not authenticated';
  end if;

  v_linked_patient_id := public.link_auth_user_to_patient(
    v_auth_user_id,
    v_email,
    p_organization_code
  );

  return v_linked_patient_id;
end;
$$;

create or replace function public.my_auth_binding_status()
returns jsonb
language sql
stable
security definer
set search_path = public, auth
as $$
  select jsonb_build_object(
    'auth_user_id', auth.uid(),
    'email', public.current_user_email(),
    'staff_user_account_id', public.current_staff_user_account_id(),
    'staff_role', public.current_staff_role(),
    'doctor_profile_id', public.current_doctor_profile_id(),
    'patient_id', public.current_patient_id(),
    'organization_id', public.current_organization_id()
  )
$$;

-- ---------------------------------------------------------
-- Automatic auth.users -> public profile linking on signup
-- ---------------------------------------------------------

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

  if v_actor_type not in ('staff', 'patient') then
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
      v_actor_type,
      new.id,
      null,
      v_org_code,
      'missing_email',
      jsonb_build_object('source', 'handle_auth_user_onboarding')
    );
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

drop trigger if exists on_auth_user_created_link_profile on auth.users;
create trigger on_auth_user_created_link_profile
  after insert on auth.users
  for each row
  execute procedure public.handle_auth_user_onboarding();

comment on function public.handle_auth_user_onboarding() is 'Automatically attempts to link new auth.users rows to staff/patient profiles by email + optional organization_code.';

-- ---------------------------------------------------------
-- Function grants / revokes
-- ---------------------------------------------------------

revoke all on function public.resolve_organization_id_by_code(text) from public, anon, authenticated;
revoke all on function public.log_onboarding_issue(uuid, text, uuid, text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.link_auth_user_to_staff(uuid, text, text) from public, anon, authenticated;
revoke all on function public.link_auth_user_to_patient(uuid, text, text) from public, anon, authenticated;
revoke all on function public.handle_auth_user_onboarding() from public, anon, authenticated;

grant execute on function public.current_user_email() to authenticated;
grant execute on function public.claim_my_staff_account(text) to authenticated;
grant execute on function public.claim_my_patient_account(text) to authenticated;
grant execute on function public.my_auth_binding_status() to authenticated;

commit;
