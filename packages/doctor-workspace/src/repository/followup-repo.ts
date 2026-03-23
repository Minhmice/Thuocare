/**
 * Follow-up plan and appointment repository for doctor workspace.
 *
 * Read-only access. No writes — follow-up/appointment creation is out of Phase 4 scope.
 */

import type { AppointmentRow, FollowUpPlanRow } from "@thuocare/contracts";
import type { EntityId } from "@thuocare/contracts";
import { WorkspaceError } from "../errors/workspace-errors.js";
import { dbSelectMany } from "./db-client.js";

// ─── Follow-up plans ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findFollowUpPlansByEpisode(client: any, episodeId: EntityId): Promise<FollowUpPlanRow[]> {
  const { data, error } = await dbSelectMany(
    client, "follow_up_plan",
    [["treatment_episode_id", episodeId]],
    { orderBy: { column: "due_at", ascending: true } },
  );
  if (error) throw new WorkspaceError("db_read_failed", "Failed to read follow-up plans.", error.message);
  return (data ?? []) as FollowUpPlanRow[];
}

// ─── Appointments ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findAppointmentsByEpisode(client: any, episodeId: EntityId): Promise<AppointmentRow[]> {
  const { data, error } = await dbSelectMany(
    client, "appointment",
    [["treatment_episode_id", episodeId]],
    { orderBy: { column: "scheduled_start_at", ascending: true } },
  );
  if (error) throw new WorkspaceError("db_read_failed", "Failed to read appointments.", error.message);
  return (data ?? []) as AppointmentRow[];
}

/** Load upcoming (non-terminal) appointments for a patient. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findUpcomingAppointmentsByPatient(client: any, patientId: EntityId, organizationId: EntityId): Promise<AppointmentRow[]> {
  const { data, error } = await dbSelectMany(
    client, "appointment",
    [
      ["patient_id", patientId],
      ["organization_id", organizationId],
    ],
    { orderBy: { column: "scheduled_start_at", ascending: true }, limit: 5 },
  );
  if (error) throw new WorkspaceError("db_read_failed", "Failed to read appointments.", error.message);
  // Filter for non-terminal statuses in-memory (avoids IN query dependency)
  const rows = (data ?? []) as AppointmentRow[];
  return rows.filter((a) => a.status === "scheduled" || a.status === "confirmed");
}
