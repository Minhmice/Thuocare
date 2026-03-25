-- Extracted table reference view
-- Source migration: 20260324000000_all_in_one_consolidated.sql
-- Table: public.onboarding_issue_log
-- Note: canonical execution order still lives in the original migration file.
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

