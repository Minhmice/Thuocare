/**
 * Refill eligibility validation.
 *
 * Pure functions — no DB calls.
 * Encapsulates the policy rules that gate whether an item can be refilled.
 */

import type { RefillPolicySnapshotRow } from "@thuocare/contracts";
import type { RefillEligibilityResult } from "../domain/types.js";

// ─── Date helpers ─────────────────────────────────────────────────────────────

function daysDiff(dateA: string, dateB: string): number {
  const msPerDay = 86_400_000;
  return Math.round(
    (new Date(`${dateB}T00:00:00`).getTime() - new Date(`${dateA}T00:00:00`).getTime()) /
      msPerDay,
  );
}

// ─── Validator ────────────────────────────────────────────────────────────────

export interface ValidateRefillInput {
  policy: RefillPolicySnapshotRow | null;
  /** Number of times this item has already been approved for refill. */
  approvedRefillCount: number;
  /** Today's date as YYYY-MM-DD. */
  today: string;
  /**
   * Date of the last approved refill for this item (YYYY-MM-DD).
   * Null if no prior refill has been approved.
   */
  lastApprovedRefillDate?: string | null;
}

/**
 * Validate whether an item is eligible to be refilled.
 *
 * Checks (in order):
 *  1. refill_mode must not be 'not_allowed'
 *  2. approvedRefillCount < policy.max_refills_allowed
 *  3. absolute_expiry_date not exceeded
 *  4. min_days_between_refills satisfied (if lastApprovedRefillDate provided)
 *
 * Returns { eligible: true } or { eligible: false, reason }.
 */
export function validateRefillEligibility(
  input: ValidateRefillInput,
): RefillEligibilityResult {
  const { policy, approvedRefillCount, today, lastApprovedRefillDate } = input;

  // No policy means no refill allowed
  if (!policy) {
    return { eligible: false, reason: "refill_not_allowed" };
  }

  // 1. refill_mode check
  if (policy.refill_mode === "not_allowed") {
    return { eligible: false, reason: "refill_not_allowed" };
  }

  // 2. Max refills check
  if (approvedRefillCount >= policy.max_refills_allowed) {
    return { eligible: false, reason: "max_refills_reached" };
  }

  // 3. Absolute expiry date
  if (policy.absolute_expiry_date && today > policy.absolute_expiry_date) {
    return { eligible: false, reason: "refill_policy_expired" };
  }

  // 4. Minimum days between refills
  if (
    policy.min_days_between_refills !== null &&
    lastApprovedRefillDate
  ) {
    const daysSinceLastRefill = daysDiff(lastApprovedRefillDate, today);
    if (daysSinceLastRefill < policy.min_days_between_refills) {
      return { eligible: false, reason: "too_early_to_refill" };
    }
  }

  return { eligible: true };
}

/**
 * Validate that a prescription item itself (not its policy) is in a valid
 * state for refill.
 */
export function validateItemRefillState(item: {
  status: string;
  is_refillable: boolean;
  prn_flag: boolean;
}): RefillEligibilityResult {
  if (item.status !== "active") {
    return { eligible: false };
  }
  if (!item.is_refillable) {
    return { eligible: false, reason: "refill_not_allowed" };
  }
  return { eligible: true };
}
