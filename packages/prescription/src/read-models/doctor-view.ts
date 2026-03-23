/**
 * Doctor-facing prescription read model.
 *
 * Maps a PrescriptionDetail (raw DB rows) to PrescriptionDoctorView,
 * enriching each item with medication info and reformatting nested data
 * for clinical display.
 *
 * This is read-only — no DB writes, no auth checks.
 * Auth checks happen in the service layer before calling these functions.
 */

import type {
  DoseScheduleRow,
  MedicationMasterRow,
  PrescriptionDetail,
  PrescriptionItemDetail,
  RefillPolicySnapshotRow,
} from "@thuocare/contracts";
import type {
  DoseScheduleSummary,
  MedicationInfo,
  PrescriptionDoctorView,
  PrescriptionItemDoctorView,
  RefillPolicySummary,
} from "../domain/types.js";
import { frequencyCodeToText } from "../schedule/frequency.js";
import type { FrequencyCode } from "../domain/types.js";

// ─── Main mapper ──────────────────────────────────────────────────────────────

/**
 * Map a PrescriptionDetail to the doctor-facing view.
 *
 * Requires a `medications` map (id → MedicationMasterRow) for item enrichment.
 * Load medications before calling this function.
 */
export function toPrescriptionDoctorView(
  detail: PrescriptionDetail,
  medications: Map<string, MedicationMasterRow>,
): PrescriptionDoctorView {
  const { prescription, items } = detail;

  const itemViews: PrescriptionItemDoctorView[] = items.map((itemDetail) =>
    toItemDoctorView(itemDetail, medications),
  );

  return {
    prescriptionId: prescription.id,
    patientId: prescription.patient_id,
    treatmentEpisodeId: prescription.treatment_episode_id,
    encounterId: prescription.encounter_id,
    doctorId: prescription.doctor_id,
    prescriptionKind: prescription.prescription_kind,
    issueSource: prescription.issue_source,
    status: prescription.status,
    issuedAt: prescription.issued_at,
    effectiveFrom: prescription.effective_from,
    effectiveTo: prescription.effective_to,
    daysSupplyTotal: prescription.days_supply_total,
    renewalSequenceNo: prescription.renewal_sequence_no,
    clinicalNote: prescription.clinical_note,
    patientFriendlySummary: prescription.patient_friendly_summary,
    items: itemViews,
  };
}

// ─── Item mapper ──────────────────────────────────────────────────────────────

function toItemDoctorView(
  itemDetail: PrescriptionItemDetail,
  medications: Map<string, MedicationMasterRow>,
): PrescriptionItemDoctorView {
  const { item, doseSchedule, refillPolicy } = itemDetail;

  const medication = medications.get(item.medication_master_id);
  const medicationInfo: MedicationInfo = medication
    ? {
        id: medication.id,
        genericName: medication.generic_name,
        brandName: medication.brand_name,
        strengthText: medication.strength_text,
        dosageForm: medication.dosage_form,
        route: medication.route,
        isHighRisk: medication.is_high_risk,
        isControlledSubstance: medication.is_controlled_substance,
      }
    : {
        id: item.medication_master_id,
        genericName: "Unknown",
        brandName: null,
        strengthText: "",
        dosageForm: "other",
        route: item.route,
        isHighRisk: false,
        isControlledSubstance: false,
      };

  const frequencyText = item.frequency_code
    ? frequencyCodeToText(item.frequency_code as FrequencyCode, "vi")
    : item.frequency_text;

  return {
    itemId: item.id,
    lineNo: item.line_no,
    medication: medicationInfo,
    doseAmount: item.dose_amount,
    doseUnit: item.dose_unit,
    route: item.route,
    frequencyCode: item.frequency_code,
    frequencyText,
    timingRelation: item.timing_relation,
    durationDays: item.days_supply,
    startDate: item.start_date,
    endDate: item.end_date,
    prnFlag: item.prn_flag,
    prnReason: item.prn_reason,
    indicationText: item.indication_text,
    quantityPrescribed: item.quantity_prescribed,
    quantityUnit: item.quantity_unit,
    patientInstruction: item.patient_instruction_text,
    administrationInstruction: item.administration_instruction_text,
    isRefillable: item.is_refillable,
    maxRefillsAllowed: item.max_refills_allowed,
    requiresReviewBeforeRefill: item.requires_review_before_refill,
    highRiskReviewFlag: item.high_risk_review_flag,
    status: item.status,
    doseSchedule: doseSchedule ? toDoseScheduleSummary(doseSchedule) : null,
    refillPolicy: refillPolicy ? toRefillPolicySummary(refillPolicy) : null,
  };
}

// ─── Sub-entity mappers ───────────────────────────────────────────────────────

function toDoseScheduleSummary(row: DoseScheduleRow): DoseScheduleSummary {
  return {
    scheduleType: row.schedule_type,
    timezoneMode: row.timezone_mode,
    timesPerDay: row.times_per_day,
    structuredSchedule: row.structured_schedule_json,
    firstDoseAt: row.first_dose_at,
    lastDoseAt: row.last_dose_at,
    graceWindowMinutes: row.grace_window_minutes,
    markMissedAfterMinutes: row.mark_missed_after_minutes,
  };
}

function toRefillPolicySummary(row: RefillPolicySnapshotRow): RefillPolicySummary {
  return {
    refillMode: row.refill_mode,
    maxRefillsAllowed: row.max_refills_allowed,
    minDaysBetweenRefills: row.min_days_between_refills,
    earliestRefillRatio: row.earliest_refill_ratio,
    absoluteExpiryDate: row.absolute_expiry_date,
  };
}
