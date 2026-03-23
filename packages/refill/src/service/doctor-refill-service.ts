/**
 * Doctor-facing refill service.
 *
 * - getDoctorRefillQueue: pageable list of pending refill requests
 * - getRefillRequestDetail: full detail view of one request
 * - reviewRefillRequest: approve / reject / require_visit
 *
 * Approval creates a new prescription via @thuocare/prescription and marks
 * the refill request as 'approved' with result_prescription_id set.
 */

import type { AnyActorContext } from "@thuocare/auth";
import { requireDoctorActor } from "@thuocare/auth";
import type { PrescriptionItemRow, RefillRequestItemRow, RefillRequestRow } from "@thuocare/contracts";
import {
  addPrescriptionItem,
  createPrescription,
  FREQUENCY_CODE_VALUES,
  issuePrescription,
} from "@thuocare/prescription";
import type { AddPrescriptionItemInput, FrequencyCode } from "@thuocare/prescription";

import type { ItemDecisionInput, RefillQueueFilters, ReviewRefillRequestInput } from "../domain/types.js";
import type {
  RefillQueueItemVM,
  RefillRequestItemVM,
  RefillRequestVM,
  SourcePrescriptionSummary,
} from "../domain/view-models.js";
import { RefillError } from "../errors/refill-errors.js";
import {
  QUEUE_STATUSES,
  REVIEWABLE_STATUSES,
  countApprovedRefillsByPrescriptionItem,
  findRefillItemsByRequest,
  findRefillItemsByRequests,
  findRefillRequestById,
  findRefillRequestsByOrg,
  updateRefillRequest,
  updateRefillRequestItem,
} from "../repository/refill-repo.js";
import {
  findActiveItemsByPrescription,
  findItemMedicationsForQueue,
  findItemsByIds,
  findPatientNamesByIds,
  findPrescriptionById,
  findRefillPoliciesByItems,
} from "../repository/prescription-read-repo.js";
import { validateRefillEligibility } from "../validation/refill-policy-validator.js";

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

function urgencyLevel(daysUntilDepletion: number | null): "urgent" | "soon" | "normal" {
  if (daysUntilDepletion === null) return "normal";
  if (daysUntilDepletion <= 2)    return "urgent";
  if (daysUntilDepletion <= 5)    return "soon";
  return "normal";
}

function buildMedicationSummary(
  meds: Array<{ generic_name: string; strength_text: string }>,
): string {
  return meds
    .slice(0, 3)
    .map((m) => `${m.generic_name} ${m.strength_text}`)
    .join(", ");
}

function toFrequencyCode(code: string | null): FrequencyCode {
  if (!code) throw new RefillError("item_not_cloneable", "frequency_code is null");
  if (!(FREQUENCY_CODE_VALUES as readonly string[]).includes(code)) {
    throw new RefillError("item_not_cloneable", `Invalid frequency_code: ${code}`);
  }
  return code as FrequencyCode;
}

/** Map a PrescriptionItemRow to AddPrescriptionItemInput for cloning on refill. */
function itemToCloneInput(item: PrescriptionItemRow, startDate: string): AddPrescriptionItemInput {
  return {
    medicationMasterId: item.medication_master_id,
    doseAmount: String(item.dose_amount),
    doseUnit: item.dose_unit,
    route: item.route,
    frequencyCode: toFrequencyCode(item.frequency_code),
    durationDays: item.days_supply,
    timingRelation: item.timing_relation,
    indicationText: item.indication_text ?? null,
    prnFlag: item.prn_flag,
    prnReason: item.prn_reason ?? null,
    startDate,
    isRefillable: item.is_refillable,
    maxRefillsAllowed: item.max_refills_allowed,
    requiresReviewBeforeRefill: item.requires_review_before_refill,
    highRiskReviewFlag: item.high_risk_review_flag,
    instructionLanguage: "vi",
  };
}

function toRefillRequestItemVM(item: RefillRequestItemRow): RefillRequestItemVM {
  return {
    id: item.id,
    prescriptionItemId: item.prescription_item_id,
    medicationName: "",
    strengthText: "",
    frequencyText: "",
    daysSupply: 0,
    status: item.status,
    requestedQuantity: item.requested_quantity,
    approvedQuantity: item.approved_quantity,
    decisionReason: item.decision_reason,
  };
}

// ─── Doctor refill queue ──────────────────────────────────────────────────────

/**
 * Get the doctor's refill review queue — all pending requests for the org.
 *
 * Returned sorted by urgency (most urgent first), then by submitted_at.
 *
 * @param actorCtx  Must be a doctor actor.
 */
export async function getDoctorRefillQueue(
  client: AnyClient,
  actorCtx: AnyActorContext,
  filters?: RefillQueueFilters,
): Promise<RefillQueueItemVM[]> {
  const actor = requireDoctorActor(actorCtx);

  const statuses = filters?.statuses ?? QUEUE_STATUSES;
  const requests = await findRefillRequestsByOrg(client, actor.organizationId, statuses);

  if (requests.length === 0) return [];

  // Batch load: patient names + refill items + medication info
  const patientIds = [...new Set(requests.map((r) => r.patient_id))];
  const requestIds = requests.map((r) => r.id);

  const [patientRows, allRefillItems] = await Promise.all([
    findPatientNamesByIds(client, patientIds),
    findRefillItemsByRequests(client, requestIds),
  ]);

  const patientNameMap = new Map(patientRows.map((p) => [p.id, p.full_name]));

  // Load medication info for all prescription items
  const prescriptionItemIds = [...new Set(allRefillItems.map((ri) => ri.prescription_item_id))];
  const medicationRows = await findItemMedicationsForQueue(client, prescriptionItemIds);
  const medInfoMap = new Map(medicationRows.map((m) => [m.id, m]));

  // Group refill items by request id
  const itemsByRequestId = new Map<string, RefillRequestItemRow[]>();
  for (const item of allRefillItems) {
    const existing = itemsByRequestId.get(item.refill_request_id) ?? [];
    existing.push(item);
    itemsByRequestId.set(item.refill_request_id, existing);
  }

  const today = todayIsoDate();

  const queue: RefillQueueItemVM[] = requests.map((req) => {
    const items = itemsByRequestId.get(req.id) ?? [];

    // Calculate days until depletion (minimum across items)
    let minDaysUntilDepletion: number | null = null;
    const meds: Array<{ generic_name: string; strength_text: string }> = [];

    for (const item of items) {
      const med = medInfoMap.get(item.prescription_item_id);
      if (med) {
        meds.push({ generic_name: med.generic_name, strength_text: med.strength_text });

        const daysElapsed = daysDiff(med.start_date, today);
        const daysRemaining = Math.max(0, med.days_supply - daysElapsed);

        if (minDaysUntilDepletion === null || daysRemaining < minDaysUntilDepletion) {
          minDaysUntilDepletion = daysRemaining;
        }
      }
    }

    const patientName = patientNameMap.get(req.patient_id) ?? "Unknown Patient";

    return {
      requestId: req.id,
      patientId: req.patient_id,
      patientName,
      submittedAt: req.submitted_at,
      status: req.status,
      triggerSource: req.trigger_source,
      daysUntilDepletion: minDaysUntilDepletion,
      urgencyLevel: urgencyLevel(minDaysUntilDepletion),
      medicationSummary: buildMedicationSummary(meds),
      itemCount: items.length,
    };
  });

  // Sort: urgent first, then by submitted_at desc
  const urgencyOrder = { urgent: 0, soon: 1, normal: 2 };
  queue.sort((a, b) => {
    const diff = urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel];
    if (diff !== 0) return diff;
    return b.submittedAt.localeCompare(a.submittedAt);
  });

  return queue;
}

// ─── Get refill request detail ────────────────────────────────────────────────

/**
 * Load full detail for a refill request including enriched item info.
 * Accessible to doctor and staff.
 *
 * @param actorCtx  Must be a doctor actor.
 */
export async function getRefillRequestDetail(
  client: AnyClient,
  actorCtx: AnyActorContext,
  refillRequestId: string,
): Promise<RefillRequestVM> {
  const actor = requireDoctorActor(actorCtx);

  const request = await findRefillRequestById(client, refillRequestId);
  if (!request) throw new RefillError("request_not_found");
  if (request.organization_id !== actor.organizationId) throw new RefillError("org_mismatch");

  const [items, prescription] = await Promise.all([
    findRefillItemsByRequest(client, refillRequestId),
    findPrescriptionById(client, request.source_prescription_id),
  ]);

  // Enrich items with medication info
  const prescriptionItemIds = items.map((it) => it.prescription_item_id);
  const medRows = await findItemMedicationsForQueue(client, prescriptionItemIds);
  const medMap = new Map(medRows.map((m) => [m.id, m]));

  const itemVMs: RefillRequestItemVM[] = items.map((item) => {
    const med = medMap.get(item.prescription_item_id);
    return {
      id: item.id,
      prescriptionItemId: item.prescription_item_id,
      medicationName: med
        ? `${med.generic_name}${med.brand_name ? ` (${med.brand_name})` : ""}`
        : "Unknown",
      strengthText: med?.strength_text ?? "",
      frequencyText: "",   // not in our lightweight query — add if needed
      daysSupply: med?.days_supply ?? 0,
      status: item.status,
      requestedQuantity: item.requested_quantity,
      approvedQuantity: item.approved_quantity,
      decisionReason: item.decision_reason,
    };
  });

  const sourcePrescription: SourcePrescriptionSummary = prescription
    ? {
        prescriptionId: prescription.id,
        prescriptionKind: prescription.prescription_kind,
        effectiveFrom: prescription.effective_from,
        effectiveTo: prescription.effective_to ?? null,
      }
    : {
        prescriptionId: request.source_prescription_id,
        prescriptionKind: "unknown",
        effectiveFrom: "",
        effectiveTo: null,
      };

  return {
    id: request.id,
    status: request.status,
    requestScope: request.request_scope,
    triggerSource: request.trigger_source,
    fulfillmentPreference: request.preferred_fulfillment,
    patientComment: request.patient_comment,
    decisionNote: request.decision_note,
    submittedAt: request.submitted_at,
    reviewedAt: request.reviewed_at,
    reviewedByDoctorId: request.reviewed_by_doctor_id,
    resultPrescriptionId: request.result_prescription_id,
    sourcePrescription,
    items: itemVMs,
  };
}

// ─── Review refill request ────────────────────────────────────────────────────

/**
 * Doctor approves, rejects, or requires a visit for a refill request.
 *
 * APPROVAL flow:
 *  1. Re-validates refill policies (safety net)
 *  2. Creates a new prescription (clone of source, kind = 'renewal')
 *  3. Adds approved items to the new prescription
 *  4. Issues the new prescription
 *  5. Updates the refill request status → 'approved' + result_prescription_id
 *  6. Updates refill_request_items statuses
 *
 * REJECTION flow:
 *  Updates status → 'rejected', items → 'rejected'
 *
 * REQUIRE_VISIT flow:
 *  Updates status → 'appointment_required', items → 'visit_required'
 *
 * @param actorCtx  Must be a doctor actor.
 */
export async function reviewRefillRequest(
  client: AnyClient,
  actorCtx: AnyActorContext,
  input: ReviewRefillRequestInput,
): Promise<RefillRequestRow> {
  const actor = requireDoctorActor(actorCtx);

  const request = await findRefillRequestById(client, input.refillRequestId);
  if (!request) throw new RefillError("request_not_found");
  if (request.organization_id !== actor.organizationId) throw new RefillError("org_mismatch");
  if (!(REVIEWABLE_STATUSES as string[]).includes(request.status)) {
    throw new RefillError("request_not_reviewable", `Status is '${request.status}'`);
  }

  const today = todayIsoDate();
  const nowDt = nowIsoDateTime();

  const refillItems = await findRefillItemsByRequest(client, input.refillRequestId);

  // ── Approve ──────────────────────────────────────────────────────────────
  if (input.decision === "approve") {
    return approveRefill(client, actorCtx, { request, refillItems, input, today, nowDt });
  }

  // ── Reject ───────────────────────────────────────────────────────────────
  if (input.decision === "reject") {
    await Promise.all(
      refillItems.map((item) =>
        updateRefillRequestItem(client, item.id, {
          status: "rejected",
          decision_reason: input.decisionNote ?? null,
        }),
      ),
    );
    return updateRefillRequest(client, request.id, {
      status: "rejected",
      reviewed_at: nowDt,
      reviewed_by_doctor_id: actor.doctorProfileId,
      decision_note: input.decisionNote ?? null,
    });
  }

  // ── Require visit ─────────────────────────────────────────────────────────
  await Promise.all(
    refillItems.map((item) =>
      updateRefillRequestItem(client, item.id, {
        status: "visit_required",
        decision_reason: input.decisionNote ?? null,
      }),
    ),
  );
  return updateRefillRequest(client, request.id, {
    status: "appointment_required",
    reviewed_at: nowDt,
    reviewed_by_doctor_id: actor.doctorProfileId,
    decision_note: input.decisionNote ?? null,
  });
}

// ─── Approval implementation ──────────────────────────────────────────────────

async function approveRefill(
  client: AnyClient,
  actorCtx: AnyActorContext,
  params: {
    request: RefillRequestRow;
    refillItems: RefillRequestItemRow[];
    input: ReviewRefillRequestInput;
    today: string;
    nowDt: string;
  },
): Promise<RefillRequestRow> {
  const actor = requireDoctorActor(actorCtx);
  const { request, refillItems, input, today, nowDt } = params;

  // Load source prescription for cloning
  const sourcePrescription = await findPrescriptionById(client, request.source_prescription_id);
  if (!sourcePrescription) throw new RefillError("prescription_not_found");

  // Determine which items to approve
  const itemDecisionMap = new Map<string, ItemDecisionInput>(
    (input.itemDecisions ?? []).map((d) => [d.prescriptionItemId, d]),
  );

  // Load actual PrescriptionItemRows for items being approved
  const approvedItemIds = refillItems
    .filter((ri) => {
      const decision = itemDecisionMap.get(ri.prescription_item_id);
      // If no explicit item decisions, approve all pending items
      return !input.itemDecisions || (decision && decision.status === "approved");
    })
    .map((ri) => ri.prescription_item_id);

  if (approvedItemIds.length === 0) {
    throw new RefillError("prescription_item_not_found", "No items approved in this refill");
  }

  const sourceItems =
    input.scope === "full_prescription"
      ? await findActiveItemsByPrescription(client, sourcePrescription.id)
      : await findItemsByIds(client, approvedItemIds);

  const itemsToClone = sourceItems.filter((it) => approvedItemIds.includes(it.id));

  if (itemsToClone.length === 0) {
    throw new RefillError("prescription_item_not_found", "No matching source items to clone");
  }

  // Re-validate refill policies (safety net — don't rely on prior validation alone)
  const policies = await findRefillPoliciesByItems(client, itemsToClone.map((it) => it.id));
  const policyByItemId = new Map(policies.map((p) => [p.prescription_item_id, p]));

  for (const item of itemsToClone) {
    const policy = policyByItemId.get(item.id) ?? null;
    const approvedCount = await countApprovedRefillsByPrescriptionItem(client, item.id);

    const eligibility = validateRefillEligibility({
      policy,
      approvedRefillCount: approvedCount,
      today,
    });

    if (!eligibility.eligible) {
      throw new RefillError(
        "refill_not_allowed",
        `Item ${item.id} failed re-validation: ${eligibility.reason}`,
      );
    }
  }

  // Create the new renewal prescription
  const newPrescription = await createPrescription(client, actorCtx, {
    patientId: sourcePrescription.patient_id,
    treatmentEpisodeId: sourcePrescription.treatment_episode_id,
    prescriptionKind: "renewal",
    issueSource: "refill_process",
    effectiveFrom: today,
    parentPrescriptionId: sourcePrescription.id,
    encounterId: null,
    doctorId: actor.doctorProfileId,
    clinicalNote: input.decisionNote ?? null,
  });

  // Add each approved item to the new prescription
  for (const item of itemsToClone) {
    await addPrescriptionItem(client, actorCtx, newPrescription.id, itemToCloneInput(item, today));
  }

  // Issue the new prescription
  await issuePrescription(client, actorCtx, newPrescription.id);

  // Update refill_request_items
  await Promise.all(
    refillItems.map((ri) => {
      const decision = itemDecisionMap.get(ri.prescription_item_id);
      const isApproved = approvedItemIds.includes(ri.prescription_item_id);
      const newStatus = isApproved ? "approved" : "rejected";
      return updateRefillRequestItem(client, ri.id, {
        status: newStatus,
        approved_quantity: isApproved ? (decision?.approvedQuantity ?? null) : null,
        decision_reason: decision?.decisionReason ?? (isApproved ? null : "Not included in approval"),
      });
    }),
  );

  // Update refill_request
  return updateRefillRequest(client, request.id, {
    status: "approved",
    reviewed_at: nowDt,
    reviewed_by_doctor_id: actor.doctorProfileId,
    decision_note: input.decisionNote ?? null,
    result_prescription_id: newPrescription.id,
  });
}

// ─── Internal: scope helper ───────────────────────────────────────────────────

// The input.scope field isn't on ReviewRefillRequestInput but comes from the source request.
// We extend ReviewRefillRequestInput with the resolved scope from the request row.
declare module "../domain/types.js" {
  interface ReviewRefillRequestInput {
    /** Internal: resolved from request.request_scope during approval. */
    scope?: import("@thuocare/contracts").RequestScope;
  }
}
