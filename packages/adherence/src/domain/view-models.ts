/**
 * View models for the patient medication timeline and adherence tracking.
 *
 * These are the data shapes returned to callers (mobile app, patient portal, etc.)
 * They are pure data — no methods, no DB references.
 */

import type { EntityId, IsoDate, IsoDateTime } from "@thuocare/contracts";
import type { AdherenceSource, AdherenceStatus } from "./types.js";

// ─── Timeline view models ─────────────────────────────────────────────────────

/** One scheduled dose slot in the patient's daily timeline. */
export interface TimelineDoseVM {
  /** Null when the dose has not been logged yet (status = 'scheduled'). */
  logId: EntityId | null;
  prescriptionItemId: EntityId;
  medicationName: string;
  strengthText: string;
  doseAmount: string;
  doseUnit: string;
  patientInstruction: string;
  scheduledTime: IsoDateTime;
  scheduledDate: IsoDate;
  actualTakenTime: IsoDateTime | null;
  status: AdherenceStatus;
  source: AdherenceSource;
  notes: string | null;
  prnFlag: boolean;
}

/** Full timeline for a single calendar date. */
export interface DailyTimelineVM {
  date: IsoDate;
  /** Doses sorted by scheduledTime ascending. */
  doses: TimelineDoseVM[];
  takenCount: number;
  missedCount: number;
  skippedCount: number;
  /** Doses still pending (status = 'scheduled'). */
  scheduledCount: number;
  /**
   * taken / (taken + missed + skipped), expressed as 0–100.
   * null when there are no resolved doses (nothing to score yet).
   */
  adherenceRate: number | null;
}

// ─── Adherence summary ────────────────────────────────────────────────────────

/** Per-medication breakdown within an adherence summary. */
export interface AdherenceByMedicationVM {
  prescriptionItemId: EntityId;
  medicationName: string;
  totalTaken: number;
  totalMissed: number;
  totalSkipped: number;
  totalResolved: number;
  /** null when totalResolved === 0. */
  adherenceRate: number | null;
}

/** Aggregated adherence statistics over a date range. */
export interface AdherenceSummaryVM {
  patientId: EntityId;
  periodStart: IsoDate;
  periodEnd: IsoDate;
  totalTaken: number;
  totalMissed: number;
  totalSkipped: number;
  totalResolved: number;
  /** null when totalResolved === 0. */
  adherenceRate: number | null;
  byMedication: AdherenceByMedicationVM[];
}

// ─── Active medications ───────────────────────────────────────────────────────

/** One active prescription item shown on the patient's medication list. */
export interface ActiveMedicationVM {
  prescriptionItemId: EntityId;
  prescriptionId: EntityId;
  medicationName: string;
  strengthText: string;
  doseAmount: string;
  doseUnit: string;
  frequencyText: string;
  patientInstruction: string;
  startDate: IsoDate;
  endDate: IsoDate | null;
  /** Null for PRN items or when days_supply is unknown. */
  daysRemaining: number | null;
  /** Null for PRN and non-fixed schedules. */
  timesPerDay: number | null;
  /** HH:mm strings. Null when no fixed times (PRN, interval-based). */
  doseTimes: string[] | null;
  prnFlag: boolean;
  isRefillable: boolean;
}
