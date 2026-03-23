/**
 * Encounter repository for doctor workspace.
 *
 * Read-only access to encounter data.
 */

import type { EncounterRow } from "@thuocare/contracts";
import type { EntityId } from "@thuocare/contracts";
import { WorkspaceError } from "../errors/workspace-errors.js";
import { dbSelectMany, dbSelectOne } from "./db-client.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findEncounterById(client: any, id: EntityId): Promise<EncounterRow | null> {
  const { data, error } = await dbSelectOne(client, "encounter", [["id", id]]);
  if (error) throw new WorkspaceError("db_read_failed", "Failed to read encounter.", error.message);
  return data as EncounterRow | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findEncountersByEpisode(client: any, episodeId: EntityId): Promise<EncounterRow[]> {
  const { data, error } = await dbSelectMany(
    client, "encounter",
    [["treatment_episode_id", episodeId]],
    { orderBy: { column: "encounter_at", ascending: false } },
  );
  if (error) throw new WorkspaceError("db_read_failed", "Failed to read encounters.", error.message);
  return (data ?? []) as EncounterRow[];
}

/** Load the most recent encounters for a patient across all episodes. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findRecentEncountersByPatient(client: any, patientId: EntityId, limit = 5): Promise<EncounterRow[]> {
  const { data, error } = await dbSelectMany(
    client, "encounter",
    [["patient_id", patientId]],
    { orderBy: { column: "encounter_at", ascending: false }, limit },
  );
  if (error) throw new WorkspaceError("db_read_failed", "Failed to read recent encounters.", error.message);
  return (data ?? []) as EncounterRow[];
}
