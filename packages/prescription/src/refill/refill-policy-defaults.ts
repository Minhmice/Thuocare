/**
 * Refill policy snapshot builder.
 *
 * Generates the `CreateRefillPolicySnapshotInput` that gets persisted to
 * `refill_policy_snapshot` when a prescription item is created.
 *
 * WHY SNAPSHOT:
 * The refill policy is captured at prescription time, not at refill time.
 * This means even if the organization's default policy changes later, the
 * existing prescriptions retain the policy that was in place when they were issued.
 * This is medically correct — a doctor's dispensing intent must be preserved.
 *
 * POLICY DERIVATION LOGIC:
 *   1. isRefillable = false                → not_allowed
 *   2. highRiskReviewFlag = true           → appointment_required (most restrictive)
 *   3. requiresReviewBeforeRefill = true   → doctor_review_required
 *   4. explicitRefillMode is set           → use it
 *   5. default                             → patient_request_allowed
 */

import type { CreateRefillPolicySnapshotInput, RefillMode } from "@thuocare/contracts";
import type { EntityId, IsoDate } from "@thuocare/contracts";

export interface BuildRefillPolicyInput {
  prescriptionItemId: EntityId;
  isRefillable: boolean;
  maxRefillsAllowed: number;
  requiresReviewBeforeRefill: boolean;
  highRiskReviewFlag: boolean;
  durationDays: number;
  startDate: IsoDate;
  /** Explicit refill mode — if provided, overrides derivation logic (except not_allowed). */
  explicitRefillMode?: RefillMode;
}

/**
 * Build the default refill policy snapshot for a prescription item.
 *
 * This function is deterministic: the same inputs always produce the same policy.
 */
export function buildRefillPolicySnapshot(
  input: BuildRefillPolicyInput,
): CreateRefillPolicySnapshotInput {
  const refillMode = deriveRefillMode(input);

  if (refillMode === "not_allowed") {
    return {
      prescription_item_id: input.prescriptionItemId,
      refill_mode: "not_allowed",
      max_refills_allowed: 0,
      min_days_between_refills: null,
      earliest_refill_ratio: null,
      review_required_after_date: null,
      absolute_expiry_date: null,
      late_refill_escalation_after_days: null,
      notes: null,
    };
  }

  // Minimum days between refills = 80% of the supply duration.
  // A patient shouldn't refill before 80% of the last supply is consumed.
  const minDaysBetweenRefills = Math.floor(input.durationDays * 0.8);

  // Earliest refill ratio — allow refill request when 80% consumed.
  const earliestRefillRatio = "0.8000";

  // Absolute expiry: start_date + durationDays × (maxRefills+1) × 1.2 (with 20% buffer).
  const absoluteExpiryDays = Math.ceil(
    input.durationDays * (input.maxRefillsAllowed + 1) * 1.2,
  );
  const absoluteExpiryDate = addDays(input.startDate, absoluteExpiryDays);

  return {
    prescription_item_id: input.prescriptionItemId,
    refill_mode: refillMode,
    max_refills_allowed: input.maxRefillsAllowed,
    min_days_between_refills: minDaysBetweenRefills > 0 ? minDaysBetweenRefills : null,
    earliest_refill_ratio: earliestRefillRatio,
    review_required_after_date: null,
    absolute_expiry_date: absoluteExpiryDate,
    late_refill_escalation_after_days: 7,
    notes: null,
  };
}

function deriveRefillMode(input: BuildRefillPolicyInput): RefillMode {
  if (!input.isRefillable) return "not_allowed";
  // Explicit mode can override derivation
  if (input.explicitRefillMode && input.explicitRefillMode !== "not_allowed") {
    return input.explicitRefillMode;
  }
  // High-risk drugs require an appointment before refill (most restrictive)
  if (input.highRiskReviewFlag) return "appointment_required";
  // Items that require review go through doctor review
  if (input.requiresReviewBeforeRefill) return "doctor_review_required";
  // Standard refillable item
  return "patient_request_allowed";
}

function addDays(isoDate: IsoDate, days: number): IsoDate {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
