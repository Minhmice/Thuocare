import { z } from "zod";
import { ONBOARDING_ISSUE_CODE_VALUES, ONBOARDING_LOG_ACTOR_TYPE_VALUES } from "../enums.js";
import { entityIdSchema, jsonObjectSchema } from "./common.js";

const logActorSchema = z.enum(ONBOARDING_LOG_ACTOR_TYPE_VALUES);
const issueCodeSchema = z.enum(ONBOARDING_ISSUE_CODE_VALUES);

export const createOnboardingIssueLogSchema = z.object({
  actor_type: logActorSchema,
  auth_user_id: entityIdSchema,
  issue_code: issueCodeSchema,
  organization_id: entityIdSchema.nullable().optional(),
  auth_email: z.email().nullable().optional(),
  organization_code: z.string().trim().min(1).nullable().optional(),
  details: jsonObjectSchema.optional(),
});

export const updateOnboardingIssueLogSchema = z.object({
  resolved_at: z.iso.datetime().nullable().optional(),
  resolved_by_user_account_id: entityIdSchema.nullable().optional(),
  resolution_note: z.string().trim().min(1).nullable().optional(),
});
