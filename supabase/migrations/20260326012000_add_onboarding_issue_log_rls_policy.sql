-- =========================================================
-- Thuocare - Add RLS policy for onboarding_issue_log
-- =========================================================

CREATE POLICY "onboarding_issue_log_self_select" ON public.onboarding_issue_log
FOR SELECT USING (auth_user_id = auth.uid());
