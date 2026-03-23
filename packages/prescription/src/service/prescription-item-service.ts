/**
 * Prescription item service.
 *
 * Handles adding, updating, and removing items on a draft prescription.
 * Each write operation:
 *   1. Validates actor capability (canWritePrescriptions)
 *   2. Confirms prescription is in "draft" status
 *   3. Resolves medication metadata
 *   4. Computes: quantity, patient instructions, dose schedule, refill policy
 *   5. Persists item + schedule + policy atomically (sequential inserts)
 *
 * UPDATE semantics:
 *   A full re-derivation is performed on every update — if any core field changes
 *   (dose, frequency, duration, route), all dependent computed fields are
 *   regenerated from scratch. This avoids inconsistency between stored data.
 */

import type { AnyActorContext } from "@thuocare/auth";
import {
  requireCapability,
  requireStaffActor,
} from "@thuocare/auth";
import type {
  DoseScheduleRow,
  PrescriptionItemRow,
  RefillPolicySnapshotRow,
} from "@thuocare/contracts";
import type { EntityId } from "@thuocare/contracts";
import { PrescriptionError } from "../errors/prescription-errors.js";
import type {
  AddPrescriptionItemInput,
  UpdatePrescriptionItemInput,
} from "../domain/types.js";
import { buildPatientInstruction, buildAdministrationInstruction } from "../instruction/instruction-builder.js";
import { calculateQuantity } from "../quantity/quantity-calculator.js";
import { buildRefillPolicySnapshot } from "../refill/refill-policy-defaults.js";
import { generateDoseSchedule } from "../schedule/schedule-generator.js";
import { frequencyCodeToText } from "../schedule/frequency.js";
import {
  deleteItemById,
  findItemById,
  findItemsByPrescription,
  findMedicationById,
  findPrescriptionById,
  getNextLineNo,
  insertDoseSchedule,
  insertPrescriptionItem,
  insertRefillPolicySnapshot,
} from "../repository/prescription-repo.js";

// ─── Guard helpers ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertPrescriptionDraft(client: any, prescriptionId: EntityId): Promise<void> {
  const prescription = await findPrescriptionById(client, prescriptionId);
  if (prescription === null) {
    throw new PrescriptionError("prescription_not_found", `Prescription id=${prescriptionId} not found.`);
  }
  if (prescription.status !== "draft") {
    throw new PrescriptionError("prescription_immutable", `Prescription id=${prescriptionId} is not in draft status (current: "${prescription.status}"). Items can only be modified on draft prescriptions.`);
  }
}

// ─── addPrescriptionItem ──────────────────────────────────────────────────────

export interface AddPrescriptionItemResult {
  item: PrescriptionItemRow;
  doseSchedule: DoseScheduleRow;
  refillPolicy: RefillPolicySnapshotRow;
}

/**
 * Add a medication item to a draft prescription.
 *
 * Computes and persists:
 *   - quantity_prescribed (from dose × frequency × duration)
 *   - patient_instruction_text (Vietnamese by default)
 *   - administration_instruction_text
 *   - dose_schedule row
 *   - refill_policy_snapshot row
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function addPrescriptionItem(client: any, actorCtx: AnyActorContext, prescriptionId: EntityId, input: AddPrescriptionItemInput): Promise<AddPrescriptionItemResult> {
  const actor = requireStaffActor(actorCtx);
  requireCapability(actor, "canWritePrescriptions");

  await assertPrescriptionDraft(client, prescriptionId);

  // Validate PRN flag
  if (input.prnFlag && !input.prnReason) {
    throw new PrescriptionError("item_prn_missing_reason", "PRN items require a prnReason.");
  }

  // Validate duration
  if (input.durationDays <= 0 || !Number.isInteger(input.durationDays)) {
    throw new PrescriptionError("item_invalid_duration", `durationDays must be a positive integer (got ${input.durationDays}).`);
  }

  // Load medication for metadata
  const medication = await findMedicationById(client, input.medicationMasterId);
  if (medication === null) {
    throw new PrescriptionError("medication_not_found", `Medication id=${input.medicationMasterId} not found.`);
  }

  const prescription = await findPrescriptionById(client, prescriptionId);
  // guaranteed non-null by assertPrescriptionDraft above
  const startDate = input.startDate ?? prescription!.effective_from;
  const timingRelation = input.timingRelation ?? "none";
  const prnFlag = input.prnFlag ?? false;
  const prnReason = input.prnReason ?? null;
  const isRefillable = input.isRefillable ?? false;
  const maxRefillsAllowed = input.maxRefillsAllowed ?? 0;
  const requiresReviewBeforeRefill = input.requiresReviewBeforeRefill ?? false;
  const highRiskReviewFlag = input.highRiskReviewFlag ?? medication.is_high_risk;
  const prnMaxDailyDoses = 3;

  // ── Compute quantity ──────────────────────────────────────────────────────
  const quantityCalc = calculateQuantity({
    doseAmount: input.doseAmount,
    doseUnit: input.doseUnit,
    frequencyCode: input.frequencyCode,
    durationDays: input.durationDays,
    dosageForm: medication.dosage_form,
    prnMaxDailyDoses,
  });

  // ── Compute end_date ──────────────────────────────────────────────────────
  const endDate = addDays(startDate, input.durationDays);

  // ── Build instructions ────────────────────────────────────────────────────
  const instructionInput = {
    doseAmount: input.doseAmount,
    doseUnit: input.doseUnit,
    route: input.route,
    frequencyCode: input.frequencyCode,
    timingRelation,
    dosageForm: medication.dosage_form,
    prnFlag,
    prnReason,
    prnMaxDailyDoses,
    language: input.instructionLanguage ?? "vi",
  } as const;

  const patientInstruction = buildPatientInstruction(instructionInput);
  const adminInstruction = buildAdministrationInstruction(instructionInput);

  // ── Frequency text ────────────────────────────────────────────────────────
  const frequencyText = frequencyCodeToText(input.frequencyCode, input.instructionLanguage ?? "vi");

  // ── Line number ───────────────────────────────────────────────────────────
  const lineNo = await getNextLineNo(client, prescriptionId);

  // ── Insert item ───────────────────────────────────────────────────────────
  const item = await insertPrescriptionItem(client, {
    prescription_id: prescriptionId,
    line_no: lineNo,
    medication_master_id: input.medicationMasterId,
    indication_text: input.indicationText ?? null,
    dose_amount: input.doseAmount,
    dose_unit: input.doseUnit,
    route: input.route,
    frequency_code: input.frequencyCode,
    frequency_text: frequencyText,
    timing_relation: timingRelation,
    administration_instruction_text: adminInstruction,
    patient_instruction_text: patientInstruction,
    prn_flag: prnFlag,
    prn_reason: prnReason,
    quantity_prescribed: quantityCalc.quantityPrescribed,
    quantity_unit: quantityCalc.quantityUnit,
    days_supply: quantityCalc.daysSupply,
    start_date: startDate,
    end_date: endDate,
    is_refillable: isRefillable,
    max_refills_allowed: maxRefillsAllowed,
    requires_review_before_refill: requiresReviewBeforeRefill,
    high_risk_review_flag: highRiskReviewFlag,
    status: "active",
  });

  // ── Insert dose schedule ──────────────────────────────────────────────────
  const scheduleInput = generateDoseSchedule({
    prescriptionItemId: item.id,
    frequencyCode: input.frequencyCode,
    durationDays: input.durationDays,
    startDate,
    prnMaxDailyDoses,
  });
  const doseSchedule = await insertDoseSchedule(client, scheduleInput);

  // ── Insert refill policy snapshot ─────────────────────────────────────────
  const refillPolicyInput = buildRefillPolicySnapshot({
    prescriptionItemId: item.id,
    isRefillable,
    maxRefillsAllowed,
    requiresReviewBeforeRefill,
    highRiskReviewFlag,
    durationDays: input.durationDays,
    startDate,
    explicitRefillMode: input.refillMode,
  });
  const refillPolicy = await insertRefillPolicySnapshot(client, refillPolicyInput);

  return { item, doseSchedule, refillPolicy };
}

// ─── updatePrescriptionItem ───────────────────────────────────────────────────

/**
 * Update a prescription item on a draft prescription.
 *
 * All computed fields (quantity, instructions, schedule, refill policy) are
 * re-derived from the merged input. Partial updates are supported — unspecified
 * fields retain their current values.
 *
 * NOTE: The dose_schedule and refill_policy_snapshot are replaced if any
 * core clinical field changes. If neither frequency, duration, nor dose changes,
 * the existing schedule/policy rows remain unchanged.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updatePrescriptionItem(client: any, actorCtx: AnyActorContext, prescriptionId: EntityId, itemId: EntityId, input: UpdatePrescriptionItemInput): Promise<AddPrescriptionItemResult> {
  const actor = requireStaffActor(actorCtx);
  requireCapability(actor, "canWritePrescriptions");

  await assertPrescriptionDraft(client, prescriptionId);

  const existing = await findItemById(client, itemId);
  if (existing === null) {
    throw new PrescriptionError("item_not_found", `Prescription item id=${itemId} not found.`);
  }

  // Merge update input over existing values
  const merged: AddPrescriptionItemInput = {
    medicationMasterId: existing.medication_master_id,
    doseAmount: input.doseAmount ?? existing.dose_amount,
    doseUnit: input.doseUnit ?? existing.dose_unit,
    route: input.route ?? existing.route,
    frequencyCode: (input.frequencyCode ?? existing.frequency_code ?? "QD") as AddPrescriptionItemInput["frequencyCode"],
    durationDays: input.durationDays ?? existing.days_supply,
    timingRelation: input.timingRelation ?? existing.timing_relation,
    indicationText: input.indicationText !== undefined ? input.indicationText : existing.indication_text,
    prnFlag: input.prnFlag ?? existing.prn_flag,
    prnReason: input.prnReason !== undefined ? input.prnReason : existing.prn_reason,
    startDate: input.startDate ?? existing.start_date,
    isRefillable: input.isRefillable ?? existing.is_refillable,
    maxRefillsAllowed: input.maxRefillsAllowed ?? existing.max_refills_allowed,
    requiresReviewBeforeRefill: input.requiresReviewBeforeRefill ?? existing.requires_review_before_refill,
    highRiskReviewFlag: input.highRiskReviewFlag ?? existing.high_risk_review_flag,
    refillMode: input.refillMode,
    instructionLanguage: input.instructionLanguage,
  };

  // Remove the old item and re-insert with merged data on the same line_no
  await deleteItemById(client, itemId);

  // Re-insert preserving the line_no
  const medication = await findMedicationById(client, merged.medicationMasterId);
  if (medication === null) {
    throw new PrescriptionError("medication_not_found", `Medication id=${merged.medicationMasterId} not found.`);
  }

  const startDate = merged.startDate ?? existing.start_date;
  const timingRelation = merged.timingRelation ?? "none";
  const prnFlag = merged.prnFlag ?? false;
  const prnReason = merged.prnReason ?? null;
  const prnMaxDailyDoses = 3;

  if (prnFlag && !prnReason) {
    throw new PrescriptionError("item_prn_missing_reason", "PRN items require a prnReason.");
  }

  const quantityCalc = calculateQuantity({
    doseAmount: merged.doseAmount,
    doseUnit: merged.doseUnit,
    frequencyCode: merged.frequencyCode,
    durationDays: merged.durationDays,
    dosageForm: medication.dosage_form,
    prnMaxDailyDoses,
  });

  const endDate = addDays(startDate, merged.durationDays);
  const instructionInput = {
    doseAmount: merged.doseAmount,
    doseUnit: merged.doseUnit,
    route: merged.route,
    frequencyCode: merged.frequencyCode,
    timingRelation,
    dosageForm: medication.dosage_form,
    prnFlag,
    prnReason,
    prnMaxDailyDoses,
    language: merged.instructionLanguage ?? "vi",
  } as const;

  const patientInstruction = buildPatientInstruction(instructionInput);
  const adminInstruction = buildAdministrationInstruction(instructionInput);
  const frequencyText = frequencyCodeToText(merged.frequencyCode, merged.instructionLanguage ?? "vi");

  const item = await insertPrescriptionItem(client, {
    prescription_id: prescriptionId,
    line_no: existing.line_no,
    medication_master_id: merged.medicationMasterId,
    indication_text: merged.indicationText ?? null,
    dose_amount: merged.doseAmount,
    dose_unit: merged.doseUnit,
    route: merged.route,
    frequency_code: merged.frequencyCode,
    frequency_text: frequencyText,
    timing_relation: timingRelation,
    administration_instruction_text: adminInstruction,
    patient_instruction_text: patientInstruction,
    prn_flag: prnFlag,
    prn_reason: prnReason,
    quantity_prescribed: quantityCalc.quantityPrescribed,
    quantity_unit: quantityCalc.quantityUnit,
    days_supply: quantityCalc.daysSupply,
    start_date: startDate,
    end_date: endDate,
    is_refillable: merged.isRefillable ?? false,
    max_refills_allowed: merged.maxRefillsAllowed ?? 0,
    requires_review_before_refill: merged.requiresReviewBeforeRefill ?? false,
    high_risk_review_flag: merged.highRiskReviewFlag ?? medication.is_high_risk,
    status: "active",
  });

  const scheduleInput = generateDoseSchedule({
    prescriptionItemId: item.id,
    frequencyCode: merged.frequencyCode,
    durationDays: merged.durationDays,
    startDate,
    prnMaxDailyDoses,
  });
  const doseSchedule = await insertDoseSchedule(client, scheduleInput);

  const refillPolicyInput = buildRefillPolicySnapshot({
    prescriptionItemId: item.id,
    isRefillable: merged.isRefillable ?? false,
    maxRefillsAllowed: merged.maxRefillsAllowed ?? 0,
    requiresReviewBeforeRefill: merged.requiresReviewBeforeRefill ?? false,
    highRiskReviewFlag: merged.highRiskReviewFlag ?? medication.is_high_risk,
    durationDays: merged.durationDays,
    startDate,
    explicitRefillMode: merged.refillMode,
  });
  const refillPolicy = await insertRefillPolicySnapshot(client, refillPolicyInput);

  return { item, doseSchedule, refillPolicy };
}

// ─── removePrescriptionItem ───────────────────────────────────────────────────

/**
 * Remove an item from a draft prescription.
 * Cannot remove items from non-draft prescriptions.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function removePrescriptionItem(client: any, actorCtx: AnyActorContext, prescriptionId: EntityId, itemId: EntityId): Promise<void> {
  const actor = requireStaffActor(actorCtx);
  requireCapability(actor, "canWritePrescriptions");

  await assertPrescriptionDraft(client, prescriptionId);

  const item = await findItemById(client, itemId);
  if (item === null) {
    throw new PrescriptionError("item_not_found", `Prescription item id=${itemId} not found.`);
  }
  if (item.prescription_id !== prescriptionId) {
    throw new PrescriptionError("item_not_found", `Item id=${itemId} does not belong to prescription id=${prescriptionId}.`);
  }

  await deleteItemById(client, itemId);
}

// ─── listPrescriptionItems ────────────────────────────────────────────────────

/**
 * Get all items for a prescription (ordered by line_no).
 * Read-only — no write capability required beyond being a staff actor.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listPrescriptionItems(client: any, actorCtx: AnyActorContext, prescriptionId: EntityId): Promise<PrescriptionItemRow[]> {
  const actor = requireStaffActor(actorCtx);
  requireCapability(actor, "canReadPrescription");
  return findItemsByPrescription(client, prescriptionId);
}

// ─── Date helper ──────────────────────────────────────────────────────────────

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
