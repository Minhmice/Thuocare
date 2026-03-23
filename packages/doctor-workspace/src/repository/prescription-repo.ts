/**
 * Lightweight prescription repository for doctor workspace.
 *
 * Only covers queries that the Phase 3 prescription service doesn't expose
 * (e.g., org-level counts for the dashboard). All item-level access is
 * delegated to @thuocare/prescription services.
 */

import type { EntityId } from "@thuocare/contracts";
import type { PrescriptionRow } from "@thuocare/contracts";
import { WorkspaceError } from "../errors/workspace-errors.js";
import { dbCountWithFilter, dbSelectMany } from "./db-client.js";

const ACTIVE_PRESCRIPTION_STATUSES = ["issued", "active"];

/**
 * Count active prescriptions in the organization.
 * Used by the dashboard summary.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function countActivePrescriptionsByOrg(client: any, organizationId: EntityId): Promise<number> {
  return dbCountWithFilter(
    client, "prescription",
    [["organization_id", organizationId]],
    { column: "status", values: ACTIVE_PRESCRIPTION_STATUSES },
  );
}

/**
 * Get active prescriptions for a patient within an organization.
 * Used for the patient detail view active prescriptions section.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findActivePrescriptionsByPatient(client: any, patientId: EntityId, organizationId: EntityId): Promise<PrescriptionRow[]> {
  const { data, error } = await dbSelectMany(
    client, "prescription",
    [
      ["patient_id", patientId],
      ["organization_id", organizationId],
    ],
    { orderBy: { column: "issued_at", ascending: false }, limit: 10 },
  );
  if (error) throw new WorkspaceError("db_read_failed", "Failed to read prescriptions.", error.message);
  const rows = (data ?? []) as PrescriptionRow[];
  return rows.filter((p) => ACTIVE_PRESCRIPTION_STATUSES.includes(p.status));
}

/**
 * Get prescriptions for an episode (all statuses), ordered newest first.
 * Used by the episode detail and prescription list views.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findPrescriptionsByEpisode(client: any, episodeId: EntityId): Promise<PrescriptionRow[]> {
  const { data, error } = await dbSelectMany(
    client, "prescription",
    [["treatment_episode_id", episodeId]],
    { orderBy: { column: "created_at", ascending: false } },
  );
  if (error) throw new WorkspaceError("db_read_failed", "Failed to read prescriptions.", error.message);
  return (data ?? []) as PrescriptionRow[];
}

/**
 * Count prescription items for a given prescription.
 * Used to populate itemCount in PrescriptionSummaryVM.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function countItemsByPrescription(client: any, prescriptionId: EntityId): Promise<number> {
  return dbCountWithFilter(
    client, "prescription_item",
    [["prescription_id", prescriptionId]],
  );
}
