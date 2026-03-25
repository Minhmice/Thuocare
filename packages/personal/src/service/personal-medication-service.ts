import type { AnyActorContext } from "@thuocare/auth";

import type { PersonalDbClient } from "../repository/db-client.js";
import {
  fetchPersonalMedications,
  fetchPersonalMedicationsAllStatuses,
  fetchPersonalMedicationById,
  insertPersonalMedication,
  updatePersonalMedication,
} from "../repository/personal-medication-repo.js";
import { fetchPersonalProfile } from "../repository/personal-profile-repo.js";
import { PersonalError } from "../errors/personal-errors.js";
import type {
  AddPersonalMedicationInput,
  UpdatePersonalMedicationInput,
} from "../domain/types.js";
import type { PersonalMedicationVM } from "../domain/view-models.js";
import { toPersonalMedicationVM, FREQUENCY_LABELS } from "../mappers/medication-mapper.js";

/**
 * List active (and optionally paused) personal medications for the patient.
 */
export async function getPersonalMedications(
  db: PersonalDbClient,
  actor: AnyActorContext,
): Promise<PersonalMedicationVM[]> {
  if (actor.kind !== "patient") return [];
  const rows = await fetchPersonalMedications(db, actor.patientId);
  return rows.map(toPersonalMedicationVM);
}

/**
 * List all personal medications (every status) for medication management / history surfaces.
 */
export async function getPersonalMedicationsAllForPatient(
  db: PersonalDbClient,
  actor: AnyActorContext,
): Promise<PersonalMedicationVM[]> {
  if (actor.kind !== "patient") return [];
  const rows = await fetchPersonalMedicationsAllStatuses(db, actor.patientId);
  return rows.map(toPersonalMedicationVM);
}

/**
 * Load one personal medication by id for the signed-in patient.
 */
export async function getPersonalMedicationByIdForPatient(
  db: PersonalDbClient,
  actor: AnyActorContext,
  medicationId: string,
): Promise<PersonalMedicationVM | null> {
  if (actor.kind !== "patient") return null;
  const row = await fetchPersonalMedicationById(db, medicationId, actor.patientId);
  return row ? toPersonalMedicationVM(row) : null;
}

/**
 * Add a new personal medication with schedule.
 */
export async function addPersonalMedication(
  db: PersonalDbClient,
  actor: AnyActorContext,
  input: Omit<AddPersonalMedicationInput, "patientId" | "personalProfileId">,
): Promise<PersonalMedicationVM> {
  if (actor.kind !== "patient") {
    throw new PersonalError("patient_mismatch", "Patient actor required");
  }

  const profile = await fetchPersonalProfile(db, actor.patientId);
  if (!profile) {
    throw new PersonalError("personal_profile_not_found", "No personal profile found for patient");
  }

  const row = await insertPersonalMedication(db, {
    ...input,
    patientId: actor.patientId,
    personalProfileId: profile.id,
  });

  return toPersonalMedicationVM(row);
}

/**
 * Update a personal medication (dosage, schedule, notes, status).
 */
export async function updatePersonalMedicationById(
  db: PersonalDbClient,
  actor: AnyActorContext,
  medicationId: string,
  updates: UpdatePersonalMedicationInput,
): Promise<PersonalMedicationVM> {
  if (actor.kind !== "patient") {
    throw new PersonalError("patient_mismatch", "Patient actor required");
  }

  const existing = await fetchPersonalMedicationById(db, medicationId, actor.patientId);
  if (!existing) {
    throw new PersonalError("personal_medication_not_found", "Medication not found");
  }
  if (existing.status === "stopped") {
    throw new PersonalError("medication_already_stopped", "Cannot update a stopped medication");
  }

  const updated = await updatePersonalMedication(db, medicationId, actor.patientId, updates);
  return toPersonalMedicationVM(updated);
}

/**
 * Stop a personal medication (set status = stopped).
 */
export async function stopPersonalMedication(
  db: PersonalDbClient,
  actor: AnyActorContext,
  medicationId: string,
): Promise<void> {
  await updatePersonalMedicationById(db, actor, medicationId, { status: "stopped" });
}

export { FREQUENCY_LABELS };
