import type { MedicationMaster, MedicationMasterRow } from "../tables/medication.js";

export function mapMedicationMasterRow(row: MedicationMasterRow): MedicationMaster {
  return { ...row };
}
