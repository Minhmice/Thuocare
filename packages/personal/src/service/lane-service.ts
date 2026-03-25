/**
 * Lane detection service — resolves which care lane the current user is in.
 */

import type { AnyActorContext } from "@thuocare/auth";

import type { PersonalDbClient } from "../repository/db-client.js";
import {
  fetchCurrentThreeLaneActor,
  fetchPersonalProfile,
  updatePersonalProfileByPatient,
} from "../repository/personal-profile-repo.js";
import type { PersonalProfileRow, UpdatePersonalProfileSettingsInput } from "../domain/types.js";
import type { PersonalProfileVM } from "../domain/view-models.js";
import { PersonalError } from "../errors/personal-errors.js";

export type CareLane = "personal" | "family" | "hospital" | "unknown";

/**
 * Returns which lane the signed-in user belongs to.
 * Calls `current_three_lane_actor()` SQL function.
 */
export async function detectCurrentLane(
  db: PersonalDbClient,
  _actor: AnyActorContext,
): Promise<CareLane> {
  return fetchCurrentThreeLaneActor(db);
}

/**
 * Returns the personal profile for a patient actor.
 * Returns null if not found (patient is hospital-lane or not yet set up).
 */
export async function getPersonalProfile(
  db: PersonalDbClient,
  actor: AnyActorContext,
): Promise<PersonalProfileVM | null> {
  if (actor.kind !== "patient") return null;

  const row: PersonalProfileRow | null = await fetchPersonalProfile(db, actor.patientId);
  if (!row) return null;

  return {
    personalProfileId: row.id,
    patientId: row.patient_id,
    preferredName: row.preferred_name,
    timezone: row.timezone,
    languageCode: row.language_code,
  };
}

/**
 * Patch personal profile settings (preferred name, timezone, language) for the signed-in patient.
 */
export async function updatePersonalProfileSettings(
  db: PersonalDbClient,
  actor: AnyActorContext,
  updates: UpdatePersonalProfileSettingsInput,
): Promise<PersonalProfileVM> {
  if (actor.kind !== "patient") {
    throw new PersonalError("patient_mismatch", "Patient actor required");
  }

  const row = await updatePersonalProfileByPatient(db, actor.patientId, {
    preferredName: updates.preferredName,
    timezone: updates.timezone,
    languageCode: updates.languageCode,
  });

  if (!row) {
    throw new PersonalError("personal_profile_not_found", "No personal profile found for patient");
  }

  return {
    personalProfileId: row.id,
    patientId: row.patient_id,
    preferredName: row.preferred_name,
    timezone: row.timezone,
    languageCode: row.language_code,
  };
}
