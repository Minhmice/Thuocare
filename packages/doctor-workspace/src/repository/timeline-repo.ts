/**
 * Treatment event (timeline) repository for doctor workspace.
 *
 * Read-only access. Returns recent events for rendering activity feeds.
 */

import type { TreatmentEventRow } from "@thuocare/contracts";
import type { EntityId } from "@thuocare/contracts";
import { WorkspaceError } from "../errors/workspace-errors.js";
import { dbSelectMany } from "./db-client.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findRecentEventsByPatient(client: any, patientId: EntityId, limit = 10): Promise<TreatmentEventRow[]> {
  const { data, error } = await dbSelectMany(
    client, "treatment_event",
    [["patient_id", patientId]],
    { orderBy: { column: "event_at", ascending: false }, limit },
  );
  if (error) throw new WorkspaceError("db_read_failed", "Failed to read treatment events.", error.message);
  return (data ?? []) as TreatmentEventRow[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findRecentEventsByEpisode(client: any, episodeId: EntityId, limit = 10): Promise<TreatmentEventRow[]> {
  const { data, error } = await dbSelectMany(
    client, "treatment_event",
    [["treatment_episode_id", episodeId]],
    { orderBy: { column: "event_at", ascending: false }, limit },
  );
  if (error) throw new WorkspaceError("db_read_failed", "Failed to read episode events.", error.message);
  return (data ?? []) as TreatmentEventRow[];
}
