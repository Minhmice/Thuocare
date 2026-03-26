/**
 * Domain types for the Personal Lane.
 *
 * These mirror the DB tables personal_medication and personal_adherence_log.
 * SQL DDL for these tables should be added to a Phase 11 migration.
 */

import type { EntityId, IsoDate, IsoDateTime } from "@thuocare/contracts";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const PERSONAL_MED_STATUS_VALUES = ["active", "paused", "stopped"] as const;
export type PersonalMedStatus = (typeof PERSONAL_MED_STATUS_VALUES)[number];

export const PERSONAL_DOSE_STATUS_VALUES = [
  "scheduled",
  "taken",
  "missed",
  "skipped",
] as const;
export type PersonalDoseStatus = (typeof PERSONAL_DOSE_STATUS_VALUES)[number];

export const FREQUENCY_CODE_VALUES = [
  "QD",
  "BID",
  "TID",
  "QID",
  "Q8H",
  "Q12H",
  "QHS",
  "QOD",
  "QW",
  "PRN",
] as const;
export type FrequencyCode = (typeof FREQUENCY_CODE_VALUES)[number];

// ─── Schedule JSON shapes (mirror prescription_item.dose_schedule_json) ───────

export interface FixedTimesDailySchedule {
  type: "fixed_times_daily";
  dose_times: string[];          // ["08:00", "14:00", "20:00"]
  days_of_week?: number[];       // 0=Sun, 6=Sat; omit for every day
}

export interface IntervalBasedSchedule {
  type: "interval_based";
  interval_hours: number;        // e.g. 8 for Q8H
}

export interface PrnSchedule {
  type: "prn";
  max_daily_doses?: number;
  min_hours_between_doses?: number;
}

export type DoseScheduleJson =
  | FixedTimesDailySchedule
  | IntervalBasedSchedule
  | PrnSchedule;

// ─── DB Row shapes ─────────────────────────────────────────────────────────────

/**
 * Mirrors `public.personal_medication` table.
 * A user-created medication routine — no doctor or prescription required.
 */
export interface PersonalMedicationRow {
  id: EntityId;
  /** Links to public.patient.id via personal_profile.patient_id */
  patient_id: EntityId;
  /** Links to public.personal_profile.id */
  personal_profile_id: EntityId;
  /** Links to public.medication_catalog.id — null if user typed a custom name */
  catalog_id: EntityId | null;
  /** Free-text name when not found in catalog */
  custom_name: string | null;
  /** Resolved display name: catalog generic_name or custom_name */
  display_name: string;
  strength_text: string | null;
  dosage_form: string | null;
  dose_amount: number;
  dose_unit: string;
  frequency_code: FrequencyCode;
  dose_schedule_json: DoseScheduleJson;
  start_date: IsoDate;
  end_date: IsoDate | null;
  notes: string | null;
  status: PersonalMedStatus;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

/**
 * Mirrors `public.personal_adherence_log` table.
 */
export interface PersonalAdherenceLogRow {
  id: EntityId;
  patient_id: EntityId;
  personal_medication_id: EntityId;
  scheduled_date: IsoDate;
  scheduled_time: IsoDateTime;
  actual_taken_time: IsoDateTime | null;
  status: PersonalDoseStatus;
  source: "user" | "system";
  notes: string | null;
  created_at: IsoDateTime;
}

/**
 * Mirrors `public.personal_profile` table (Phase 10 migration).
 */
export interface PersonalProfileRow {
  id: EntityId;
  patient_id: EntityId;
  auth_user_id: EntityId | null;
  preferred_name: string | null;
  language_code: string | null;
  timezone: string | null;
  profile_status: "active" | "inactive";
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

// ─── Service inputs ────────────────────────────────────────────────────────────

export interface AddPersonalMedicationInput {
  patientId: EntityId;
  personalProfileId: EntityId;
  catalogId?: EntityId;
  customName?: string;
  displayName: string;
  strengthText?: string;
  dosageForm?: string;
  doseAmount: number;
  doseUnit: string;
  frequencyCode: FrequencyCode;
  doseSchedule: DoseScheduleJson;
  startDate: IsoDate;
  endDate?: IsoDate;
  notes?: string;
}

export interface UpdatePersonalMedicationInput {
  displayName?: string;
  strengthText?: string | null;
  dosageForm?: string | null;
  doseAmount?: number;
  doseUnit?: string;
  frequencyCode?: FrequencyCode;
  doseSchedule?: DoseScheduleJson;
  startDate?: IsoDate;
  endDate?: IsoDate | null;
  notes?: string;
  status?: PersonalMedStatus;
}

/** Undo a mistaken log for today: PRN deletes the row; scheduled slots reset to scheduled. */
export interface ResetPersonalDoseInput {
  patientId: EntityId;
  personalMedicationId: EntityId;
  scheduledTime: IsoDateTime;
  prnFlag: boolean;
  logId: EntityId | null;
}

export interface MarkPersonalDoseTakenInput {
  patientId: EntityId;
  personalMedicationId: EntityId;
  scheduledTime: IsoDateTime;
  actualTakenTime?: IsoDateTime;
  notes?: string;
}

export interface MarkPersonalDoseSkippedInput {
  patientId: EntityId;
  personalMedicationId: EntityId;
  scheduledTime: IsoDateTime;
  notes?: string;
}

export interface GetPersonalTimelineInput {
  patientId: EntityId;
  date: IsoDate;
}

/** Partial settings patch for `personal_profile` (patient-owned row). */
export interface UpdatePersonalProfileSettingsInput {
  preferredName?: string | null;
  timezone?: string | null;
  languageCode?: string | null;
}
