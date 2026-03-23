import { z } from "zod";
import {
  FULFILLMENT_PREFERENCE_VALUES,
  REFILL_REQUEST_ITEM_STATUS_VALUES,
  REFILL_REQUEST_STATUS_VALUES,
  REFILL_TRIGGER_SOURCE_VALUES,
  REQUEST_SCOPE_VALUES,
  REQUESTED_BY_TYPE_VALUES,
} from "../enums.js";
import { entityIdSchema, isoDateTimeSchema, optionalPositiveDecimalStringSchema } from "./common.js";

const requestScopeSchema = z.enum(REQUEST_SCOPE_VALUES);
const requestedByTypeSchema = z.enum(REQUESTED_BY_TYPE_VALUES);
const triggerSourceSchema = z.enum(REFILL_TRIGGER_SOURCE_VALUES);
const fulfillmentSchema = z.enum(FULFILLMENT_PREFERENCE_VALUES);
const refillRequestStatusSchema = z.enum(REFILL_REQUEST_STATUS_VALUES);
const refillRequestItemStatusSchema = z.enum(REFILL_REQUEST_ITEM_STATUS_VALUES);

export const createRefillRequestSchema = z.object({
  organization_id: entityIdSchema,
  patient_id: entityIdSchema,
  treatment_episode_id: entityIdSchema,
  request_scope: requestScopeSchema,
  source_prescription_id: entityIdSchema,
  requested_by_type: requestedByTypeSchema,
  trigger_source: triggerSourceSchema,
  requested_by_ref_id: entityIdSchema.nullable().optional(),
  preferred_fulfillment: fulfillmentSchema.optional(),
  patient_comment: z.string().trim().min(1).nullable().optional(),
  status: refillRequestStatusSchema.optional(),
  submitted_at: isoDateTimeSchema.optional(),
});

export const updateRefillRequestSchema = z
  .object({
    request_scope: requestScopeSchema.optional(),
    requested_by_type: requestedByTypeSchema.optional(),
    requested_by_ref_id: entityIdSchema.nullable().optional(),
    trigger_source: triggerSourceSchema.optional(),
    preferred_fulfillment: fulfillmentSchema.optional(),
    patient_comment: z.string().trim().min(1).nullable().optional(),
    status: refillRequestStatusSchema.optional(),
    triaged_at: isoDateTimeSchema.nullable().optional(),
    reviewed_at: isoDateTimeSchema.nullable().optional(),
    reviewed_by_doctor_id: entityIdSchema.nullable().optional(),
    decision_note: z.string().trim().min(1).nullable().optional(),
    result_prescription_id: entityIdSchema.nullable().optional(),
    submitted_at: isoDateTimeSchema.optional(),
  })
  .superRefine((val, ctx) => {
    if (
      val.reviewed_at != null &&
      val.submitted_at != null &&
      val.reviewed_at < val.submitted_at
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["reviewed_at"],
        message: "reviewed_at must be on or after submitted_at",
      });
    }
  });

export const createRefillRequestItemSchema = z.object({
  refill_request_id: entityIdSchema,
  prescription_item_id: entityIdSchema,
  requested_quantity: optionalPositiveDecimalStringSchema,
  status: refillRequestItemStatusSchema.optional(),
  approved_quantity: optionalPositiveDecimalStringSchema,
  decision_reason: z.string().trim().min(1).nullable().optional(),
});

export const updateRefillRequestItemSchema = createRefillRequestItemSchema
  .partial()
  .omit({ refill_request_id: true, prescription_item_id: true });
