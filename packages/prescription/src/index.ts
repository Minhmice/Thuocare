/**
 * @thuocare/prescription
 *
 * Core prescription module for the Prescription-to-Adherence Platform.
 *
 * QUICK REFERENCE:
 *
 * 1. Create a prescription (doctor server action):
 *    ```ts
 *    import { createPrescription, addPrescriptionItem, issuePrescription } from "@thuocare/prescription";
 *    const actor = await requireStaffSession(supabase);
 *    const prescription = await createPrescription(supabase, actor, input);
 *    await addPrescriptionItem(supabase, actor, prescription.id, itemInput);
 *    await issuePrescription(supabase, actor, prescription.id);
 *    ```
 *
 * 2. Load doctor view:
 *    ```ts
 *    import { getPrescriptionById, toPrescriptionDoctorView } from "@thuocare/prescription";
 *    const detail = await getPrescriptionById(supabase, actor, prescriptionId);
 *    const view = toPrescriptionDoctorView(detail, medicationsMap);
 *    ```
 *
 * 3. Load patient view:
 *    ```ts
 *    import { toPrescriptionPatientView } from "@thuocare/prescription";
 *    const view = toPrescriptionPatientView(detail, medicationsMap);
 *    ```
 */

// ─── Errors ───────────────────────────────────────────────────────────────────
export type { PrescriptionErrorCode } from "./errors/prescription-errors.js";
export {
  PrescriptionError,
  isPrescriptionError,
} from "./errors/prescription-errors.js";

// ─── Domain types ─────────────────────────────────────────────────────────────
export type {
  FrequencyCode,
  InstructionLanguage,
  FixedTimesDailyScheduleJson,
  IntervalBasedScheduleJson,
  PrnScheduleJson,
  TaperScheduleJson,
  StructuredScheduleJson,
  QuantityCalculation,
  AddPrescriptionItemInput,
  CreatePrescriptionInput,
  UpdatePrescriptionDraftInput,
  DiscontinuePrescriptionInput,
  UpdatePrescriptionItemInput,
  MedicationInfo,
  PrescriptionItemDoctorView,
  DoseScheduleSummary,
  RefillPolicySummary,
  PrescriptionDoctorView,
  PrescriptionItemPatientView,
  PrescriptionPatientView,
} from "./domain/types.js";
export { FREQUENCY_CODE_VALUES } from "./domain/types.js";

// ─── Schedule ─────────────────────────────────────────────────────────────────
export type { FrequencyMeta } from "./schedule/frequency.js";
export {
  FREQUENCY_META,
  getFrequencyMeta,
  frequencyCodeToText,
} from "./schedule/frequency.js";

export type { GenerateScheduleInput } from "./schedule/schedule-generator.js";
export { generateDoseSchedule } from "./schedule/schedule-generator.js";

// ─── Quantity ─────────────────────────────────────────────────────────────────
export type { CalculateQuantityInput } from "./quantity/quantity-calculator.js";
export {
  calculateQuantity,
  calculateDaysSupply,
} from "./quantity/quantity-calculator.js";

// ─── Instructions ─────────────────────────────────────────────────────────────
export type {
  BuildInstructionInput,
  MedicationSummaryItem,
} from "./instruction/instruction-builder.js";
export {
  buildPatientInstruction,
  buildAdministrationInstruction,
  buildPrescriptionSummary,
} from "./instruction/instruction-builder.js";

// ─── Refill policy ────────────────────────────────────────────────────────────
export type { BuildRefillPolicyInput } from "./refill/refill-policy-defaults.js";
export { buildRefillPolicySnapshot } from "./refill/refill-policy-defaults.js";

// ─── Prescription service ─────────────────────────────────────────────────────
export {
  createPrescription,
  updatePrescriptionDraft,
  issuePrescription,
  discontinuePrescription,
  getPrescriptionById,
  getMyActivePrescriptions,
  getPrescriptionsByPatient,
  getPrescriptionsByEpisode,
} from "./service/prescription-service.js";

// ─── Prescription item service ────────────────────────────────────────────────
export type { AddPrescriptionItemResult } from "./service/prescription-item-service.js";
export {
  addPrescriptionItem,
  updatePrescriptionItem,
  removePrescriptionItem,
  listPrescriptionItems,
} from "./service/prescription-item-service.js";

// ─── Read models ──────────────────────────────────────────────────────────────
export { toPrescriptionDoctorView } from "./read-models/doctor-view.js";
export { toPrescriptionPatientView } from "./read-models/patient-view.js";
