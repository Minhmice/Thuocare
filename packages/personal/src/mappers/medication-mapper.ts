import type { PersonalMedicationRow } from "../domain/types.js";
import type { PersonalMedicationVM } from "../domain/view-models.js";
import type { FrequencyCode } from "../domain/types.js";

export const FREQUENCY_LABELS: Record<FrequencyCode, string> = {
  QD: "1 lần/ngày",
  BID: "2 lần/ngày",
  TID: "3 lần/ngày",
  QID: "4 lần/ngày",
  Q8H: "Mỗi 8 giờ",
  Q12H: "Mỗi 12 giờ",
  QHS: "Trước khi ngủ",
  QOD: "Cách ngày",
  QW: "Mỗi tuần",
  PRN: "Khi cần",
};

export function toPersonalMedicationVM(row: PersonalMedicationRow): PersonalMedicationVM {
  return {
    id: row.id,
    displayName: row.display_name,
    strengthText: row.strength_text,
    dosageForm: row.dosage_form,
    doseAmount: row.dose_amount,
    doseUnit: row.dose_unit,
    frequencyCode: row.frequency_code,
    frequencyLabel: FREQUENCY_LABELS[row.frequency_code] ?? row.frequency_code,
    startDate: row.start_date,
    endDate: row.end_date,
    notes: row.notes,
    status: row.status,
    isFromCatalog: row.catalog_id !== null,
    doseSchedule: row.dose_schedule_json,
  };
}
