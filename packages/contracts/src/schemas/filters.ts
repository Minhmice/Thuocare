import { z } from "zod";
import {
  APPOINTMENT_STATUS_VALUES,
  EPISODE_STATUS_VALUES,
  PATIENT_STATUS_VALUES,
  PRESCRIPTION_STATUS_VALUES,
} from "../enums.js";
import { entityIdSchema, isoDateSchema, isoDateTimeSchema } from "./common.js";

/** Shared list/query filters for later repositories (no SQL here). */
export const paginationSchema = z.object({
  limit: z.number().int().positive().max(500).optional(),
  offset: z.number().int().nonnegative().optional(),
});

export const organizationScopeFilterSchema = z.object({
  organization_id: entityIdSchema,
});

export const patientListFilterSchema = organizationScopeFilterSchema.extend({
  status: z.enum(PATIENT_STATUS_VALUES).optional(),
  clinic_id: entityIdSchema.optional(),
});

export const episodeListFilterSchema = organizationScopeFilterSchema.extend({
  patient_id: entityIdSchema.optional(),
  current_status: z.enum(EPISODE_STATUS_VALUES).optional(),
  start_after: isoDateSchema.optional(),
  start_before: isoDateSchema.optional(),
});

export const prescriptionListFilterSchema = organizationScopeFilterSchema.extend({
  patient_id: entityIdSchema.optional(),
  treatment_episode_id: entityIdSchema.optional(),
  status: z.enum(PRESCRIPTION_STATUS_VALUES).optional(),
});

export const appointmentListFilterSchema = organizationScopeFilterSchema.extend({
  patient_id: entityIdSchema.optional(),
  treatment_episode_id: entityIdSchema.optional(),
  status: z.enum(APPOINTMENT_STATUS_VALUES).optional(),
  scheduled_after: isoDateTimeSchema.optional(),
  scheduled_before: isoDateTimeSchema.optional(),
});
