/**
 * @thuocare/doctor-workspace
 *
 * Doctor Workspace Foundation for the Prescription-to-Adherence Platform.
 *
 * QUICK REFERENCE:
 *
 * 1. Resolve doctor workspace context:
 *    ```ts
 *    import { getDoctorWorkspaceContext } from "@thuocare/doctor-workspace";
 *    const ctx = await getDoctorWorkspaceContext(supabase, actor);
 *    ```
 *
 * 2. Get patient list:
 *    ```ts
 *    import { getDoctorPatientList } from "@thuocare/doctor-workspace";
 *    const patients = await getDoctorPatientList(supabase, actor, { assignedToMe: true });
 *    ```
 *
 * 3. Open patient detail:
 *    ```ts
 *    import { getPatientDetailForDoctor } from "@thuocare/doctor-workspace";
 *    const detail = await getPatientDetailForDoctor(supabase, actor, patientId);
 *    ```
 *
 * 4. Create prescription:
 *    ```ts
 *    import { createPrescriptionFromWorkspace } from "@thuocare/doctor-workspace";
 *    const prescription = await createPrescriptionFromWorkspace(supabase, actor, input);
 *    // Then add items via @thuocare/prescription addPrescriptionItem()
 *    ```
 *
 * 5. Duplicate prescription:
 *    ```ts
 *    import { duplicatePrescription } from "@thuocare/doctor-workspace";
 *    const draft = await duplicatePrescription(supabase, actor, oldPrescriptionId);
 *    ```
 */

// ─── Errors ───────────────────────────────────────────────────────────────────
export type { WorkspaceErrorCode } from "./errors/workspace-errors.js";
export {
  WorkspaceError,
  isWorkspaceError,
} from "./errors/workspace-errors.js";

// ─── Domain types ─────────────────────────────────────────────────────────────
export type {
  DoctorWorkspaceContext,
  PatientListFilters,
  CreatePrescriptionFromWorkspaceInput,
  GetPatientsNeedingAttentionInput,
  GetPatientsNearDepletionInput,
  GetPatientMonitoringDetailInput,
} from "./domain/types.js";

// ─── View model types ─────────────────────────────────────────────────────────
export type {
  DoctorWorkspaceContextVM,
  PatientSummaryVM,
  CaregiverSummaryVM,
  PatientDetailVM,
  TreatmentEpisodeVM,
  TreatmentEpisodeDetailVM,
  EncounterSummaryVM,
  PrescriptionSummaryVM,
  PrescriptionDetailVM,
  PrescriptionItemVM,
  FollowUpPlanVM,
  AppointmentVM,
  TreatmentEventVM,
  DoctorDashboardVM,
  // Phase 8 monitoring VMs
  RiskSeverity,
  PatientRiskIssueType,
  PatientRiskVM,
  DashboardSummaryVM,
  DepletionAlertVM,
  OverdueFollowUpVM,
  PriorityQueueItemVM,
  PatientMonitoringDetailVM,
} from "./domain/view-models.js";

// ─── View model builders (for callers that want to build VMs manually) ────────
export {
  toDoctorWorkspaceContextVM,
  toPatientSummaryVM,
  toPatientDetailVM,
  toTreatmentEpisodeVM,
  toTreatmentEpisodeDetailVM,
  toEncounterSummaryVM,
  toPrescriptionSummaryVM,
  toPrescriptionDetailVM,
  toDoctorDashboardVM,
} from "./view-models/builders.js";

// ─── Phase 8: Monitoring service ─────────────────────────────────────────────
export {
  getPatientsNeedingAttention,
  getPatientsNearDepletion,
  getOverdueFollowUps,
  getDoctorDashboard,
  getPriorityPatientQueue,
  getPatientMonitoringDetail,
} from "./service/monitoring-service.js";

// ─── Workspace service (primary API) ─────────────────────────────────────────
export {
  getDoctorWorkspaceContext,
  getDoctorWorkspaceContextVM,
  getDoctorPatientList,
  getPatientDetailForDoctor,
  getTreatmentEpisodeDetail,
  getEncounterListByEpisode,
  getPrescriptionListByEpisode,
  getPrescriptionDetailForDoctor,
  createPrescriptionFromWorkspace,
  duplicatePrescription,
  getDoctorDashboardSummaryLite,
  getEpisodeListByPatient,
} from "./service/workspace-service.js";
