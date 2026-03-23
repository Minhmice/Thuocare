/**
 * View models for the refill request module.
 *
 * These are the data shapes returned to callers.
 */

import type {
  EntityId,
  FulfillmentPreference,
  IsoDate,
  IsoDateTime,
  RefillRequestItemStatus,
  RefillRequestStatus,
  RefillTriggerSource,
  RequestScope,
} from "@thuocare/contracts";

// ─── Patient-facing ───────────────────────────────────────────────────────────

/** One line item within a refill request. */
export interface RefillRequestItemVM {
  id: EntityId;
  prescriptionItemId: EntityId;
  medicationName: string;
  strengthText: string;
  frequencyText: string;
  daysSupply: number;
  status: RefillRequestItemStatus;
  requestedQuantity: string | null;
  approvedQuantity: string | null;
  decisionReason: string | null;
}

/** Full refill request view (patient and doctor). */
export interface RefillRequestVM {
  id: EntityId;
  status: RefillRequestStatus;
  requestScope: RequestScope;
  triggerSource: RefillTriggerSource;
  fulfillmentPreference: FulfillmentPreference;
  patientComment: string | null;
  decisionNote: string | null;
  submittedAt: IsoDateTime;
  reviewedAt: IsoDateTime | null;
  reviewedByDoctorId: EntityId | null;
  resultPrescriptionId: EntityId | null;
  sourcePrescription: SourcePrescriptionSummary;
  items: RefillRequestItemVM[];
}

export interface SourcePrescriptionSummary {
  prescriptionId: EntityId;
  prescriptionKind: string;
  effectiveFrom: IsoDate;
  effectiveTo: IsoDate | null;
}

// ─── Doctor queue ─────────────────────────────────────────────────────────────

/** One row in the doctor's refill review queue. */
export interface RefillQueueItemVM {
  requestId: EntityId;
  patientId: EntityId;
  patientName: string;
  submittedAt: IsoDateTime;
  status: RefillRequestStatus;
  triggerSource: RefillTriggerSource;
  /**
   * Days until the most-depleted item runs out.
   * null when depletion cannot be computed (PRN or missing start_date).
   */
  daysUntilDepletion: number | null;
  /** "urgent" (<= 2 days), "soon" (<= 5 days), "normal" (> 5 days). */
  urgencyLevel: "urgent" | "soon" | "normal";
  /** E.g. "Metformin 500mg, Aspirin 100mg" */
  medicationSummary: string;
  itemCount: number;
}

// ─── Near depletion ───────────────────────────────────────────────────────────

/** One near-depletion item returned to the patient. */
export interface NearDepletionItemVM {
  prescriptionItemId: EntityId;
  prescriptionId: EntityId;
  treatmentEpisodeId: EntityId;
  organizationId: EntityId;
  medicationName: string;
  strengthText: string;
  frequencyText: string;
  daysRemaining: number;
  daysSupply: number;
  startDate: IsoDate;
  isRefillable: boolean;
  refillMode: string | null;
}
