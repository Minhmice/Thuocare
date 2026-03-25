/**
 * View models for Personal Lane — shaped for direct UI consumption.
 */

import type { EntityId, IsoDate, IsoDateTime } from "@thuocare/contracts";
import type { PersonalDoseStatus, FrequencyCode, DoseScheduleJson } from "./types.js";

/**
 * Personal profile summary for display.
 */
export interface PersonalProfileVM {
  personalProfileId: EntityId;
  patientId: EntityId;
  preferredName: string | null;
  timezone: string | null;
  languageCode: string | null;
}

/**
 * Personal medication card shown in medication list.
 */
export interface PersonalMedicationVM {
  id: EntityId;
  displayName: string;
  strengthText: string | null;
  dosageForm: string | null;
  doseAmount: number;
  doseUnit: string;
  frequencyCode: FrequencyCode;
  /** Human-readable frequency label (e.g. "2 lần/ngày") */
  frequencyLabel: string;
  startDate: IsoDate;
  endDate: IsoDate | null;
  notes: string | null;
  status: "active" | "paused" | "stopped";
  isFromCatalog: boolean;
  /** Raw schedule for edit flows (fixed times, interval, PRN). */
  doseSchedule: DoseScheduleJson;
}

/**
 * Single dose slot in the personal timeline.
 */
export interface PersonalDoseVM {
  /** Log id — null if not yet recorded (virtual slot). */
  logId: EntityId | null;
  personalMedicationId: EntityId;
  medicationName: string;
  strengthText: string | null;
  doseAmount: number;
  doseUnit: string;
  scheduledTime: IsoDateTime;
  scheduledDate: IsoDate;
  actualTakenTime: IsoDateTime | null;
  status: PersonalDoseStatus;
  notes: string | null;
  prnFlag: boolean;
}

/**
 * Day container for the personal timeline.
 */
export interface PersonalDailyTimelineVM {
  date: IsoDate;
  doses: PersonalDoseVM[];
  /** null when all doses are still scheduled (no resolved events). */
  adherenceRate: number | null;
}

/** Single log line for medication-detail adherence snippet. */
export interface PersonalAdherenceEventVM {
  scheduledTime: IsoDateTime;
  scheduledDate: IsoDate;
  status: PersonalDoseStatus;
  actualTakenTime: IsoDateTime | null;
}

/** Compact adherence summary for one medication over a window. */
export interface PersonalMedicationAdherenceSnippetVM {
  startDate: IsoDate;
  endDate: IsoDate;
  takenCount: number;
  missedCount: number;
  skippedCount: number;
  /** taken / (taken + missed + skipped); null if none resolved. */
  adherenceRate: number | null;
  recentEvents: PersonalAdherenceEventVM[];
}
