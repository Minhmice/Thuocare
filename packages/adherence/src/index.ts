/**
 * @thuocare/adherence
 *
 * Patient Medication Timeline & Adherence Tracking.
 *
 * QUICK REFERENCE:
 *
 * 1. Get today's medication timeline (patient):
 *    ```ts
 *    import { getPatientTimeline } from "@thuocare/adherence";
 *    const timeline = await getPatientTimeline(supabase, actorCtx, {
 *      patientId,
 *      date: "2026-03-22",
 *    });
 *    ```
 *
 * 2. Mark a dose as taken (patient):
 *    ```ts
 *    import { markDoseTaken } from "@thuocare/adherence";
 *    await markDoseTaken(supabase, actorCtx, {
 *      patientId,
 *      organizationId,
 *      prescriptionItemId,
 *      scheduledTime: "2026-03-22T08:00:00",
 *    });
 *    ```
 *
 * 3. Get active medication list (patient):
 *    ```ts
 *    import { getActiveMedications } from "@thuocare/adherence";
 *    const meds = await getActiveMedications(supabase, actorCtx, patientId);
 *    ```
 *
 * 4. Get adherence summary (patient):
 *    ```ts
 *    import { getAdherenceSummary } from "@thuocare/adherence";
 *    const summary = await getAdherenceSummary(supabase, actorCtx, patientId, "2026-03-01", "2026-03-22");
 *    ```
 *
 * 5. Process missed doses (system cron — service_role key required):
 *    ```ts
 *    import { processMissedDoses } from "@thuocare/adherence";
 *    const result = await processMissedDoses(serviceRoleClient, {
 *      organizationId,
 *      cutoffTime: new Date().toISOString(),
 *      lookbackHours: 48,
 *    });
 *    ```
 */

// ─── Errors ───────────────────────────────────────────────────────────────────
export type { AdherenceErrorCode } from "./errors/adherence-errors.js";
export {
  AdherenceError,
  isAdherenceError,
} from "./errors/adherence-errors.js";

// ─── Domain types ─────────────────────────────────────────────────────────────
export type {
  AdherenceSource,
  AdherenceStatus,
  CreateAdherenceLogInput,
  GetTimelineInput,
  GetTimelineRangeInput,
  MarkDoseSkippedInput,
  MarkDoseTakenInput,
  MedicationAdherenceLogRow,
  ProcessMissedDosesInput,
} from "./domain/types.js";

// ─── View model types ─────────────────────────────────────────────────────────
export type {
  ActiveMedicationVM,
  AdherenceByMedicationVM,
  AdherenceSummaryVM,
  DailyTimelineVM,
  TimelineDoseVM,
} from "./domain/view-models.js";

// ─── Repository types (for callers that need the flat item shape) ─────────────
export type { ActiveItemWithSchedule } from "./repository/item-repo.js";

// ─── Schedule expander (for callers that want raw slot expansion) ─────────────
export type { ExpandedDoseSlot } from "./timeline/schedule-expander.js";
export {
  expandScheduleForDate,
  expandSchedulesForDateRange,
} from "./timeline/schedule-expander.js";

// ─── Timeline builder (for callers that want to compose manually) ─────────────
export {
  buildActiveMedications,
  buildAdherenceSummary,
  buildDailyTimeline,
  buildTimelineRange,
} from "./timeline/timeline-builder.js";

// ─── Timeline service (primary patient-facing API) ────────────────────────────
export {
  getActiveMedications,
  getPatientTimeline,
  getPatientTimelineRange,
  markDoseSkipped,
  markDoseTaken,
} from "./service/timeline-service.js";

// ─── Adherence service (analytics + system cron) ─────────────────────────────
export {
  getAdherenceSummary,
  processMissedDoses,
} from "./service/adherence-service.js";
