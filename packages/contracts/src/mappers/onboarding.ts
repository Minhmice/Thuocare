import type { OnboardingIssueLog, OnboardingIssueLogRow } from "../tables/onboarding.js";

export function mapOnboardingIssueLogRow(row: OnboardingIssueLogRow): OnboardingIssueLog {
  return { ...row };
}
