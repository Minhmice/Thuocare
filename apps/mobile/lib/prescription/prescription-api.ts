import { getMyActivePrescriptions, getPrescriptionById } from "@thuocare/prescription";

/** Thin mobile facade over @thuocare/prescription service entrypoints (mirrors `lib/adherence/adherence-api`). */
export const prescriptionApi = {
  getMyActivePrescriptions,
  getPrescriptionById,
};
