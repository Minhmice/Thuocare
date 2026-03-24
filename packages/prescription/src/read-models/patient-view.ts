/**
 * Patient-facing prescription read model.
 *
 * Maps a PrescriptionDetail to PrescriptionPatientView — a simplified,
 * patient-friendly representation that:
 *   - Omits clinical metadata (indication codes, refill policy details, etc.)
 *   - Exposes medication name + strength as a single readable string
 *   - Computes `daysRemaining` from startDate + daysSupply relative to today
 *   - Includes dose times for adherence-tracking UIs
 *
 * This is read-only — no auth checks, no DB access.
 */

import type {
  DoseScheduleRow,
  MedicationMasterRow,
  PrescriptionDetail,
  PrescriptionItemDetail,
} from "@thuocare/contracts";
import type {
  PrescriptionItemPatientView,
  PrescriptionPatientView,
} from "../domain/types.js";
import { frequencyCodeToText, parseFrequencyCode } from "../schedule/frequency.js";
import type { FixedTimesDailyScheduleJson } from "../domain/types.js";

// ─── Main mapper ──────────────────────────────────────────────────────────────

/**
 * Map a PrescriptionDetail to the patient-facing view.
 *
 * @param detail      Full prescription detail from the DB.
 * @param medications Map of medication_master_id → MedicationMasterRow.
 * @param today       ISO date (YYYY-MM-DD) for daysRemaining calculation. Defaults to today.
 */
export function toPrescriptionPatientView(
  detail: PrescriptionDetail,
  medications: Map<string, MedicationMasterRow>,
  today?: string,
): PrescriptionPatientView {
  const { prescription, items } = detail;
  const refDate = today ?? new Date().toISOString().slice(0, 10);

  const itemViews: PrescriptionItemPatientView[] = items.map((itemDetail) =>
    toItemPatientView(itemDetail, medications, refDate),
  );

  return {
    prescriptionId: prescription.id,
    status: prescription.status,
    prescriptionKind: prescription.prescription_kind,
    issuedAt: prescription.issued_at,
    effectiveFrom: prescription.effective_from,
    effectiveTo: prescription.effective_to,
    daysSupplyTotal: prescription.days_supply_total,
    patientFriendlySummary: prescription.patient_friendly_summary,
    items: itemViews,
  };
}

// ─── Item mapper ──────────────────────────────────────────────────────────────

function toItemPatientView(
  itemDetail: PrescriptionItemDetail,
  medications: Map<string, MedicationMasterRow>,
  today: string,
): PrescriptionItemPatientView {
  const { item, doseSchedule } = itemDetail;

  const medication = medications.get(item.medication_master_id);
  const medicationName = medication?.generic_name ?? "Unknown";
  const strengthText = medication?.strength_text ?? "";

  const frequencyText =
    item.frequency_code == null || item.frequency_code === ""
      ? item.frequency_text
      : parseFrequencyCode(item.frequency_code) !== null
        ? frequencyCodeToText(item.frequency_code, "vi")
        : (item.frequency_text ?? item.frequency_code);

  const daysRemaining = computeDaysRemaining(item.start_date, item.days_supply, today);
  const { timesPerDay, doseTimes } = extractScheduleTimes(doseSchedule);

  return {
    itemId: item.id,
    medicationName,
    strengthText,
    patientInstruction: item.patient_instruction_text,
    frequencyText,
    timesPerDay,
    doseTimes,
    daysRemaining,
    daysSupply: item.days_supply,
    startDate: item.start_date,
    endDate: item.end_date,
    prnFlag: item.prn_flag,
    isRefillable: item.is_refillable,
    status: item.status,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Compute days remaining from startDate + daysSupply - today.
 * Returns null for PRN items (no fixed schedule to count down from).
 * Returns 0 if the supply has expired.
 */
function computeDaysRemaining(startDate: string, daysSupply: number, today: string): number | null {
  if (daysSupply <= 0) return null;

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + daysSupply);

  const todayDate = new Date(`${today}T00:00:00`);
  const msPerDay = 24 * 60 * 60 * 1000;
  const remaining = Math.ceil((end.getTime() - todayDate.getTime()) / msPerDay);
  return Math.max(0, remaining);
}

/**
 * Extract dose times from a dose schedule row for the patient UI.
 * For fixed_times_daily schedules, returns the dose_times array.
 * For all others, returns null (no fixed times to display).
 */
function extractScheduleTimes(doseSchedule: DoseScheduleRow | null): {
  timesPerDay: number | null;
  doseTimes: string[] | null;
} {
  if (doseSchedule === null) {
    return { timesPerDay: null, doseTimes: null };
  }

  const timesPerDay = doseSchedule.times_per_day;

  // Only extract dose times for fixed_times_daily schedules
  if (doseSchedule.schedule_type === "fixed_times_daily") {
    const json = doseSchedule.structured_schedule_json as FixedTimesDailyScheduleJson | null;
    if (json && json.type === "fixed_times_daily" && Array.isArray(json.dose_times)) {
      return { timesPerDay, doseTimes: json.dose_times };
    }
  }

  return { timesPerDay, doseTimes: null };
}
