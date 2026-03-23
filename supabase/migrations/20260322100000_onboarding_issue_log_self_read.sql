-- Allow authenticated users to read their own onboarding_issue_log rows.
-- Without this, claim_my_staff_account failures (org_not_found, no_matching_profile, …)
-- could not be surfaced in the self-service onboarding UI — only admins saw logs.

begin;

drop policy if exists onboarding_issue_log_self_select on public.onboarding_issue_log;

create policy onboarding_issue_log_self_select
  on public.onboarding_issue_log
  for select
  using (auth.uid() = auth_user_id);

commit;
