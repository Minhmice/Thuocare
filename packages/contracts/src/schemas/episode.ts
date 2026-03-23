import { z } from "zod";
import {
  EPISODE_STATUS_VALUES,
  EPISODE_TYPE_VALUES,
  RISK_TIER_VALUES,
} from "../enums.js";
import { entityIdSchema, isoDateSchema, isoDateTimeSchema, trimmedNonEmpty } from "./common.js";

const episodeTypeSchema = z.enum(EPISODE_TYPE_VALUES);
const episodeStatusSchema = z.enum(EPISODE_STATUS_VALUES);
const riskTierSchema = z.enum(RISK_TIER_VALUES);

const createTreatmentEpisodeSchemaBase = z.object({
  organization_id: entityIdSchema,
  clinic_id: entityIdSchema,
  patient_id: entityIdSchema,
  episode_type: episodeTypeSchema,
  title: trimmedNonEmpty,
  start_date: isoDateSchema,
  primary_doctor_id: entityIdSchema.nullable().optional(),
  condition_group: z.string().trim().min(1).nullable().optional(),
  clinical_summary: z.string().trim().min(1).nullable().optional(),
  target_end_date: isoDateSchema.nullable().optional(),
  current_status: episodeStatusSchema.optional(),
  risk_tier: riskTierSchema.optional(),
  next_review_due_at: isoDateTimeSchema.nullable().optional(),
  last_activity_at: isoDateTimeSchema.nullable().optional(),
});

export const createTreatmentEpisodeSchema = createTreatmentEpisodeSchemaBase
  .superRefine((val, ctx) => {
    if (val.target_end_date && val.target_end_date < val.start_date) {
      ctx.addIssue({
        code: "custom",
        path: ["target_end_date"],
        message: "target_end_date must be on or after start_date",
      });
    }
  });

export const updateTreatmentEpisodeSchema = createTreatmentEpisodeSchemaBase
  .partial()
  .omit({ organization_id: true, patient_id: true })
  .superRefine((val, ctx) => {
    if (val.start_date && val.target_end_date && val.target_end_date < val.start_date) {
      ctx.addIssue({
        code: "custom",
        path: ["target_end_date"],
        message: "target_end_date must be on or after start_date",
      });
    }
  });
