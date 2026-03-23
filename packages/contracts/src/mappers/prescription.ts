import type {
  DoseSchedule,
  DoseScheduleRow,
  Prescription,
  PrescriptionDetail,
  PrescriptionItem,
  PrescriptionItemDetail,
  PrescriptionItemRow,
  PrescriptionRow,
  RefillPolicySnapshot,
  RefillPolicySnapshotRow,
} from "../tables/prescription.js";

export function mapPrescriptionRow(row: PrescriptionRow): Prescription {
  return { ...row };
}

export function mapPrescriptionItemRow(row: PrescriptionItemRow): PrescriptionItem {
  return { ...row };
}

export function mapDoseScheduleRow(row: DoseScheduleRow): DoseSchedule {
  return { ...row };
}

export function mapRefillPolicySnapshotRow(row: RefillPolicySnapshotRow): RefillPolicySnapshot {
  return { ...row };
}

export function assemblePrescriptionItemDetail(input: {
  item: PrescriptionItem;
  doseSchedule: DoseSchedule | null;
  refillPolicy: RefillPolicySnapshot | null;
}): PrescriptionItemDetail {
  return {
    item: input.item,
    doseSchedule: input.doseSchedule,
    refillPolicy: input.refillPolicy,
  };
}

export function assemblePrescriptionDetail(input: {
  prescription: Prescription;
  items: PrescriptionItemDetail[];
}): PrescriptionDetail {
  return {
    prescription: input.prescription,
    items: input.items,
  };
}
