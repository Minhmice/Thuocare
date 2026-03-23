/**
 * Patient repository for doctor workspace.
 *
 * Read-only access to patient and caregiver data.
 * Scoped strictly to organization — no cross-org reads.
 */

import type { CaregiverLinkRow, PatientRow } from "@thuocare/contracts";
import type { EntityId } from "@thuocare/contracts";
import { WorkspaceError } from "../errors/workspace-errors.js";
import {
  dbSelectMany,
  dbSelectManyWithSearch,
  dbSelectOne,
} from "./db-client.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findPatientById(client: any, id: EntityId): Promise<PatientRow | null> {
  const { data, error } = await dbSelectOne(client, "patient", [["id", id]]);
  if (error) throw new WorkspaceError("db_read_failed", "Failed to read patient.", error.message);
  return data as PatientRow | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findPatientsByOrg(client: any, organizationId: EntityId): Promise<PatientRow[]> {
  const { data, error } = await dbSelectMany(
    client, "patient",
    [["organization_id", organizationId]],
    { orderBy: { column: "full_name", ascending: true } },
  );
  if (error) throw new WorkspaceError("db_read_failed", "Failed to read patients.", error.message);
  return (data ?? []) as PatientRow[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findPatientsByOrgWithSearch(client: any, organizationId: EntityId, search: string): Promise<PatientRow[]> {
  const { data, error } = await dbSelectManyWithSearch(
    client, "patient",
    [["organization_id", organizationId]],
    "full_name",
    search,
    { orderBy: { column: "full_name", ascending: true } },
  );
  if (error) throw new WorkspaceError("db_read_failed", "Failed to search patients.", error.message);
  return (data ?? []) as PatientRow[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findCaregiversByPatient(client: any, patientId: EntityId): Promise<CaregiverLinkRow[]> {
  const { data, error } = await dbSelectMany(
    client, "caregiver_link",
    [["patient_id", patientId]],
    { orderBy: { column: "is_primary", ascending: false } },
  );
  if (error) throw new WorkspaceError("db_read_failed", "Failed to read caregivers.", error.message);
  return (data ?? []) as CaregiverLinkRow[];
}
