import type { PersonalDbClient } from "./db-client.js";
import type { PersonalProfileRow } from "../domain/types.js";

/**
 * Fetch the personal_profile row for the signed-in user's patient record.
 * Returns null if not found (user is not in personal lane).
 */
export async function fetchPersonalProfile(
  db: PersonalDbClient,
  patientId: string,
): Promise<PersonalProfileRow | null> {
  const { data, error } = await db
    .from("personal_profile")
    .select("*")
    .eq("patient_id", patientId)
    .eq("profile_status", "active")
    .maybeSingle();

  if (error) throw error;
  return data as PersonalProfileRow | null;
}

/**
 * Patch profile fields for the active personal_profile row of this patient.
 * Returns null if no active profile exists for this patient.
 */
export async function updatePersonalProfileByPatient(
  db: PersonalDbClient,
  patientId: string,
  updates: {
    preferredName?: string | null;
    timezone?: string | null;
    languageCode?: string | null;
  },
): Promise<PersonalProfileRow | null> {
  const patch: Record<string, unknown> = {};
  if (updates.preferredName !== undefined) patch.preferred_name = updates.preferredName;
  if (updates.timezone !== undefined) patch.timezone = updates.timezone;
  if (updates.languageCode !== undefined) patch.language_code = updates.languageCode;

  if (Object.keys(patch).length === 0) {
    return fetchPersonalProfile(db, patientId);
  }

  const { data, error } = await db
    .from("personal_profile")
    .update(patch)
    .eq("patient_id", patientId)
    .eq("profile_status", "active")
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as PersonalProfileRow | null;
}

/**
 * Calls the SQL helper `current_three_lane_actor()` to determine which
 * lane the signed-in user belongs to.
 */
export async function fetchCurrentThreeLaneActor(
  db: PersonalDbClient,
): Promise<"personal" | "family" | "hospital" | "unknown"> {
  const { data, error } = await db.rpc("current_three_lane_actor");
  if (error) throw error;
  return (data ?? "unknown") as "personal" | "family" | "hospital" | "unknown";
}
