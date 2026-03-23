/**
 * Doctor scope evaluators.
 *
 * Doctors are a special category of staff actor. They have a `doctor_profile`
 * row in addition to their `user_account` row, and certain resources
 * (prescriptions, treatment episodes as primary doctor, follow-up plans as owner)
 * track which doctor created or owns them.
 *
 * TWO LEVELS of doctor access:
 *   1. Doctor role check — is the actor a doctor with an active doctor_profile?
 *      Use: requireDoctorActor() from guards/role-guards.ts
 *
 *   2. Doctor-patient relationship — is this specific doctor the primary or
 *      authorized doctor for this patient/resource?
 *      Use: requireDoctorPatientScope() from this module.
 *
 * DESIGN DECISION: The current schema does NOT have a dedicated
 * doctor_patient_assignment table. Doctor-patient relationships are implicit
 * through treatment_episode.primary_doctor_id and encounter.doctor_id.
 *
 * For MVP, any doctor within the same org can access any patient in that org
 * (consistent with typical outpatient clinic models). The stricter
 * episode-level doctor ownership is checked per resource as needed.
 *
 * If a stricter assignment model is required post-MVP, add a
 * doctor_patient_assignment table and update these helpers.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { EntityId } from "@thuocare/contracts";
import { selectOne } from "../internal/supabase-client.js";
import type { AnyActorContext, ResolvedStaffActorContext } from "../actor/actor-types.js";
import {
  DoctorRequiredError,
  ForbiddenError,
  OrganizationMismatchError,
} from "../errors/access-errors.js";

// ─── Doctor identity check ────────────────────────────────────────────────────

/**
 * Check if an actor is a doctor with an active doctor_profile.
 * Returns the narrowed context or null.
 */
export function getDoctorActor(
  actor: AnyActorContext,
): (ResolvedStaffActorContext & { doctorProfileId: EntityId }) | null {
  if (actor.kind === "staff" && actor.role === "doctor" && actor.doctorProfileId !== null) {
    return actor as ResolvedStaffActorContext & { doctorProfileId: EntityId };
  }
  return null;
}

/**
 * Require the actor to be a doctor with an active doctor_profile.
 * Throws `DoctorRequiredError` otherwise.
 */
export function requireDoctorContext(
  actor: AnyActorContext,
): ResolvedStaffActorContext & { doctorProfileId: EntityId } {
  const doctorActor = getDoctorActor(actor);
  if (doctorActor === null) {
    if (actor.kind !== "staff") {
      throw new DoctorRequiredError("Actor is not staff.");
    }
    if (actor.role !== "doctor") {
      throw new DoctorRequiredError(`Actor role is '${actor.role}', expected 'doctor'.`);
    }
    throw new DoctorRequiredError("Doctor has no active doctor_profile.");
  }
  return doctorActor;
}

// ─── Doctor-resource ownership checks ────────────────────────────────────────

/**
 * Check whether the actor (as a doctor) is the primary doctor for a
 * treatment episode.
 *
 * Returns true if:
 * - Actor is a doctor
 * - Actor's doctorProfileId matches the episode's primary_doctor_id
 * - The episode belongs to the actor's organization
 *
 * Returns false on any mismatch. Throws on DB error or not-found.
 */
export async function isDoctorPrimaryForEpisode(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  episodeId: EntityId,
  actor: AnyActorContext,
): Promise<boolean> {
  const doctorActor = getDoctorActor(actor);
  if (doctorActor === null) return false;

  const { data, error } = await selectOne(supabase, "treatment_episode", "id", episodeId);

  if (error !== null || data === null) {
    throw new ForbiddenError(`Treatment episode not found: id=${episodeId}.`);
  }

  const episode = data as Record<string, unknown>;

  // Org boundary check first
  if (episode["organization_id"] !== doctorActor.organizationId) return false;

  return episode["primary_doctor_id"] === doctorActor.doctorProfileId;
}

/**
 * Require the actor to be the primary doctor for the given treatment episode.
 *
 * Use this for actions restricted to the episode's owning doctor
 * (e.g., closing an episode, editing the clinical summary).
 *
 * Throws `DoctorRequiredError` if actor is not a doctor.
 * Throws `ForbiddenError` if doctor is not the primary for this episode.
 */
export async function requireDoctorPrimaryForEpisode(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  episodeId: EntityId,
  actor: AnyActorContext,
): Promise<ResolvedStaffActorContext & { doctorProfileId: EntityId }> {
  const doctorActor = requireDoctorContext(actor);
  const isPrimary = await isDoctorPrimaryForEpisode(supabase, episodeId, actor);
  if (!isPrimary) {
    throw new ForbiddenError(
      `Doctor profile=${doctorActor.doctorProfileId} is not the primary doctor for episode=${episodeId}.`,
    );
  }
  return doctorActor;
}

/**
 * Check whether the doctor is the authoring doctor for a prescription.
 * Returns false on any mismatch.
 */
export async function isDoctorAuthorOfPrescription(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  prescriptionId: EntityId,
  actor: AnyActorContext,
): Promise<boolean> {
  const doctorActor = getDoctorActor(actor);
  if (doctorActor === null) return false;

  const { data, error } = await selectOne(supabase, "prescription", "id", prescriptionId);

  if (error !== null || data === null) {
    throw new ForbiddenError(`Prescription not found: id=${prescriptionId}.`);
  }

  const prescription = data as Record<string, unknown>;

  // Org boundary check
  if (prescription["organization_id"] !== doctorActor.organizationId) {
    throw new OrganizationMismatchError(
      `Prescription org mismatch for id=${prescriptionId}.`,
    );
  }

  return prescription["doctor_id"] === doctorActor.doctorProfileId;
}

/**
 * Verify that the actor-as-doctor is the authoring doctor for the given prescription.
 * Use this when a doctor needs to amend or cancel a prescription draft.
 *
 * Throws `DoctorRequiredError`, `ForbiddenError`, or `OrganizationMismatchError`.
 */
export async function requireDoctorAuthorOfPrescription(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  prescriptionId: EntityId,
  actor: AnyActorContext,
): Promise<ResolvedStaffActorContext & { doctorProfileId: EntityId }> {
  const doctorActor = requireDoctorContext(actor);
  const isAuthor = await isDoctorAuthorOfPrescription(supabase, prescriptionId, actor);
  if (!isAuthor) {
    throw new ForbiddenError(
      `Doctor profile=${doctorActor.doctorProfileId} is not the author of prescription=${prescriptionId}.`,
    );
  }
  return doctorActor;
}
