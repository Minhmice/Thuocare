import { z } from "zod";
import { ENCOUNTER_TYPE_VALUES } from "../enums.js";
import { entityIdSchema, isoDateTimeSchema } from "./common.js";

const encounterTypeSchema = z.enum(ENCOUNTER_TYPE_VALUES);

export const createEncounterSchema = z.object({
  organization_id: entityIdSchema,
  clinic_id: entityIdSchema,
  patient_id: entityIdSchema,
  treatment_episode_id: entityIdSchema,
  encounter_type: encounterTypeSchema,
  encounter_at: isoDateTimeSchema,
  doctor_id: entityIdSchema.nullable().optional(),
  chief_complaint: z.string().trim().min(1).nullable().optional(),
  assessment_summary: z.string().trim().min(1).nullable().optional(),
  plan_summary: z.string().trim().min(1).nullable().optional(),
  next_follow_up_recommendation_at: isoDateTimeSchema.nullable().optional(),
});

export const updateEncounterSchema = createEncounterSchema
  .partial()
  .omit({ organization_id: true, patient_id: true, treatment_episode_id: true });
