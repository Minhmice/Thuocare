import { z } from "zod";
import {
  DOSE_SCHEDULE_TYPE_VALUES,
  PRESCRIPTION_ITEM_STATUS_VALUES,
  PRESCRIPTION_KIND_VALUES,
  PRESCRIPTION_SOURCE_VALUES,
  PRESCRIPTION_STATUS_VALUES,
  REFILL_MODE_VALUES,
  ROUTE_VALUES,
  TIMING_RELATION_VALUES,
  TIMEZONE_MODE_VALUES,
} from "../enums.js";
import {
  entityIdSchema,
  isoDateSchema,
  isoDateTimeSchema,
  positiveDecimalStringSchema,
  ratioStringSchema,
  structuredScheduleJsonSchema,
  trimmedNonEmpty,
} from "./common.js";

const prescriptionKindSchema = z.enum(PRESCRIPTION_KIND_VALUES);
const prescriptionSourceSchema = z.enum(PRESCRIPTION_SOURCE_VALUES);
const prescriptionStatusSchema = z.enum(PRESCRIPTION_STATUS_VALUES);
const timingRelationSchema = z.enum(TIMING_RELATION_VALUES);
const prescriptionItemStatusSchema = z.enum(PRESCRIPTION_ITEM_STATUS_VALUES);
const doseScheduleTypeSchema = z.enum(DOSE_SCHEDULE_TYPE_VALUES);
const timezoneModeSchema = z.enum(TIMEZONE_MODE_VALUES);
const refillModeSchema = z.enum(REFILL_MODE_VALUES);
const routeSchema = z.enum(ROUTE_VALUES);

const createPrescriptionSchemaBase = z.object({
  organization_id: entityIdSchema,
  clinic_id: entityIdSchema,
  patient_id: entityIdSchema,
  treatment_episode_id: entityIdSchema,
  prescription_kind: prescriptionKindSchema,
  issue_source: prescriptionSourceSchema,
  effective_from: isoDateSchema,
  encounter_id: entityIdSchema.nullable().optional(),
  doctor_id: entityIdSchema.nullable().optional(),
  parent_prescription_id: entityIdSchema.nullable().optional(),
  status: prescriptionStatusSchema.optional(),
  issued_at: isoDateTimeSchema.nullable().optional(),
  effective_to: isoDateSchema.nullable().optional(),
  days_supply_total: z.number().int().positive().nullable().optional(),
  renewal_sequence_no: z.number().int().nonnegative().optional(),
  clinical_note: z.string().trim().min(1).nullable().optional(),
  patient_friendly_summary: z.string().trim().min(1).nullable().optional(),
});

export const createPrescriptionSchema = createPrescriptionSchemaBase
  .superRefine((val, ctx) => {
    if (val.effective_to && val.effective_to < val.effective_from) {
      ctx.addIssue({
        code: "custom",
        path: ["effective_to"],
        message: "effective_to must be on or after effective_from",
      });
    }
  });

export const updatePrescriptionSchema = createPrescriptionSchemaBase
  .partial()
  .omit({ organization_id: true, patient_id: true, treatment_episode_id: true })
  .superRefine((val, ctx) => {
    if (val.effective_from && val.effective_to && val.effective_to < val.effective_from) {
      ctx.addIssue({
        code: "custom",
        path: ["effective_to"],
        message: "effective_to must be on or after effective_from",
      });
    }
  });

const createPrescriptionItemSchemaBase = z.object({
  prescription_id: entityIdSchema,
  line_no: z.number().int().positive(),
  medication_master_id: entityIdSchema,
  dose_amount: positiveDecimalStringSchema,
  dose_unit: trimmedNonEmpty,
  route: routeSchema,
  frequency_text: trimmedNonEmpty,
  administration_instruction_text: trimmedNonEmpty,
  patient_instruction_text: trimmedNonEmpty,
  quantity_prescribed: positiveDecimalStringSchema,
  quantity_unit: trimmedNonEmpty,
  days_supply: z.number().int().positive(),
  start_date: isoDateSchema,
  indication_text: z.string().trim().min(1).nullable().optional(),
  frequency_code: z.string().trim().min(1).nullable().optional(),
  timing_relation: timingRelationSchema.optional(),
  prn_flag: z.boolean().optional(),
  prn_reason: z.string().trim().min(1).nullable().optional(),
  end_date: isoDateSchema.nullable().optional(),
  is_refillable: z.boolean().optional(),
  max_refills_allowed: z.number().int().nonnegative().optional(),
  requires_review_before_refill: z.boolean().optional(),
  high_risk_review_flag: z.boolean().optional(),
  status: prescriptionItemStatusSchema.optional(),
  stop_reason: z.string().trim().min(1).nullable().optional(),
});

export const createPrescriptionItemSchema = createPrescriptionItemSchemaBase
  .superRefine((val, ctx) => {
    const prn = val.prn_flag ?? false;
    if (prn && (!val.prn_reason || val.prn_reason.trim().length === 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["prn_reason"],
        message: "prn_reason is required when prn_flag is true",
      });
    }
    if (val.end_date && val.end_date < val.start_date) {
      ctx.addIssue({
        code: "custom",
        path: ["end_date"],
        message: "end_date must be on or after start_date",
      });
    }
  });

export const updatePrescriptionItemSchema = createPrescriptionItemSchemaBase
  .partial()
  .omit({ prescription_id: true })
  .superRefine((val, ctx) => {
    if (val.prn_flag === true && val.prn_reason !== undefined && val.prn_reason !== null && val.prn_reason.trim().length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["prn_reason"],
        message: "prn_reason must be non-empty when prn_flag is true",
      });
    }
  });

const createDoseScheduleSchemaBase = z.object({
  prescription_item_id: entityIdSchema,
  schedule_type: doseScheduleTypeSchema,
  timezone_mode: timezoneModeSchema.optional(),
  times_per_day: z.number().int().positive().nullable().optional(),
  structured_schedule_json: structuredScheduleJsonSchema.optional(),
  first_dose_at: isoDateTimeSchema.nullable().optional(),
  last_dose_at: isoDateTimeSchema.nullable().optional(),
  grace_window_minutes: z.number().int().positive().optional(),
  mark_missed_after_minutes: z.number().int().positive().optional(),
});

export const createDoseScheduleSchema = createDoseScheduleSchemaBase
  .superRefine((val, ctx) => {
    if (val.first_dose_at && val.last_dose_at && val.last_dose_at < val.first_dose_at) {
      ctx.addIssue({
        code: "custom",
        path: ["last_dose_at"],
        message: "last_dose_at must be on or after first_dose_at",
      });
    }
  });

export const updateDoseScheduleSchema = createDoseScheduleSchemaBase.partial().omit({
  prescription_item_id: true,
});

const createRefillPolicySnapshotSchemaBase = z.object({
  prescription_item_id: entityIdSchema,
  refill_mode: refillModeSchema,
  max_refills_allowed: z.number().int().nonnegative().optional(),
  min_days_between_refills: z.number().int().positive().nullable().optional(),
  earliest_refill_ratio: ratioStringSchema.nullable().optional(),
  review_required_after_date: isoDateSchema.nullable().optional(),
  absolute_expiry_date: isoDateSchema.nullable().optional(),
  late_refill_escalation_after_days: z.number().int().nonnegative().nullable().optional(),
  notes: z.string().trim().min(1).nullable().optional(),
});

export const createRefillPolicySnapshotSchema = createRefillPolicySnapshotSchemaBase
  .superRefine((val, ctx) => {
    if (
      val.absolute_expiry_date &&
      val.review_required_after_date &&
      val.absolute_expiry_date < val.review_required_after_date
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["absolute_expiry_date"],
        message: "absolute_expiry_date must be on or after review_required_after_date",
      });
    }
  });

export const updateRefillPolicySnapshotSchema = createRefillPolicySnapshotSchemaBase
  .partial()
  .omit({ prescription_item_id: true })
  .superRefine((val, ctx) => {
    if (
      val.absolute_expiry_date &&
      val.review_required_after_date &&
      val.absolute_expiry_date < val.review_required_after_date
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["absolute_expiry_date"],
        message: "absolute_expiry_date must be on or after review_required_after_date",
      });
    }
  });
