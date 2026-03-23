import { z } from "zod";
import {
  APPOINTMENT_STATUS_VALUES,
  APPOINTMENT_TYPE_VALUES,
  FOLLOW_UP_STATUS_VALUES,
  FOLLOW_UP_TRIGGER_MODE_VALUES,
  FOLLOW_UP_TYPE_VALUES,
  PRE_VISIT_REQUIREMENT_STATUS_VALUES,
  PRE_VISIT_REQUIREMENT_TYPE_VALUES,
} from "../enums.js";
import { entityIdSchema, isoDateTimeSchema, trimmedNonEmpty } from "./common.js";

const followUpTypeSchema = z.enum(FOLLOW_UP_TYPE_VALUES);
const followUpTriggerSchema = z.enum(FOLLOW_UP_TRIGGER_MODE_VALUES);
const followUpStatusSchema = z.enum(FOLLOW_UP_STATUS_VALUES);
const appointmentTypeSchema = z.enum(APPOINTMENT_TYPE_VALUES);
const appointmentStatusSchema = z.enum(APPOINTMENT_STATUS_VALUES);
const preVisitTypeSchema = z.enum(PRE_VISIT_REQUIREMENT_TYPE_VALUES);
const preVisitStatusSchema = z.enum(PRE_VISIT_REQUIREMENT_STATUS_VALUES);

const createFollowUpPlanSchemaBase = z.object({
  organization_id: entityIdSchema,
  patient_id: entityIdSchema,
  treatment_episode_id: entityIdSchema,
  follow_up_type: followUpTypeSchema,
  trigger_mode: followUpTriggerSchema,
  source_prescription_id: entityIdSchema.nullable().optional(),
  owner_doctor_id: entityIdSchema.nullable().optional(),
  due_at: isoDateTimeSchema.nullable().optional(),
  due_window_start_at: isoDateTimeSchema.nullable().optional(),
  due_window_end_at: isoDateTimeSchema.nullable().optional(),
  required_before_refill: z.boolean().optional(),
  instruction_text: z.string().trim().min(1).nullable().optional(),
  status: followUpStatusSchema.optional(),
  completed_at: isoDateTimeSchema.nullable().optional(),
});

export const createFollowUpPlanSchema = createFollowUpPlanSchemaBase
  .superRefine((val, ctx) => {
    if (
      val.due_window_start_at &&
      val.due_window_end_at &&
      val.due_window_end_at < val.due_window_start_at
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["due_window_end_at"],
        message: "due_window_end_at must be on or after due_window_start_at",
      });
    }
    if (val.status === "completed" && !val.completed_at) {
      ctx.addIssue({
        code: "custom",
        path: ["completed_at"],
        message: "completed_at is required when status is completed",
      });
    }
  });

export const updateFollowUpPlanSchema = createFollowUpPlanSchemaBase
  .partial()
  .omit({ organization_id: true, patient_id: true, treatment_episode_id: true })
  .superRefine((val, ctx) => {
    if (
      val.due_window_start_at &&
      val.due_window_end_at &&
      val.due_window_end_at < val.due_window_start_at
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["due_window_end_at"],
        message: "due_window_end_at must be on or after due_window_start_at",
      });
    }
    if (val.status === "completed" && val.completed_at === null) {
      ctx.addIssue({
        code: "custom",
        path: ["completed_at"],
        message: "completed_at is required when status is completed",
      });
    }
  });

const createAppointmentSchemaBase = z.object({
  organization_id: entityIdSchema,
  clinic_id: entityIdSchema,
  patient_id: entityIdSchema,
  treatment_episode_id: entityIdSchema,
  appointment_type: appointmentTypeSchema,
  scheduled_start_at: isoDateTimeSchema,
  scheduled_end_at: isoDateTimeSchema,
  follow_up_plan_id: entityIdSchema.nullable().optional(),
  doctor_id: entityIdSchema.nullable().optional(),
  status: appointmentStatusSchema.optional(),
  reason_text: z.string().trim().min(1).nullable().optional(),
  outcome_summary: z.string().trim().min(1).nullable().optional(),
});

export const createAppointmentSchema = createAppointmentSchemaBase
  .superRefine((val, ctx) => {
    if (val.scheduled_end_at <= val.scheduled_start_at) {
      ctx.addIssue({
        code: "custom",
        path: ["scheduled_end_at"],
        message: "scheduled_end_at must be after scheduled_start_at",
      });
    }
  });

export const updateAppointmentSchema = createAppointmentSchemaBase
  .partial()
  .omit({ organization_id: true, patient_id: true, treatment_episode_id: true })
  .superRefine((val, ctx) => {
    if (val.scheduled_start_at && val.scheduled_end_at && val.scheduled_end_at <= val.scheduled_start_at) {
      ctx.addIssue({
        code: "custom",
        path: ["scheduled_end_at"],
        message: "scheduled_end_at must be after scheduled_start_at",
      });
    }
  });

export const createPreVisitRequirementSchema = z.object({
  appointment_id: entityIdSchema,
  requirement_type: preVisitTypeSchema,
  instruction_text: trimmedNonEmpty,
  status: preVisitStatusSchema.optional(),
});

export const updatePreVisitRequirementSchema = createPreVisitRequirementSchema
  .partial()
  .omit({ appointment_id: true });
