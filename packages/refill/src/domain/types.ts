/**
 * Service-layer input/output types for the refill module.
 *
 * Raw DB row types live in @thuocare/contracts.
 * These are the ergonomic types callers use.
 */

import type {
  EntityId,
  FulfillmentPreference,
  RefillRequestItemStatus,
  RefillRequestStatus,
  RefillTriggerSource,
  RequestScope,
} from "@thuocare/contracts";

// ─── Patient-facing inputs ────────────────────────────────────────────────────

export interface CreateRefillRequestInput {
  patientId: EntityId;
  organizationId: EntityId;
  treatmentEpisodeId: EntityId;
  sourcePrescriptionId: EntityId;
  /**
   * Which items to include.
   * 'full_prescription' = all active items on the prescription.
   * 'selected_items' = only the listed itemIds.
   */
  scope: RequestScope;
  /** Required when scope = 'selected_items'. */
  selectedItemIds?: EntityId[];
  triggerSource: RefillTriggerSource;
  fulfillmentPreference?: FulfillmentPreference;
  patientComment?: string | null;
}

export interface CancelRefillRequestInput {
  refillRequestId: EntityId;
  patientId: EntityId;
}

// ─── Doctor-facing inputs ─────────────────────────────────────────────────────

export interface ReviewRefillRequestInput {
  refillRequestId: EntityId;
  decision: "approve" | "reject" | "require_visit";
  decisionNote?: string | null;
  /**
   * Per-item decisions. Required when decision = 'approve' to control which
   * items are approved and what quantities are dispensed.
   * If omitted on approve, all pending items are approved as-is.
   */
  itemDecisions?: ItemDecisionInput[];
}

export interface ItemDecisionInput {
  prescriptionItemId: EntityId;
  status: RefillRequestItemStatus;
  approvedQuantity?: string | null;
  decisionReason?: string | null;
}

export interface RefillQueueFilters {
  /** Filter to requests assigned to a specific doctor. Not set = all doctors. */
  doctorId?: EntityId;
  statuses?: RefillRequestStatus[];
}

// ─── Near depletion ───────────────────────────────────────────────────────────

export interface DetectNearDepletionInput {
  patientId: EntityId;
  /**
   * Number of days remaining below which an item is flagged.
   * Default: 3.
   */
  thresholdDays?: number;
}

// ─── Validation result ────────────────────────────────────────────────────────

export type RefillIneligibilityReason =
  | "refill_not_allowed"
  | "max_refills_reached"
  | "too_early_to_refill"
  | "refill_policy_expired";

export interface RefillEligibilityResult {
  eligible: boolean;
  reason?: RefillIneligibilityReason;
}
