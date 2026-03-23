import type { OnboardingIssueCode, OnboardingLogActorType } from "../enums.js";
import type { AuthUserId, Email, EntityId, IsoDateTime, JsonObject, OrganizationCode } from "../primitives.js";

/** `public.onboarding_issue_log` */
export interface OnboardingIssueLogRow {
  id: EntityId;
  organization_id: EntityId | null;
  actor_type: OnboardingLogActorType;
  auth_user_id: AuthUserId;
  auth_email: Email | null;
  organization_code: OrganizationCode | null;
  issue_code: OnboardingIssueCode;
  details: JsonObject;
  resolved_at: IsoDateTime | null;
  resolved_by_user_account_id: EntityId | null;
  resolution_note: string | null;
  created_at: IsoDateTime;
}

export type OnboardingIssueLog = OnboardingIssueLogRow;

export type CreateOnboardingIssueLogInput = Pick<
  OnboardingIssueLogRow,
  "actor_type" | "auth_user_id" | "issue_code"
> & {
  organization_id?: EntityId | null;
  auth_email?: Email | null;
  organization_code?: OrganizationCode | null;
  details?: JsonObject;
};

export type UpdateOnboardingIssueLogInput = Partial<
  Pick<OnboardingIssueLogRow, "resolved_at" | "resolved_by_user_account_id" | "resolution_note">
>;
