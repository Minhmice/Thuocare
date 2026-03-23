import { z } from "zod";
import {
  COMMUNICATION_PREFERENCE_VALUES,
  PATIENT_STATUS_VALUES,
  SEX_VALUES,
} from "../enums.js";
import { entityIdSchema, isoDateSchema, trimmedNonEmpty } from "./common.js";

const sexSchema = z.enum(SEX_VALUES);
const patientStatusSchema = z.enum(PATIENT_STATUS_VALUES);
const commSchema = z.enum(COMMUNICATION_PREFERENCE_VALUES);

export const createPatientSchema = z.object({
  organization_id: entityIdSchema,
  full_name: trimmedNonEmpty,
  external_patient_code: z.string().trim().min(1).nullable().optional(),
  date_of_birth: isoDateSchema.nullable().optional(),
  sex: sexSchema.optional(),
  phone: z.string().trim().min(1).nullable().optional(),
  email: z.email().nullable().optional(),
  address_text: z.string().trim().min(1).nullable().optional(),
  preferred_language: z.string().trim().min(1).nullable().optional(),
  communication_preference: commSchema.optional(),
  status: patientStatusSchema.optional(),
  auth_user_id: entityIdSchema.nullable().optional(),
});

export const updatePatientSchema = createPatientSchema.partial().omit({ organization_id: true });
