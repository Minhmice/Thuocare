/**
 * Domain types for the adherence tracking module.
 *
 * These represent the medication_adherence_log DB table and the
 * service-layer input/output contracts for patient-facing APIs.
 */

import type { EntityId, IsoDate, IsoDateTime } from "@thuocare/contracts";

// ─── Enum aliases ─────────────────────────────────────────────────────────────

/**
 * Lifecycle status of a single dose slot.
 *   scheduled — dose is due but not yet resolved (virtual; only in timeline, may exist in DB)
 *   taken     — patient confirmed taking the dose
 *   missed    — system marked as missed (past mark_missed_after_minutes with no action)
 *   skipped   — patient explicitly skipped
 */
export type AdherenceStatus = "scheduled" | "taken" | "missed" | "skipped";

/** Who recorded the adherence event. */
export type AdherenceSource = "patient" | "caregiver" | "system";

// ─── DB row ───────────────────────────────────────────────────────────────────

/** `public.medication_adherence_log` row. */
export interface MedicationAdherenceLogRow {
  id: EntityId;
  organization_id: EntityId;
  patient_id: EntityId;
  prescription_item_id: EntityId;
  scheduled_date: IsoDate;
  scheduled_time: IsoDateTime;
  actual_taken_time: IsoDateTime | null;
  status: AdherenceStatus;
  source: AdherenceSource;
  notes: string | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

// ─── Insert input ─────────────────────────────────────────────────────────────

export type CreateAdherenceLogInput = Pick<
  MedicationAdherenceLogRow,
  | "organization_id"
  | "patient_id"
  | "prescription_item_id"
  | "scheduled_date"
  | "scheduled_time"
  | "status"
  | "source"
> & {
  actual_taken_time?: IsoDateTime | null;
  notes?: string | null;
};

// ─── Service inputs ───────────────────────────────────────────────────────────

export interface MarkDoseTakenInput {
  patientId: EntityId;
  organizationId: EntityId;
  prescriptionItemId: EntityId;
  /** ISO datetime string identifying the scheduled dose slot. */
  scheduledTime: IsoDateTime;
  /** Actual time the dose was taken. Defaults to current time. */
  actualTakenTime?: IsoDateTime;
  notes?: string | null;
  /** Defaults to 'patient'. */
  source?: Exclude<AdherenceSource, "system">;
}

export interface MarkDoseSkippedInput {
  patientId: EntityId;
  organizationId: EntityId;
  prescriptionItemId: EntityId;
  scheduledTime: IsoDateTime;
  notes?: string | null;
  /** Defaults to 'patient'. */
  source?: Exclude<AdherenceSource, "system">;
}

export interface GetTimelineInput {
  patientId: EntityId;
  /** Single date to expand. */
  date: IsoDate;
}

export interface GetTimelineRangeInput {
  patientId: EntityId;
  startDate: IsoDate;
  endDate: IsoDate;
}

export interface ProcessMissedDosesInput {
  organizationId: EntityId;
  /** Mark doses scheduled before this datetime as missed if unresolved. */
  cutoffTime: IsoDateTime;
  /**
   * How many hours back from cutoffTime to scan for unresolved doses.
   * Default: 48h. Keeps the scan window bounded for the cron job.
   */
  lookbackHours?: number;
}
