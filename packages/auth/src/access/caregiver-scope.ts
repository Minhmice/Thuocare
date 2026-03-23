/**
 * Caregiver scope evaluators.
 *
 * CURRENT SCHEMA CONSTRAINT:
 * The `caregiver_link` table stores caregiver contact info (name, phone, email,
 * notification_scope) but does NOT have an `auth_user_id` column. Caregivers
 * do NOT have their own system accounts or independent sessions in this schema.
 *
 * What this means for access:
 * - There is no "caregiver actor" in the auth model.
 * - Caregiver visibility is handled by the notification system (push/SMS/email).
 * - A caregiver cannot log in and browse the patient's clinical history.
 *
 * What these helpers cover:
 * - Reading caregiver_link rows to understand a patient's caregiver network
 *   (useful for staff coordinating notifications or follow-up calls).
 * - Checking if a patient has active caregivers and what their notification scope is.
 * - Advisory helpers for future phases where caregiver login may be added.
 *
 * POST-MVP NOTE: If caregiver login is introduced, add `auth_user_id` to
 * caregiver_link, create a CaregiverActorContext type, and extend the actor
 * resolver and capability map accordingly. The access boundaries should be:
 * - Caregivers can see patient name, current medication names, and appointment dates.
 * - Caregivers cannot see clinical notes, diagnoses, or full prescription details.
 * - Caregiver write access is limited to submitting refill requests on behalf of patient.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { EntityId } from "@thuocare/contracts";
import { selectMany } from "../internal/supabase-client.js";
import type { AnyActorContext } from "../actor/actor-types.js";
import { ForbiddenError } from "../errors/access-errors.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CaregiverLinkSummary {
  id: EntityId;
  patientId: EntityId;
  caregiverName: string;
  relationshipType: string;
  notificationScope: string;
  isPrimary: boolean;
  status: string;
}

const caregiverLinkRowSchema = z.object({
  id: z.string(),
  patient_id: z.string(),
  caregiver_name: z.string(),
  relationship_type: z.string(),
  notification_scope: z.string(),
  is_primary: z.boolean(),
  status: z.string(),
});

// ─── Caregiver link lookups ───────────────────────────────────────────────────

/**
 * Load active caregiver links for a patient.
 *
 * Requires the actor to have staff access to this patient (checked via org scope).
 * Returns an empty array if no caregivers are registered.
 *
 * Used by:
 * - Staff viewing patient contact network.
 * - Notification services determining who to notify.
 * - Future caregiver portal feature determining linkage.
 */
export async function loadPatientCaregiverLinks(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  patientId: EntityId,
  actor: AnyActorContext,
): Promise<CaregiverLinkSummary[]> {
  if (actor.kind === "unresolved") {
    throw new ForbiddenError("Unresolved actor cannot read caregiver links.");
  }

  // Patient actor can read their own caregiver links
  if (actor.kind === "patient" && actor.patientId !== patientId) {
    throw new ForbiddenError(
      `Patient actor (${actor.patientId}) cannot read caregiver links for patient=${patientId}.`,
    );
  }

  const { data, error } = await selectMany(
    supabase,
    "caregiver_link",
    "patient_id",
    patientId,
  );

  if (error !== null) {
    throw new ForbiddenError(
      `Failed to load caregiver links for patient=${patientId}: ${error.message}`,
    );
  }

  const rows: CaregiverLinkSummary[] = [];
  for (const raw of data ?? []) {
    const parsed = caregiverLinkRowSchema.safeParse(raw);
    if (parsed.success && parsed.data.status === "active") {
      rows.push({
        id: parsed.data.id,
        patientId: parsed.data.patient_id,
        caregiverName: parsed.data.caregiver_name,
        relationshipType: parsed.data.relationship_type,
        notificationScope: parsed.data.notification_scope,
        isPrimary: parsed.data.is_primary,
        status: parsed.data.status,
      });
    }
  }
  return rows;
}

/**
 * Check whether a patient has at least one active caregiver link.
 * Returns false if none exist or if the actor cannot read the patient's links.
 */
export async function patientHasActiveCaregivers(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  patientId: EntityId,
  actor: AnyActorContext,
): Promise<boolean> {
  const links = await loadPatientCaregiverLinks(supabase, patientId, actor);
  return links.length > 0;
}

/**
 * Get the primary caregiver for a patient, if one exists.
 * Returns null if no primary caregiver is registered.
 */
export async function getPrimaryCaregiverLink(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  patientId: EntityId,
  actor: AnyActorContext,
): Promise<CaregiverLinkSummary | null> {
  const links = await loadPatientCaregiverLinks(supabase, patientId, actor);
  return links.find((l) => l.isPrimary) ?? null;
}
