/**
 * Patient-facing refill service.
 *
 * - detectNearDepletion: identify items about to run out
 * - createRefillRequest: patient submits a refill request
 * - getPatientRefillRequests: list the patient's requests with full item detail
 * - cancelRefillRequest: patient cancels a pending request
 */

import type { AnyActorContext } from "@thuocare/auth";
import { requirePatientActor } from "@thuocare/auth";
import type { PrescriptionRow, RefillRequestItemRow, RefillRequestRow } from "@thuocare/contracts";

import type {
  CancelRefillRequestInput,
  CreateRefillRequestInput,
  DetectNearDepletionInput,
} from "../domain/types.js";
import type {
  NearDepletionItemVM,
  RefillRequestItemVM,
  RefillRequestVM,
  SourcePrescriptionSummary,
} from "../domain/view-models.js";
import { RefillError } from "../errors/refill-errors.js";
import type { RefillErrorCode } from "../errors/refill-errors.js";
import {
  REVIEWABLE_STATUSES,
  countApprovedRefillsByPrescriptionItem,
  countPendingRequestsByPrescription,
  findRefillItemsByRequests,
  findRefillRequestById,
  findRefillRequestsByPatient,
  insertRefillRequest,
  insertRefillRequestItems,
  updateRefillRequest,
} from "../repository/refill-repo.js";
import {
  findActiveItemsByPrescription,
  findActiveItemsForDepletionCheck,
  findItemsByIds,
  findPrescriptionById,
  findRefillPoliciesByItems,
} from "../repository/prescription-read-repo.js";
import {
  validateItemRefillState,
  validateRefillEligibility,
} from "../validation/refill-policy-validator.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowIsoDateTime(): string {
  return new Date().toISOString().slice(0, 19);
}

function daysDiff(dateA: string, dateB: string): number {
  return Math.round(
    (new Date(`${dateB}T00:00:00`).getTime() - new Date(`${dateA}T00:00:00`).getTime()) /
      86_400_000,
  );
}

function eligibilityReasonToCode(reason: string | undefined): RefillErrorCode {
  switch (reason) {
    case "refill_not_allowed":   return "refill_not_allowed";
    case "max_refills_reached":  return "max_refills_reached";
    case "too_early_to_refill":  return "too_early_to_refill";
    case "refill_policy_expired": return "refill_policy_expired";
    default: return "prescription_item_not_eligible";
  }
}

function toSourcePrescriptionSummary(p: PrescriptionRow): SourcePrescriptionSummary {
  return {
    prescriptionId: p.id,
    prescriptionKind: p.prescription_kind,
    effectiveFrom: p.effective_from,
    effectiveTo: p.effective_to ?? null,
  };
}

function toItemVM(item: RefillRequestItemRow): RefillRequestItemVM {
  return {
    id: item.id,
    prescriptionItemId: item.prescription_item_id,
    medicationName: "",   // enriched below when medication data is available
    strengthText: "",
    frequencyText: "",
    daysSupply: 0,
    status: item.status,
    requestedQuantity: item.requested_quantity,
    approvedQuantity: item.approved_quantity,
    decisionReason: item.decision_reason,
  };
}

// ─── Near depletion detection ─────────────────────────────────────────────────

/**
 * Identify active refillable items that are within `thresholdDays` of running out.
 * Uses simple date arithmetic: daysRemaining = days_supply - days_elapsed.
 * Does not use adherence log data (MVP).
 *
 * @param actorCtx  Must be a patient actor.
 */
export async function detectNearDepletion(
  client: AnyClient,
  actorCtx: AnyActorContext,
  input: DetectNearDepletionInput,
): Promise<NearDepletionItemVM[]> {
  const actor = requirePatientActor(actorCtx);

  if (actor.patientId !== input.patientId) {
    throw new RefillError("patient_mismatch", "Cannot check depletion for another patient");
  }

  const threshold = input.thresholdDays ?? 3;
  const today = todayIsoDate();

  const items = await findActiveItemsForDepletionCheck(client, input.patientId);

  const near: NearDepletionItemVM[] = [];

  for (const item of items) {
    if (
      item.prescriptionStatus !== "active" &&
      item.prescriptionStatus !== "issued"
    ) {
      continue;
    }

    const daysElapsed = daysDiff(item.startDate, today);
    const daysRemaining = Math.max(0, item.daysSupply - daysElapsed);

    if (daysRemaining <= threshold) {
      const medicationName = item.brandName
        ? `${item.genericName} (${item.brandName})`
        : item.genericName;

      near.push({
        prescriptionItemId: item.itemId,
        prescriptionId: item.prescriptionId,
        treatmentEpisodeId: item.treatmentEpisodeId,
        organizationId: item.organizationId,
        medicationName,
        strengthText: item.strengthText,
        frequencyText: item.frequencyText,
        daysRemaining,
        daysSupply: item.daysSupply,
        startDate: item.startDate,
        isRefillable: item.isRefillable,
        refillMode: item.refillMode,
      });
    }
  }

  near.sort((a, b) => a.daysRemaining - b.daysRemaining);
  return near;
}

// ─── Create refill request ────────────────────────────────────────────────────

/**
 * Submit a refill request.
 *
 * Guards:
 * - Patient actor only
 * - Prescription must be active and belong to patient
 * - No existing pending request for this prescription
 * - Each item must be active, refillable, and within policy limits
 */
export async function createRefillRequest(
  client: AnyClient,
  actorCtx: AnyActorContext,
  input: CreateRefillRequestInput,
): Promise<RefillRequestRow> {
  const actor = requirePatientActor(actorCtx);

  if (actor.patientId !== input.patientId) {
    throw new RefillError("patient_mismatch");
  }

  const today = todayIsoDate();

  // Validate prescription
  const prescription = await findPrescriptionById(client, input.sourcePrescriptionId);
  if (!prescription) throw new RefillError("prescription_not_found");
  if (prescription.patient_id !== input.patientId) throw new RefillError("patient_mismatch");
  if (prescription.organization_id !== input.organizationId) throw new RefillError("org_mismatch");
  if (prescription.treatment_episode_id !== input.treatmentEpisodeId) {
    throw new RefillError("org_mismatch", "Refill request episode does not match source prescription");
  }
  if (prescription.status !== "active" && prescription.status !== "issued") {
    throw new RefillError("prescription_not_active", `Status is '${prescription.status}'`);
  }

  // No duplicate pending request
  const pending = await countPendingRequestsByPrescription(client, input.sourcePrescriptionId);
  if (pending > 0) {
    throw new RefillError("duplicate_pending_request");
  }

  // Resolve items
  let items;
  if (
    input.scope === "selected_items" &&
    input.selectedItemIds &&
    input.selectedItemIds.length > 0
  ) {
    items = await findItemsByIds(client, input.selectedItemIds);
    for (const item of items) {
      if (item.prescription_id !== input.sourcePrescriptionId) {
        throw new RefillError("prescription_item_not_found", `Item ${item.id} not in this prescription`);
      }
    }
  } else {
    items = await findActiveItemsByPrescription(client, input.sourcePrescriptionId);
  }

  if (items.length === 0) {
    throw new RefillError("prescription_item_not_found", "No active items found");
  }

  // Validate each item against its policy
  const itemIds = items.map((it) => it.id);
  const policies = await findRefillPoliciesByItems(client, itemIds);
  const policyByItemId = new Map(policies.map((p) => [p.prescription_item_id, p]));

  for (const item of items) {
    const stateCheck = validateItemRefillState(item);
    if (!stateCheck.eligible) {
      throw new RefillError("prescription_item_not_eligible", `Item ${item.id}: ${stateCheck.reason}`);
    }

    const policy = policyByItemId.get(item.id) ?? null;
    const approvedCount = await countApprovedRefillsByPrescriptionItem(client, item.id);

    const eligibility = validateRefillEligibility({ policy, approvedRefillCount: approvedCount, today });
    if (!eligibility.eligible) {
      throw new RefillError(
        eligibilityReasonToCode(eligibility.reason),
        `Item ${item.id}: ${eligibility.reason}`,
      );
    }
  }

  // Persist
  const refillRequest = await insertRefillRequest(client, {
    organization_id: input.organizationId,
    patient_id: input.patientId,
    treatment_episode_id: input.treatmentEpisodeId,
    request_scope: input.scope,
    source_prescription_id: input.sourcePrescriptionId,
    requested_by_type: "patient",
    requested_by_ref_id: actor.patientId,
    trigger_source: input.triggerSource,
    preferred_fulfillment: input.fulfillmentPreference ?? "unspecified",
    patient_comment: input.patientComment ?? null,
    status: "submitted",
    submitted_at: nowIsoDateTime(),
  });

  await insertRefillRequestItems(
    client,
    items.map((item) => ({
      refill_request_id: refillRequest.id,
      prescription_item_id: item.id,
      requested_quantity: null,
      status: "pending" as const,
      approved_quantity: null,
      decision_reason: null,
    })),
  );

  return refillRequest;
}

// ─── Get patient refill requests ──────────────────────────────────────────────

/**
 * List all refill requests for a patient, most recent first.
 * Items are included as minimal VMs (no medication name enrichment in this path).
 *
 * Use the doctor-facing getRefillRequestDetail for full enriched detail.
 */
export async function getPatientRefillRequests(
  client: AnyClient,
  actorCtx: AnyActorContext,
  patientId: string,
): Promise<RefillRequestVM[]> {
  const actor = requirePatientActor(actorCtx);

  if (actor.patientId !== patientId) {
    throw new RefillError("patient_mismatch");
  }

  const requests = await findRefillRequestsByPatient(client, patientId);
  if (requests.length === 0) return [];

  // Batch load items + source prescriptions
  const requestIds = requests.map((r) => r.id);
  const prescriptionIds = [...new Set(requests.map((r) => r.source_prescription_id))];

  const [allItems, sourcePrescriptions] = await Promise.all([
    findRefillItemsByRequests(client, requestIds),
    Promise.all(prescriptionIds.map((id) => findPrescriptionById(client, id))),
  ]);

  const itemsByRequestId = new Map<string, RefillRequestItemRow[]>();
  for (const item of allItems) {
    const existing = itemsByRequestId.get(item.refill_request_id) ?? [];
    existing.push(item);
    itemsByRequestId.set(item.refill_request_id, existing);
  }

  const prescriptionMap = new Map(
    sourcePrescriptions.filter(Boolean).map((p) => [p!.id, p!]),
  );

  return requests.map((req) => {
    const items = itemsByRequestId.get(req.id) ?? [];
    const prescription = prescriptionMap.get(req.source_prescription_id) ?? null;

    return {
      id: req.id,
      status: req.status,
      requestScope: req.request_scope,
      triggerSource: req.trigger_source,
      fulfillmentPreference: req.preferred_fulfillment,
      patientComment: req.patient_comment,
      decisionNote: req.decision_note,
      submittedAt: req.submitted_at,
      reviewedAt: req.reviewed_at,
      reviewedByDoctorId: req.reviewed_by_doctor_id,
      resultPrescriptionId: req.result_prescription_id,
      sourcePrescription: prescription
        ? toSourcePrescriptionSummary(prescription)
        : {
            prescriptionId: req.source_prescription_id,
            prescriptionKind: "unknown",
            effectiveFrom: "",
            effectiveTo: null,
          },
      items: items.map(toItemVM),
    } satisfies RefillRequestVM;
  });
}

// ─── Cancel refill request ────────────────────────────────────────────────────

/**
 * Cancel a pending refill request.
 * Only allowed while the request status is still pending/reviewable.
 */
export async function cancelRefillRequest(
  client: AnyClient,
  actorCtx: AnyActorContext,
  input: CancelRefillRequestInput,
): Promise<RefillRequestRow> {
  const actor = requirePatientActor(actorCtx);

  if (actor.patientId !== input.patientId) {
    throw new RefillError("patient_mismatch");
  }

  const request = await findRefillRequestById(client, input.refillRequestId);
  if (!request) throw new RefillError("request_not_found");
  if (request.patient_id !== input.patientId) throw new RefillError("patient_mismatch");
  if (!(REVIEWABLE_STATUSES as string[]).includes(request.status)) {
    throw new RefillError("request_not_reviewable", `Cannot cancel status '${request.status}'`);
  }

  return updateRefillRequest(client, input.refillRequestId, { status: "cancelled" });
}
