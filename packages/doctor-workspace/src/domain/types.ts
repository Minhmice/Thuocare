/**
 * Service-layer input, filter, and context types for the doctor workspace module.
 *
 * These are the types that callers (Next.js server actions, API routes, etc.)
 * use to interact with workspace services.
 */

import type { EntityId, IsoDate } from "@thuocare/contracts";
import type { PrescriptionKind, PrescriptionSource } from "@thuocare/contracts";

// ─── Workspace context ────────────────────────────────────────────────────────

/**
 * The resolved context for a doctor's working session.
 * Returned by getDoctorWorkspaceContext() and threaded through service calls.
 */
export interface DoctorWorkspaceContext {
  actorUserId: string;
  userAccountId: EntityId;
  doctorProfileId: EntityId;
  organizationId: EntityId;
  /** May be null if the doctor is not scoped to a specific clinic. */
  clinicId: EntityId | null;
}

// ─── Patient list filters ─────────────────────────────────────────────────────

export interface PatientListFilters {
  /**
   * When true, only patients where the doctor is `primary_doctor_id` on
   * at least one active episode are returned.
   */
  assignedToMe?: boolean;
  /** Only patients with at least one active episode. */
  hasActiveEpisode?: boolean;
  /** Case-insensitive substring match on patient full_name. */
  search?: string;
  /** Defaults to "lastActivity". */
  sortBy?: "lastActivity" | "name";
}

// ─── Phase 8: Monitoring input types ─────────────────────────────────────────

export interface GetPatientsNeedingAttentionInput {
  /** Number of past days to scan adherence logs. Default: 7. */
  windowDays?: number;
  /** Flag if missed dose count >= this value. Default: 2. */
  missedThreshold?: number;
  /** Flag if adherenceRate < this value. Default: 0.8. */
  adherenceThreshold?: number;
}

export interface GetPatientsNearDepletionInput {
  /** Flag items with daysRemaining <= thresholdDays. Default: 5. */
  thresholdDays?: number;
}

export interface GetPatientMonitoringDetailInput {
  patientId: EntityId;
  /** Adherence window in days. Default: 30. */
  adherenceWindowDays?: number;
  /** Depletion threshold in days. Default: 5. */
  depletionThresholdDays?: number;
}

// ─── Create prescription from workspace ───────────────────────────────────────

export interface CreatePrescriptionFromWorkspaceInput {
  patientId: EntityId;
  treatmentEpisodeId: EntityId;
  prescriptionKind: PrescriptionKind;
  issueSource: PrescriptionSource;
  effectiveFrom: IsoDate;
  encounterId?: EntityId | null;
  clinicalNote?: string | null;
  /** Defaults to the actor's doctorProfileId. */
  doctorId?: EntityId | null;
  parentPrescriptionId?: EntityId | null;
}
