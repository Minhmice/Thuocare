/**
 * Dose schedule generator.
 *
 * Pure function: given item inputs, produces a deterministic `CreateDoseScheduleInput`
 * ready to be persisted to `dose_schedule`.
 *
 * DESIGN:
 * - No DB calls — all inputs are values.
 * - Output is deterministic for the same input.
 * - Covers all FrequencyCode cases including PRN and interval-based.
 *
 * Schedule types produced:
 *   fixed_times_daily  → QD, BID, TID, QID, QHS, QOD, QW (time-anchored)
 *   interval_based     → Q8H, Q12H (interval from first dose)
 *   prn                → PRN (no fixed times; max daily doses capped)
 */

import type { CreateDoseScheduleInput, JsonValue, TimezoneMode } from "@thuocare/contracts";
import type {
  FixedTimesDailyScheduleJson,
  FrequencyCode,
  IntervalBasedScheduleJson,
  PrnScheduleJson,
} from "../domain/types.js";
import { parseFrequencyCode } from "./frequency.js";

// ─── Input types ──────────────────────────────────────────────────────────────

export interface GenerateScheduleInput {
  prescriptionItemId: string;
  frequencyCode: FrequencyCode;
  durationDays: number;
  startDate: string;                    // ISO date YYYY-MM-DD
  /**
   * Optional hint: override the default first dose time (HH:mm).
   * If not provided, defaults from FREQUENCY_META are used.
   */
  firstDoseTimeHint?: string;
  timezoneMode?: TimezoneMode;
  /**
   * For PRN: maximum doses per day. Defaults to 3 if not set.
   */
  prnMaxDailyDoses?: number;
  /**
   * For PRN: minimum hours between doses. Defaults to 4 if not set.
   */
  prnMinHoursBetween?: number;
  /**
   * Grace window in minutes before a dose is considered late. Default 30.
   */
  graceWindowMinutes?: number;
  /**
   * Minutes after due time when a dose is marked missed. Default 120.
   */
  markMissedAfterMinutes?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build ISO datetime string from a date (YYYY-MM-DD) and time (HH:mm). */
function buildDateTimeString(date: string, time: string): string {
  return `${date}T${time}:00`;
}

/** Add `days` to an ISO date string, return new ISO date string. */
function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Shift a list of default dose times to start from `firstDoseTimeHint`.
 * Preserves the spacing between doses; shifts the whole array.
 */
function shiftDoseTimes(times: string[], firstTimeHint: string): string[] {
  if (times.length === 0) return times;

  const [defaultFirst] = times;
  const [dh, dm] = defaultFirst.split(":").map(Number);
  const [hh, hm] = firstTimeHint.split(":").map(Number);
  const shiftMinutes = (hh * 60 + hm) - (dh * 60 + dm);

  return times.map((t) => {
    const [th, tm] = t.split(":").map(Number);
    const totalMinutes = (th * 60 + tm + shiftMinutes + 1440) % 1440;
    const newH = Math.floor(totalMinutes / 60)
      .toString()
      .padStart(2, "0");
    const newM = (totalMinutes % 60).toString().padStart(2, "0");
    return `${newH}:${newM}`;
  });
}

// ─── Generator ────────────────────────────────────────────────────────────────

/**
 * Generate a `CreateDoseScheduleInput` for a prescription item.
 *
 * This is the primary schedule generation function.
 * Call it after computing the item's frequencyCode and durationDays.
 */
export function generateDoseSchedule(
  input: GenerateScheduleInput,
): CreateDoseScheduleInput {
  const meta = parseFrequencyCode(input.frequencyCode);
  if (meta === null) {
    throw new Error(`Unknown frequency code: ${input.frequencyCode}`);
  }
  const timezone: TimezoneMode = input.timezoneMode ?? "patient_local_time";
  const grace = input.graceWindowMinutes ?? 30;
  const markMissed = input.markMissedAfterMinutes ?? 120;
  const lastDate = addDays(input.startDate, input.durationDays - 1);

  // ── PRN ────────────────────────────────────────────────────────────────────
  if (meta.isPrn) {
    const prnJson: PrnScheduleJson = {
      type: "prn",
      max_daily_doses: input.prnMaxDailyDoses ?? 3,
      min_hours_between_doses: input.prnMinHoursBetween ?? 4,
    };

    return {
      prescription_item_id: input.prescriptionItemId,
      schedule_type: "prn",
      timezone_mode: timezone,
      times_per_day: null,
      structured_schedule_json: prnJson as unknown as JsonValue,
      first_dose_at: null,
      last_dose_at: null,
      grace_window_minutes: grace,
      mark_missed_after_minutes: markMissed,
    };
  }

  // ── Interval-based (Q8H, Q12H) ─────────────────────────────────────────────
  if (meta.isInterval && meta.intervalHours !== null) {
    const firstTime = input.firstDoseTimeHint ?? meta.defaultDoseTimes[0] ?? "08:00";
    const firstDoseAt = buildDateTimeString(input.startDate, firstTime);
    const lastDoseAt = buildDateTimeString(lastDate, firstTime);

    const intervalJson: IntervalBasedScheduleJson = {
      type: "interval_based",
      interval_hours: meta.intervalHours,
    };

    return {
      prescription_item_id: input.prescriptionItemId,
      schedule_type: "interval_based",
      timezone_mode: timezone,
      times_per_day: meta.dosesPerDay,
      structured_schedule_json: intervalJson as unknown as JsonValue,
      first_dose_at: firstDoseAt,
      last_dose_at: lastDoseAt,
      grace_window_minutes: grace,
      mark_missed_after_minutes: markMissed,
    };
  }

  // ── Fixed times daily (QD, BID, TID, QID, QHS, QOD, QW) ──────────────────
  let doseTimes = [...meta.defaultDoseTimes];
  if (input.firstDoseTimeHint && doseTimes.length > 0) {
    doseTimes = shiftDoseTimes(doseTimes, input.firstDoseTimeHint);
  }

  // For QOD / QW, the "last dose" is on the final occurrence day, not the last calendar day.
  // We calculate this from durationDays.
  let lastOccurrenceDate: string;
  if (input.frequencyCode === "QOD") {
    // Last occurrence = start + 2*(floor(durationDays/2)) days
    const occurrences = Math.floor(input.durationDays / 2);
    lastOccurrenceDate = addDays(input.startDate, occurrences * 2);
  } else if (input.frequencyCode === "QW") {
    const occurrences = Math.floor(input.durationDays / 7);
    lastOccurrenceDate = addDays(input.startDate, occurrences * 7);
  } else {
    lastOccurrenceDate = lastDate;
  }

  const firstTime = doseTimes[0] ?? "08:00";
  const lastTime = doseTimes[doseTimes.length - 1] ?? firstTime;

  const firstDoseAt = buildDateTimeString(input.startDate, firstTime);
  const lastDoseAt = buildDateTimeString(lastOccurrenceDate, lastTime);

  const fixedJson: FixedTimesDailyScheduleJson = {
    type: "fixed_times_daily",
    dose_times: doseTimes,
    // QOD: only alternate days; QW: only one day per week.
    // We store days_of_week only for QW as "same weekday as start".
    days_of_week:
      input.frequencyCode === "QW"
        ? [new Date(`${input.startDate}T00:00:00`).getDay()]
        : undefined,
  };

  return {
    prescription_item_id: input.prescriptionItemId,
    schedule_type: "fixed_times_daily",
    timezone_mode: timezone,
    times_per_day:
      input.frequencyCode === "QOD" || input.frequencyCode === "QW"
        ? 1
        : meta.dosesPerDay,
    structured_schedule_json: fixedJson as unknown as JsonValue,
    first_dose_at: firstDoseAt,
    last_dose_at: lastDoseAt,
    grace_window_minutes: grace,
    mark_missed_after_minutes: markMissed,
  };
}
