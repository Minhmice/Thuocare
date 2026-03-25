/**
 * @thuocare/personal
 *
 * Personal Lane — self-managed medication tracking without clinical workflow.
 *
 * QUICK REFERENCE:
 *
 * 1. Detect current lane:
 *    ```ts
 *    import { detectCurrentLane } from "@thuocare/personal";
 *    const lane = await detectCurrentLane(supabase, actor); // "personal" | "hospital" | ...
 *    ```
 *
 * 2. Get personal medications:
 *    ```ts
 *    import { getPersonalMedications } from "@thuocare/personal";
 *    const meds = await getPersonalMedications(supabase, actor);
 *    ```
 *
 * 3. Add a personal medication:
 *    ```ts
 *    import { addPersonalMedication } from "@thuocare/personal";
 *    await addPersonalMedication(supabase, actor, { displayName: "Paracetamol", ... });
 *    ```
 *
 * 4. Get today's timeline:
 *    ```ts
 *    import { getPersonalTimeline } from "@thuocare/personal";
 *    const timeline = await getPersonalTimeline(supabase, actor, { patientId, date: "2026-03-25" });
 *    ```
 */

// ─── Errors ───────────────────────────────────────────────────────────────────
export type { PersonalErrorCode } from "./errors/personal-errors.js";
export { PersonalError, isPersonalError } from "./errors/personal-errors.js";

// ─── Domain types ─────────────────────────────────────────────────────────────
export type {
  PersonalMedStatus,
  PersonalDoseStatus,
  FrequencyCode,
  DoseScheduleJson,
  FixedTimesDailySchedule,
  IntervalBasedSchedule,
  PrnSchedule,
  PersonalMedicationRow,
  PersonalAdherenceLogRow,
  PersonalProfileRow,
  AddPersonalMedicationInput,
  UpdatePersonalMedicationInput,
  MarkPersonalDoseTakenInput,
  MarkPersonalDoseSkippedInput,
  GetPersonalTimelineInput,
  ResetPersonalDoseInput,
  UpdatePersonalProfileSettingsInput,
} from "./domain/types.js";
export {
  PERSONAL_MED_STATUS_VALUES,
  PERSONAL_DOSE_STATUS_VALUES,
  FREQUENCY_CODE_VALUES,
} from "./domain/types.js";

// ─── View models ──────────────────────────────────────────────────────────────
export type {
  PersonalProfileVM,
  PersonalMedicationVM,
  PersonalDoseVM,
  PersonalDailyTimelineVM,
  PersonalAdherenceEventVM,
  PersonalMedicationAdherenceSnippetVM,
} from "./domain/view-models.js";

// ─── Lane service ─────────────────────────────────────────────────────────────
export type { CareLane } from "./service/lane-service.js";
export {
  detectCurrentLane,
  getPersonalProfile,
  updatePersonalProfileSettings,
} from "./service/lane-service.js";

// ─── Medication service ───────────────────────────────────────────────────────
export {
  getPersonalMedications,
  getPersonalMedicationsAllForPatient,
  getPersonalMedicationByIdForPatient,
  addPersonalMedication,
  updatePersonalMedicationById,
  stopPersonalMedication,
  FREQUENCY_LABELS,
} from "./service/personal-medication-service.js";

// ─── Timeline service ─────────────────────────────────────────────────────────
export type { GetPersonalMedicationAdherenceSnippetInput } from "./service/personal-timeline-service.js";
export {
  getPersonalTimeline,
  getPersonalTimelineRange,
  getPersonalMedicationAdherenceSnippet,
  markPersonalDoseTaken,
  markPersonalDoseSkipped,
  resetPersonalDoseLog,
} from "./service/personal-timeline-service.js";
