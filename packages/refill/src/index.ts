/**
 * @thuocare/refill
 *
 * Refill Request & Processing Engine for the Prescription-to-Adherence Platform.
 *
 * QUICK REFERENCE:
 *
 * 1. Detect near depletion (patient):
 *    ```ts
 *    import { detectNearDepletion } from "@thuocare/refill";
 *    const items = await detectNearDepletion(supabase, actorCtx, {
 *      patientId,
 *      thresholdDays: 3,
 *    });
 *    ```
 *
 * 2. Submit a refill request (patient):
 *    ```ts
 *    import { createRefillRequest } from "@thuocare/refill";
 *    const request = await createRefillRequest(supabase, actorCtx, {
 *      patientId,
 *      organizationId,
 *      treatmentEpisodeId,
 *      sourcePrescriptionId,
 *      scope: "full_prescription",
 *      triggerSource: "manual_request",
 *    });
 *    ```
 *
 * 3. Get refill queue (doctor):
 *    ```ts
 *    import { getDoctorRefillQueue } from "@thuocare/refill";
 *    const queue = await getDoctorRefillQueue(supabase, actorCtx);
 *    ```
 *
 * 4. Approve a refill request (doctor):
 *    ```ts
 *    import { reviewRefillRequest } from "@thuocare/refill";
 *    const updated = await reviewRefillRequest(supabase, actorCtx, {
 *      refillRequestId,
 *      decision: "approve",
 *      decisionNote: "Approved as requested",
 *    });
 *    ```
 *
 * 5. Reject a refill request (doctor):
 *    ```ts
 *    const updated = await reviewRefillRequest(supabase, actorCtx, {
 *      refillRequestId,
 *      decision: "reject",
 *      decisionNote: "Please schedule a visit first.",
 *    });
 *    ```
 */

// ─── Errors ───────────────────────────────────────────────────────────────────
export type { RefillErrorCode } from "./errors/refill-errors.js";
export { RefillError, isRefillError } from "./errors/refill-errors.js";

// ─── Domain types ─────────────────────────────────────────────────────────────
export type {
  CancelRefillRequestInput,
  CreateRefillRequestInput,
  DetectNearDepletionInput,
  ItemDecisionInput,
  RefillEligibilityResult,
  RefillIneligibilityReason,
  RefillQueueFilters,
  ReviewRefillRequestInput,
} from "./domain/types.js";

// ─── View model types ─────────────────────────────────────────────────────────
export type {
  NearDepletionItemVM,
  RefillQueueItemVM,
  RefillRequestItemVM,
  RefillRequestVM,
  SourcePrescriptionSummary,
} from "./domain/view-models.js";

// ─── Validation (exported for testing and custom rules) ───────────────────────
export {
  validateRefillEligibility,
  validateItemRefillState,
} from "./validation/refill-policy-validator.js";
export type { ValidateRefillInput } from "./validation/refill-policy-validator.js";

// ─── Patient-facing service ───────────────────────────────────────────────────
export {
  cancelRefillRequest,
  createRefillRequest,
  detectNearDepletion,
  getPatientRefillRequests,
} from "./service/patient-refill-service.js";

// ─── Doctor-facing service ────────────────────────────────────────────────────
export {
  getDoctorRefillQueue,
  getRefillRequestDetail,
  reviewRefillRequest,
} from "./service/doctor-refill-service.js";
