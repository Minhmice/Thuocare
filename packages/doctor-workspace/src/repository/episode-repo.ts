/**
 * Treatment episode repository for doctor workspace.
 *
 * Read-only access to episode data.
 * All queries are organization-scoped.
 */

import type { TreatmentEpisodeRow } from "@thuocare/contracts";
import type { EntityId } from "@thuocare/contracts";
import { WorkspaceError } from "../errors/workspace-errors.js";
import { dbSelectMany, dbSelectManyWithFilter, dbSelectOne } from "./db-client.js";

const ACTIVE_EPISODE_STATUSES = ["active", "monitoring", "follow_up_due", "refill_in_progress"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findEpisodeById(client: any, id: EntityId): Promise<TreatmentEpisodeRow | null> {
  const { data, error } = await dbSelectOne(client, "treatment_episode", [["id", id]]);
  if (error) throw new WorkspaceError("db_read_failed", "Failed to read episode.", error.message);
  return data as TreatmentEpisodeRow | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findEpisodesByPatient(client: any, patientId: EntityId): Promise<TreatmentEpisodeRow[]> {
  const { data, error } = await dbSelectMany(
    client, "treatment_episode",
    [["patient_id", patientId]],
    { orderBy: { column: "start_date", ascending: false } },
  );
  if (error) throw new WorkspaceError("db_read_failed", "Failed to read episodes.", error.message);
  return (data ?? []) as TreatmentEpisodeRow[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findActiveEpisodesByPatient(client: any, patientId: EntityId): Promise<TreatmentEpisodeRow[]> {
  const rows = await findEpisodesByPatient(client, patientId);
  return rows.filter((e) => ACTIVE_EPISODE_STATUSES.includes(e.current_status));
}

/**
 * Load all active episodes in the organization.
 * Used by the dashboard and patient list to batch-resolve episode data.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findActiveEpisodesByOrg(client: any, organizationId: EntityId): Promise<TreatmentEpisodeRow[]> {
  const { data, error } = await dbSelectManyWithFilter(
    client, "treatment_episode",
    [["organization_id", organizationId]],
    { column: "current_status", values: ACTIVE_EPISODE_STATUSES },
    { orderBy: { column: "last_activity_at", ascending: false } },
  );
  if (error) throw new WorkspaceError("db_read_failed", "Failed to read active episodes.", error.message);
  return (data ?? []) as TreatmentEpisodeRow[];
}

/**
 * Load active episodes in the org assigned to a specific doctor.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findActiveEpisodesByOrgAndDoctor(client: any, organizationId: EntityId, doctorProfileId: EntityId): Promise<TreatmentEpisodeRow[]> {
  const all = await findActiveEpisodesByOrg(client, organizationId);
  return all.filter((e) => e.primary_doctor_id === doctorProfileId);
}

export { ACTIVE_EPISODE_STATUSES };
