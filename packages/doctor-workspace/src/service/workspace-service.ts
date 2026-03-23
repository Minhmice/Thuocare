/**
 * Doctor Workspace Service.
 *
 * The primary orchestration layer for all doctor-facing workspace operations.
 *
 * WORKFLOW:
 *   1. getDoctorWorkspaceContext()  →  resolve who is using the workspace
 *   2. getDoctorPatientList()        →  see the doctor's patients
 *   3. getPatientDetailForDoctor()   →  open a patient record
 *   4. getTreatmentEpisodeDetail()   →  drill into a treatment episode
 *   5. createPrescriptionFromWorkspace() → create a prescription
 *   6. duplicatePrescription()       →  clone a previous prescription
 *
 * ACCESS ENFORCEMENT:
 *   - All operations require a doctor actor.
 *   - Organization scope is always checked against actor.organizationId.
 *   - Episode and patient cross-org access raises WorkspaceError.
 *
 * QUERY STRATEGY:
 *   - Patient list: load all patients in org, load all active episodes in org
 *     in two queries, join in-memory to avoid N+1.
 *   - Patient detail: 5 parallel queries (episodes, caregivers, encounters,
 *     prescriptions, events).
 *   - Episode detail: 4 parallel queries (encounters, prescriptions, follow-up,
 *     appointments) + item counts resolved per-prescription.
 *   - Dashboard: 3 queries (active episodes, prescription count, patient fetch)
 *     with in-memory aggregation.
 */

import type { AnyActorContext } from "@thuocare/auth";
import {
  requireCapability,
  requireDoctorActor,
} from "@thuocare/auth";
import type {
  DoctorProfileRow,
  PrescriptionDetail,
  PrescriptionRow,
  UserAccountRow,
} from "@thuocare/contracts";
import type { EntityId } from "@thuocare/contracts";
import type { FrequencyCode } from "@thuocare/prescription";
import {
  addPrescriptionItem,
  createPrescription,
  getPrescriptionById,
  getPrescriptionsByEpisode,
} from "@thuocare/prescription";
import { WorkspaceError } from "../errors/workspace-errors.js";
import type {
  CreatePrescriptionFromWorkspaceInput,
  DoctorWorkspaceContext,
  PatientListFilters,
} from "../domain/types.js";
import type {
  DoctorDashboardVM,
  DoctorWorkspaceContextVM,
  EncounterSummaryVM,
  PatientDetailVM,
  PatientSummaryVM,
  PrescriptionDetailVM,
  PrescriptionSummaryVM,
  TreatmentEpisodeDetailVM,
} from "../domain/view-models.js";
import {
  findCaregiversByPatient,
  findPatientById,
  findPatientsByOrg,
  findPatientsByOrgWithSearch,
} from "../repository/patient-repo.js";
import {
  ACTIVE_EPISODE_STATUSES,
  findActiveEpisodesByOrg,
  findActiveEpisodesByOrgAndDoctor,
  findActiveEpisodesByPatient,
  findEpisodeById,
  findEpisodesByPatient,
} from "../repository/episode-repo.js";
import {
  findEncountersByEpisode,
  findRecentEncountersByPatient,
} from "../repository/encounter-repo.js";
import {
  findAppointmentsByEpisode,
  findFollowUpPlansByEpisode,
} from "../repository/followup-repo.js";
import { findRecentEventsByPatient } from "../repository/timeline-repo.js";
import {
  countActivePrescriptionsByOrg,
  countItemsByPrescription,
  findActivePrescriptionsByPatient,
  findPrescriptionsByEpisode,
} from "../repository/prescription-repo.js";
import {
  toDoctorDashboardVM,
  toDoctorWorkspaceContextVM,
  toEncounterSummaryVM,
  toPatientDetailVM,
  toPatientSummaryVM,
  toPrescriptionDetailVM,
  toPrescriptionSummaryVM,
  toTreatmentEpisodeDetailVM,
  toTreatmentEpisodeVM,
} from "../view-models/builders.js";
import { dbSelectOne } from "../repository/db-client.js";

// ─── 4.1 Doctor context initialization ───────────────────────────────────────

/**
 * Resolve and return the doctor's workspace context.
 * Rejects non-doctor actors and actors without a doctor_profile_id.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getDoctorWorkspaceContext(client: any, actorCtx: AnyActorContext): Promise<DoctorWorkspaceContext> {
  const actor = requireDoctorActor(actorCtx);

  return {
    actorUserId: actor.authUserId,
    userAccountId: actor.userAccountId,
    doctorProfileId: actor.doctorProfileId,
    organizationId: actor.organizationId,
    clinicId: actor.clinicId,
  };
}

/**
 * Resolve workspace context and return the doctor-facing context VM
 * (includes display name and specialty from the doctor profile row).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getDoctorWorkspaceContextVM(client: any, actorCtx: AnyActorContext): Promise<DoctorWorkspaceContextVM> {
  const actor = requireDoctorActor(actorCtx);

  const [profileResult, accountResult] = await Promise.all([
    dbSelectOne(client, "doctor_profile", [["id", actor.doctorProfileId]]),
    dbSelectOne(client, "user_account", [["id", actor.userAccountId]]),
  ]);

  if (profileResult.error || !profileResult.data) {
    throw new WorkspaceError("doctor_profile_missing", `Doctor profile id=${actor.doctorProfileId} not found.`);
  }

  const doctorProfile = profileResult.data as DoctorProfileRow;
  const userAccount = accountResult.data as UserAccountRow;

  return toDoctorWorkspaceContextVM(doctorProfile, userAccount);
}

// ─── 4.2 Patient list ─────────────────────────────────────────────────────────

/**
 * Return the list of patients for a doctor's workspace.
 *
 * Query strategy (avoids N+1):
 *   1. Load patients in org (with optional name search).
 *   2. Load all active episodes in org in one query.
 *   3. Join episodes to patients in-memory.
 *   4. Apply assignedToMe / hasActiveEpisode filters in-memory.
 *   5. Sort by lastActivity or name.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getDoctorPatientList(client: any, actorCtx: AnyActorContext, filters?: PatientListFilters): Promise<PatientSummaryVM[]> {
  const actor = requireDoctorActor(actorCtx);
  requireCapability(actor, "canReadPatientProfile");

  const orgId = actor.organizationId;

  // ── 1. Load patients ──────────────────────────────────────────────────────
  const patients = filters?.search
    ? await findPatientsByOrgWithSearch(client, orgId, filters.search)
    : await findPatientsByOrg(client, orgId);

  if (patients.length === 0) return [];

  // ── 2. Load all active episodes in one batch query ─────────────────────
  const activeEpisodes = filters?.assignedToMe
    ? await findActiveEpisodesByOrgAndDoctor(client, orgId, actor.doctorProfileId)
    : await findActiveEpisodesByOrg(client, orgId);

  // ── 3. Group episodes by patient ──────────────────────────────────────────
  const episodesByPatient = new Map<EntityId, typeof activeEpisodes>();
  for (const ep of activeEpisodes) {
    const list = episodesByPatient.get(ep.patient_id) ?? [];
    list.push(ep);
    episodesByPatient.set(ep.patient_id, list);
  }

  // ── 4. Build summaries + apply filters ────────────────────────────────────
  let summaries: PatientSummaryVM[] = [];

  for (const patient of patients) {
    const patientEpisodes = episodesByPatient.get(patient.id) ?? [];

    if (filters?.hasActiveEpisode && patientEpisodes.length === 0) continue;

    summaries.push(toPatientSummaryVM(patient, patientEpisodes));
  }

  // ── 5. Sort ───────────────────────────────────────────────────────────────
  if (filters?.sortBy === "name") {
    summaries.sort((a, b) => a.fullName.localeCompare(b.fullName));
  } else {
    // Default: sort by last activity, newest first; null last
    summaries.sort((a, b) => {
      if (!a.lastActivity && !b.lastActivity) return 0;
      if (!a.lastActivity) return 1;
      if (!b.lastActivity) return -1;
      return b.lastActivity.localeCompare(a.lastActivity);
    });
  }

  return summaries;
}

// ─── 4.3 Patient detail view ──────────────────────────────────────────────────

/**
 * Return full patient detail for the doctor view.
 *
 * Query strategy (5 parallel queries):
 *   - Active episodes
 *   - Caregivers
 *   - Latest encounter (limit 1)
 *   - Active prescriptions
 *   - Recent events (limit 5)
 *
 * Item counts for prescriptions are loaded in parallel after the prescription
 * query completes (N small queries, but bounded by active prescription count).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getPatientDetailForDoctor(client: any, actorCtx: AnyActorContext, patientId: EntityId): Promise<PatientDetailVM> {
  const actor = requireDoctorActor(actorCtx);
  requireCapability(actor, "canReadPatientProfile");

  const patient = await findPatientById(client, patientId);
  if (!patient) {
    throw new WorkspaceError("patient_not_found", `Patient id=${patientId} not found.`);
  }
  if (patient.organization_id !== actor.organizationId) {
    throw new WorkspaceError("patient_not_found", `Patient id=${patientId} is not in your organization.`);
  }

  // Parallel fetch
  const [activeEpisodes, caregivers, recentEncounters, activePrescriptions, recentEvents] =
    await Promise.all([
      findActiveEpisodesByPatient(client, patientId),
      findCaregiversByPatient(client, patientId),
      findRecentEncountersByPatient(client, patientId, 1),
      findActivePrescriptionsByPatient(client, patientId, actor.organizationId),
      findRecentEventsByPatient(client, patientId, 5),
    ]);

  // Load item counts for active prescriptions
  const itemCountEntries = await Promise.all(
    activePrescriptions.map(async (p) => [p.id, await countItemsByPrescription(client, p.id)] as [EntityId, number]),
  );
  const prescriptionItemCounts = new Map<EntityId, number>(itemCountEntries);

  return toPatientDetailVM({
    patient,
    caregivers,
    activeEpisodes,
    latestEncounter: recentEncounters[0] ?? null,
    activePrescriptions,
    prescriptionItemCounts,
    recentEvents,
  });
}

// ─── 4.4 Treatment episode detail ────────────────────────────────────────────

/**
 * Return full treatment episode detail.
 *
 * Query strategy (4 parallel queries after episode load):
 *   - Encounters (all)
 *   - Prescriptions (all for episode)
 *   - Follow-up plans
 *   - Appointments
 *
 * Item counts resolved in parallel after prescriptions are loaded.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getTreatmentEpisodeDetail(client: any, actorCtx: AnyActorContext, episodeId: EntityId): Promise<TreatmentEpisodeDetailVM> {
  const actor = requireDoctorActor(actorCtx);
  requireCapability(actor, "canReadTreatmentEpisode");

  const episode = await findEpisodeById(client, episodeId);
  if (!episode) {
    throw new WorkspaceError("episode_not_found", `Episode id=${episodeId} not found.`);
  }
  if (episode.organization_id !== actor.organizationId) {
    throw new WorkspaceError("episode_org_mismatch", `Episode id=${episodeId} belongs to a different organization.`);
  }

  const [encounters, prescriptions, followUpPlans, appointments] = await Promise.all([
    findEncountersByEpisode(client, episodeId),
    findPrescriptionsByEpisode(client, episodeId),
    findFollowUpPlansByEpisode(client, episodeId),
    findAppointmentsByEpisode(client, episodeId),
  ]);

  const itemCountEntries = await Promise.all(
    prescriptions.map(async (p) => [p.id, await countItemsByPrescription(client, p.id)] as [EntityId, number]),
  );
  const prescriptionItemCounts = new Map<EntityId, number>(itemCountEntries);

  return toTreatmentEpisodeDetailVM({
    episode,
    encounters,
    prescriptions,
    prescriptionItemCounts,
    followUpPlans,
    appointments,
  });
}

// ─── 4.5 Encounter list ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getEncounterListByEpisode(client: any, actorCtx: AnyActorContext, episodeId: EntityId): Promise<EncounterSummaryVM[]> {
  const actor = requireDoctorActor(actorCtx);
  requireCapability(actor, "canReadTreatmentEpisode");

  const episode = await findEpisodeById(client, episodeId);
  if (!episode || episode.organization_id !== actor.organizationId) {
    throw new WorkspaceError("episode_not_found", `Episode id=${episodeId} not found.`);
  }

  const encounters = await findEncountersByEpisode(client, episodeId);
  return encounters.map(toEncounterSummaryVM);
}

// ─── 4.6 Prescription list + detail ──────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getPrescriptionListByEpisode(client: any, actorCtx: AnyActorContext, episodeId: EntityId): Promise<PrescriptionSummaryVM[]> {
  const actor = requireDoctorActor(actorCtx);
  requireCapability(actor, "canReadPrescription");

  const episode = await findEpisodeById(client, episodeId);
  if (!episode || episode.organization_id !== actor.organizationId) {
    throw new WorkspaceError("episode_not_found", `Episode id=${episodeId} not found.`);
  }

  const prescriptions = await findPrescriptionsByEpisode(client, episodeId);

  const itemCountEntries = await Promise.all(
    prescriptions.map(async (p) => [p.id, await countItemsByPrescription(client, p.id)] as [EntityId, number]),
  );
  const itemCounts = new Map<EntityId, number>(itemCountEntries);

  return prescriptions.map((p) => toPrescriptionSummaryVM(p, itemCounts.get(p.id) ?? 0));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getPrescriptionDetailForDoctor(client: any, actorCtx: AnyActorContext, prescriptionId: EntityId): Promise<PrescriptionDetailVM> {
  const actor = requireDoctorActor(actorCtx);
  requireCapability(actor, "canReadPrescription");

  // Phase 3 getPrescriptionById checks actor is staff + canReadPrescription
  const detail: PrescriptionDetail | null = await getPrescriptionById(client, actor, prescriptionId);
  if (!detail) {
    throw new WorkspaceError("prescription_not_found", `Prescription id=${prescriptionId} not found.`);
  }

  // Build item VMs from PrescriptionDetail
  const items = detail.items.map((itemDetail) => ({
    itemId: itemDetail.item.id,
    lineNo: itemDetail.item.line_no,
    // Medication name comes from medication_master — we use the item's instruction text
    // as the fallback since we'd need another query for medication names.
    // Callers needing full medication info should use toPrescriptionDoctorView from Phase 3.
    medicationName: itemDetail.item.medication_master_id,
    strengthText: "",
    doseAmount: itemDetail.item.dose_amount,
    doseUnit: itemDetail.item.dose_unit,
    route: itemDetail.item.route,
    frequencyCode: itemDetail.item.frequency_code,
    frequencyText: itemDetail.item.frequency_text,
    durationDays: itemDetail.item.days_supply,
    startDate: itemDetail.item.start_date,
    endDate: itemDetail.item.end_date,
    patientInstruction: itemDetail.item.patient_instruction_text,
    quantityPrescribed: itemDetail.item.quantity_prescribed,
    quantityUnit: itemDetail.item.quantity_unit,
    isRefillable: itemDetail.item.is_refillable,
    status: itemDetail.item.status,
  }));

  return toPrescriptionDetailVM({ prescription: detail.prescription, items });
}

// ─── 4.7 Create prescription ──────────────────────────────────────────────────

/**
 * Create a new draft prescription from the doctor workspace.
 * Delegates entirely to Phase 3 — this is the workspace entry point.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createPrescriptionFromWorkspace(client: any, actorCtx: AnyActorContext, input: CreatePrescriptionFromWorkspaceInput): Promise<PrescriptionRow> {
  const actor = requireDoctorActor(actorCtx);

  return createPrescription(client, actor, {
    patientId: input.patientId,
    treatmentEpisodeId: input.treatmentEpisodeId,
    prescriptionKind: input.prescriptionKind,
    issueSource: input.issueSource,
    effectiveFrom: input.effectiveFrom,
    encounterId: input.encounterId,
    doctorId: input.doctorId ?? actor.doctorProfileId,
    parentPrescriptionId: input.parentPrescriptionId,
    clinicalNote: input.clinicalNote,
  });
}

// ─── 4.8 Duplicate prescription ───────────────────────────────────────────────

/**
 * Duplicate an existing prescription as a new draft.
 *
 * Flow:
 *   1. Load original prescription detail (Phase 3)
 *   2. Validate it can be duplicated (not empty)
 *   3. Create new draft header
 *   4. Copy items one-by-one → Phase 3 addPrescriptionItem recomputes all
 *      derived fields (quantity, instructions, schedule, refill policy)
 *
 * The new prescription:
 *   - status: "draft"
 *   - issued_at: null
 *   - prescription_kind: "renewal"
 *   - parent_prescription_id: original prescription id
 *   - effective_from: today (ISO date)
 *   - All items cloned with same medication, dose, frequency, duration
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function duplicatePrescription(client: any, actorCtx: AnyActorContext, prescriptionId: EntityId): Promise<PrescriptionRow> {
  const actor = requireDoctorActor(actorCtx);

  // Load original detail via Phase 3
  const original: PrescriptionDetail | null = await getPrescriptionById(client, actor, prescriptionId);
  if (!original) {
    throw new WorkspaceError("prescription_not_found", `Prescription id=${prescriptionId} not found.`);
  }

  if (original.items.length === 0) {
    throw new WorkspaceError("prescription_no_items", `Cannot duplicate prescription id=${prescriptionId}: no items.`);
  }

  const today = new Date().toISOString().slice(0, 10);

  // Create new draft header
  const newPrescription = await createPrescription(client, actor, {
    patientId: original.prescription.patient_id,
    treatmentEpisodeId: original.prescription.treatment_episode_id,
    prescriptionKind: "renewal",
    issueSource: original.prescription.issue_source,
    effectiveFrom: today,
    encounterId: null,
    doctorId: actor.doctorProfileId,
    parentPrescriptionId: original.prescription.id,
    clinicalNote: original.prescription.clinical_note,
  });

  // Clone each item — Phase 3 recomputes all derived fields
  for (const itemDetail of original.items) {
    const item = itemDetail.item;
    const freqCode = (item.frequency_code ?? "QD") as FrequencyCode;

    await addPrescriptionItem(client, actor, newPrescription.id, {
      medicationMasterId: item.medication_master_id,
      doseAmount: item.dose_amount,
      doseUnit: item.dose_unit,
      route: item.route,
      frequencyCode: freqCode,
      durationDays: item.days_supply,
      timingRelation: item.timing_relation,
      indicationText: item.indication_text,
      prnFlag: item.prn_flag,
      prnReason: item.prn_reason,
      startDate: today,
      isRefillable: item.is_refillable,
      maxRefillsAllowed: item.max_refills_allowed,
      requiresReviewBeforeRefill: item.requires_review_before_refill,
      highRiskReviewFlag: item.high_risk_review_flag,
    });
  }

  return newPrescription;
}

// ─── 4.9 Doctor dashboard summary ─────────────────────────────────────────────

/**
 * Return a lightweight dashboard summary for the doctor.
 *
 * Query strategy (3 parallel queries):
 *   1. All active episodes in org (source for patient/episode counts)
 *   2. Active prescription count in org
 *   3. Patients for "attention" episodes (batch fetch by id set)
 *
 * "Needs attention" heuristic:
 *   - Episode status is "follow_up_due"
 *   - OR next_review_due_at is overdue
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getDoctorDashboardSummaryLite(client: any, actorCtx: AnyActorContext): Promise<DoctorDashboardVM> {
  const actor = requireDoctorActor(actorCtx);
  requireCapability(actor, "canReadPatientProfile");

  const orgId = actor.organizationId;
  const now = new Date().toISOString();

  const [activeEpisodes, activePrescriptionCount] = await Promise.all([
    findActiveEpisodesByOrg(client, orgId),
    countActivePrescriptionsByOrg(client, orgId),
  ]);

  // Unique patient count from active episodes
  const activePatientIds = new Set(activeEpisodes.map((e) => e.patient_id));
  const activePatientCount = activePatientIds.size;
  const activeEpisodeCount = activeEpisodes.length;

  // Identify episodes needing attention
  const attentionEpisodes = activeEpisodes.filter((e) =>
    e.current_status === "follow_up_due" ||
    (e.next_review_due_at !== null && e.next_review_due_at < now),
  );

  // Batch-load patients for attention episodes (unique patient ids, max 10)
  const attentionPatientIds = [...new Set(attentionEpisodes.map((e) => e.patient_id))].slice(0, 10);

  const patientRows = await Promise.all(
    attentionPatientIds.map((id) => findPatientById(client, id)),
  );

  const patientsById = new Map(
    patientRows.flatMap((p) => (p ? [[p.id, p]] : [])),
  );

  // Build episode map per patient (for riskTier derivation in summary)
  const episodesByPatientId = new Map<EntityId, typeof activeEpisodes>();
  for (const ep of activeEpisodes) {
    if (!activePatientIds.has(ep.patient_id)) continue;
    const list = episodesByPatientId.get(ep.patient_id) ?? [];
    list.push(ep);
    episodesByPatientId.set(ep.patient_id, list);
  }

  return toDoctorDashboardVM({
    activePatientCount,
    activeEpisodeCount,
    activePrescriptionCount,
    attentionEpisodes,
    patientsById,
    episodesByPatientId,
  });
}

// ─── Additional helpers (used by apps) ───────────────────────────────────────

/** Return all treatment episodes for a patient (all statuses). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getEpisodeListByPatient(client: any, actorCtx: AnyActorContext, patientId: EntityId) {
  const actor = requireDoctorActor(actorCtx);
  requireCapability(actor, "canReadTreatmentEpisode");

  const patient = await findPatientById(client, patientId);
  if (!patient || patient.organization_id !== actor.organizationId) {
    throw new WorkspaceError("patient_not_found", `Patient id=${patientId} not found.`);
  }

  const episodes = await findEpisodesByPatient(client, patientId);
  return episodes.map(toTreatmentEpisodeVM);
}
