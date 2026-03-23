/**
 * Data access for `public.follow_up_plan`.
 */

import type { EntityId, FollowUpPlanRow } from "@thuocare/contracts";
import { AppointmentError } from "../errors/appointment-errors.js";
import { dbInsert, dbSelect, dbSelectOne, dbUpdate } from "./db-client.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export async function findFollowUpPlanById(
  client: AnyClient,
  id: EntityId,
): Promise<FollowUpPlanRow | null> {
  try {
    return await dbSelectOne<FollowUpPlanRow>(
      client, "follow_up_plan", "*", (q) => q.eq("id", id),
    );
  } catch (err) {
    throw new AppointmentError("db_read_failed", String(err));
  }
}

export async function findFollowUpPlansByPatient(
  client: AnyClient,
  patientId: EntityId,
): Promise<FollowUpPlanRow[]> {
  try {
    return await dbSelect<FollowUpPlanRow>(
      client, "follow_up_plan", "*",
      (q) => q.eq("patient_id", patientId).order("due_at", { ascending: true }),
    );
  } catch (err) {
    throw new AppointmentError("db_read_failed", String(err));
  }
}

export async function findFollowUpPlansByEpisode(
  client: AnyClient,
  treatmentEpisodeId: EntityId,
): Promise<FollowUpPlanRow[]> {
  try {
    return await dbSelect<FollowUpPlanRow>(
      client, "follow_up_plan", "*",
      (q) => q.eq("treatment_episode_id", treatmentEpisodeId).order("due_at", { ascending: true }),
    );
  } catch (err) {
    throw new AppointmentError("db_read_failed", String(err));
  }
}

export async function insertFollowUpPlan(
  client: AnyClient,
  row: Record<string, unknown>,
): Promise<FollowUpPlanRow> {
  try {
    return await dbInsert<FollowUpPlanRow>(client, "follow_up_plan", row);
  } catch (err) {
    throw new AppointmentError("db_write_failed", String(err));
  }
}

export async function updateFollowUpPlan(
  client: AnyClient,
  id: EntityId,
  patch: Record<string, unknown>,
): Promise<FollowUpPlanRow> {
  try {
    return await dbUpdate<FollowUpPlanRow>(
      client, "follow_up_plan", patch, (q) => q.eq("id", id),
    );
  } catch (err) {
    throw new AppointmentError("db_write_failed", String(err));
  }
}
