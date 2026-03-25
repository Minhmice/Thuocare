/**
 * Prescription service.
 *
 * Orchestrates prescription lifecycle operations:
 * - Auth/capability guard enforcement (via @thuocare/auth)
 * - Business-rule validation (episode scope, status transitions)
 * - DB writes via prescription-repo
 *
 * WRITE operations require: staff actor + canWritePrescriptions capability.
 * READ operations require: staff actor + canReadPrescription capability.
 */

import type { AnyActorContext, ResolvedStaffActorContext } from "@thuocare/auth";
import {
  isStaffActor,
  requireCapability,
  requirePatientActor,
  requireStaffActor,
} from "@thuocare/auth";
import type {
  PrescriptionDetail,
  PrescriptionRow,
} from "@thuocare/contracts";
import type { EntityId } from "@thuocare/contracts";
import { PrescriptionError } from "../errors/prescription-errors.js";
import type {
  CreatePrescriptionInput,
  DiscontinuePrescriptionInput,
  PrescriptionPatientView,
  UpdatePrescriptionDraftInput,
} from "../domain/types.js";
import {
  findEpisodeById,
  findMedicationsByIds,
  findPrescriptionById,
  findPrescriptionsByEpisode,
  findPrescriptionsByPatient,
  insertPrescription,
  loadPrescriptionDetail,
  updatePrescriptionById,
} from "../repository/prescription-repo.js";
import { toPrescriptionPatientView } from "../read-models/patient-view.js";

// ─── Episode validation helpers ───────────────────────────────────────────────

const TERMINAL_EPISODE_STATUSES = new Set(["completed", "discontinued", "cancelled"]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertEpisodeWritable(client: any, episodeId: EntityId, actor: ResolvedStaffActorContext): Promise<void> {
  const episode = await findEpisodeById(client, episodeId);
  if (episode === null) {
    throw new PrescriptionError("episode_not_found", `Treatment episode id=${episodeId} not found.`);
  }
  if (episode.organization_id !== actor.organizationId) {
    throw new PrescriptionError("episode_org_mismatch", `Episode id=${episodeId} belongs to a different organization.`);
  }
  if (TERMINAL_EPISODE_STATUSES.has(episode.current_status)) {
    throw new PrescriptionError("episode_terminal", `Episode id=${episodeId} is in terminal status "${episode.current_status}".`);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadWritablePrescription(client: any, prescriptionId: EntityId): Promise<PrescriptionRow> {
  const prescription = await findPrescriptionById(client, prescriptionId);
  if (prescription === null) {
    throw new PrescriptionError("prescription_not_found", `Prescription id=${prescriptionId} not found.`);
  }
  return prescription;
}

// ─── createPrescription ───────────────────────────────────────────────────────

/**
 * Create a new prescription in "draft" status.
 *
 * The prescription header is created without items — items are added separately
 * via addPrescriptionItem(). The doctor_id defaults to the actor's doctorProfileId
 * if not explicitly provided.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createPrescription(client: any, actorCtx: AnyActorContext, input: CreatePrescriptionInput): Promise<PrescriptionRow> {
  const actor = requireStaffActor(actorCtx);
  requireCapability(actor, "canWritePrescriptions");

  await assertEpisodeWritable(client, input.treatmentEpisodeId, actor);

  // Verify the episode's patient matches the input patientId
  const episode = await findEpisodeById(client, input.treatmentEpisodeId);
  // episode is guaranteed non-null by assertEpisodeWritable above
  if (episode!.patient_id !== input.patientId) {
    throw new PrescriptionError("episode_patient_mismatch", `Episode id=${input.treatmentEpisodeId} belongs to a different patient.`);
  }

  const doctorId = input.doctorId ?? actor.doctorProfileId ?? null;

  return insertPrescription(client, {
    organization_id: actor.organizationId,
    clinic_id: actor.clinicId ?? actor.organizationId, // fallback: use org as clinic if no clinic scope
    patient_id: input.patientId,
    treatment_episode_id: input.treatmentEpisodeId,
    prescription_kind: input.prescriptionKind,
    issue_source: input.issueSource,
    effective_from: input.effectiveFrom,
    encounter_id: input.encounterId ?? null,
    doctor_id: doctorId,
    parent_prescription_id: input.parentPrescriptionId ?? null,
    status: "draft",
    clinical_note: input.clinicalNote ?? null,
  });
}

// ─── updatePrescriptionDraft ──────────────────────────────────────────────────

/**
 * Update the header fields of a draft prescription.
 * Only "draft" prescriptions can be updated.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updatePrescriptionDraft(client: any, actorCtx: AnyActorContext, prescriptionId: EntityId, input: UpdatePrescriptionDraftInput): Promise<PrescriptionRow> {
  const actor = requireStaffActor(actorCtx);
  requireCapability(actor, "canWritePrescriptions");

  const prescription = await loadWritablePrescription(client, prescriptionId);
  if (prescription.status !== "draft") {
    throw new PrescriptionError("prescription_not_draft", `Prescription id=${prescriptionId} is not in draft status (current: "${prescription.status}").`);
  }

  return updatePrescriptionById(client, prescriptionId, {
    ...(input.prescriptionKind !== undefined && { prescription_kind: input.prescriptionKind }),
    ...(input.issueSource !== undefined && { issue_source: input.issueSource }),
    ...(input.effectiveFrom !== undefined && { effective_from: input.effectiveFrom }),
    ...(input.encounterId !== undefined && { encounter_id: input.encounterId }),
    ...(input.clinicalNote !== undefined && { clinical_note: input.clinicalNote }),
  });
}

// ─── issuePrescription ────────────────────────────────────────────────────────

/**
 * Issue a draft prescription, transitioning it to "issued" status.
 *
 * Requires at least one item. Sets issued_at to now.
 * After issuing, items can no longer be added or removed.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function issuePrescription(client: any, actorCtx: AnyActorContext, prescriptionId: EntityId): Promise<PrescriptionRow> {
  const actor = requireStaffActor(actorCtx);
  requireCapability(actor, "canWritePrescriptions");

  const detail = await loadPrescriptionDetail(client, prescriptionId);
  if (detail === null) {
    throw new PrescriptionError("prescription_not_found", `Prescription id=${prescriptionId} not found.`);
  }
  if (detail.prescription.status !== "draft") {
    throw new PrescriptionError("prescription_not_draft", `Prescription id=${prescriptionId} is not in draft status (current: "${detail.prescription.status}").`);
  }
  if (detail.items.length === 0) {
    throw new PrescriptionError("prescription_no_items", `Cannot issue prescription id=${prescriptionId}: no items added.`);
  }

  // Compute total days supply from item max
  const daysSupplyTotal = Math.max(...detail.items.map((i) => i.item.days_supply));

  // Compute effective_to from effective_from + max days supply
  const effectiveFrom = detail.prescription.effective_from;
  const effectiveToDate = addDays(effectiveFrom, daysSupplyTotal);

  return updatePrescriptionById(client, prescriptionId, {
    status: "issued",
    issued_at: new Date().toISOString(),
    days_supply_total: daysSupplyTotal,
    effective_to: effectiveToDate,
  });
}

// ─── discontinuePrescription ──────────────────────────────────────────────────

/**
 * Discontinue an active or issued prescription.
 * Transitions status to "discontinued".
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function discontinuePrescription(client: any, actorCtx: AnyActorContext, prescriptionId: EntityId, input: DiscontinuePrescriptionInput): Promise<PrescriptionRow> {
  const actor = requireStaffActor(actorCtx);
  requireCapability(actor, "canWritePrescriptions");

  const prescription = await loadWritablePrescription(client, prescriptionId);
  const discontinuableStatuses = new Set<string>(["issued", "active", "paused"]);
  if (!discontinuableStatuses.has(prescription.status)) {
    throw new PrescriptionError("prescription_not_active", `Prescription id=${prescriptionId} cannot be discontinued (current: "${prescription.status}").`);
  }

  return updatePrescriptionById(client, prescriptionId, {
    status: "discontinued",
    clinical_note: input.reason,
  });
}

// ─── Read operations ──────────────────────────────────────────────────────────

/**
 * Load the full PrescriptionDetail by ID.
 * Returns null if not found.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getPrescriptionById(client: any, actorCtx: AnyActorContext, prescriptionId: EntityId): Promise<PrescriptionDetail | null> {
  if (isStaffActor(actorCtx)) {
    const actor = requireStaffActor(actorCtx);
    requireCapability(actor, "canReadPrescription");
    return loadPrescriptionDetail(client, prescriptionId);
  }

  const actor = requirePatientActor(actorCtx);
  const detail = await loadPrescriptionDetail(client, prescriptionId);
  if (detail === null) {
    return null;
  }
  if (
    detail.prescription.patient_id !== actor.patientId
    || detail.prescription.organization_id !== actor.organizationId
  ) {
    return null;
  }
  return detail;
}

/**
 * Get all prescription rows for a patient in the actor's organization.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getPrescriptionsByPatient(client: any, actorCtx: AnyActorContext, patientId: EntityId): Promise<PrescriptionRow[]> {
  const actor = requireStaffActor(actorCtx);
  requireCapability(actor, "canReadPrescription");
  return findPrescriptionsByPatient(client, patientId, actor.organizationId);
}

/**
 * Get all prescription rows for a treatment episode.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getPrescriptionsByEpisode(client: any, actorCtx: AnyActorContext, episodeId: EntityId): Promise<PrescriptionRow[]> {
  const actor = requireStaffActor(actorCtx);
  requireCapability(actor, "canReadPrescription");
  return findPrescriptionsByEpisode(client, episodeId);
}

/**
 * Get active patient-facing prescriptions for the signed-in patient actor.
 *
 * Active statuses for the patient channel:
 * - issued
 * - active
 * - paused
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getMyActivePrescriptions(client: any, actorCtx: AnyActorContext): Promise<PrescriptionPatientView[]> {
  const actor = requirePatientActor(actorCtx);

  if (actor.organizationId === null) {
    return [];
  }

  const allPrescriptions = await findPrescriptionsByPatient(
    client,
    actor.patientId,
    actor.organizationId,
  );

  const activePrescriptions = allPrescriptions.filter((row) =>
    row.status === "issued" || row.status === "active" || row.status === "paused",
  );

  if (activePrescriptions.length === 0) {
    return [];
  }

  const details = (
    await Promise.all(
      activePrescriptions.map((row) => loadPrescriptionDetail(client, row.id)),
    )
  ).filter((row): row is PrescriptionDetail => row !== null);

  if (details.length === 0) {
    return [];
  }

  const medicationIds = [...new Set(
    details.flatMap((detail) => detail.items.map((item) => item.item.medication_master_id)),
  )];
  const medications = await findMedicationsByIds(client, medicationIds);
  const medicationMap = new Map(medications.map((med) => [med.id, med]));

  return details.map((detail) => toPrescriptionPatientView(detail, medicationMap));
}

// ─── Date helper ──────────────────────────────────────────────────────────────

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
