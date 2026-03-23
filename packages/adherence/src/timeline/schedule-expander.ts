/**
 * Schedule expander — converts a dose_schedule record into a list of
 * concrete scheduled dose timestamps for a given date range.
 *
 * DESIGN:
 * - Pure functions; no DB calls.
 * - Handles all schedule types: fixed_times_daily, interval_based, prn, taper.
 * - QOD detection: uses frequency_code === "QOD" (not stored in JSON).
 * - QW detection: uses days_of_week in FixedTimesDailyScheduleJson.
 * - PRN: returns empty array (no fixed slots).
 * - Taper: expands each step by its times_per_day using evenly-spaced defaults.
 */

import type { ActiveItemWithSchedule } from "../repository/item-repo.js";

// ─── Output type ──────────────────────────────────────────────────────────────

export interface ExpandedDoseSlot {
  prescriptionItemId: string;
  /** ISO datetime string — e.g. "2026-03-22T08:00:00" */
  scheduledTime: string;
  /** YYYY-MM-DD */
  scheduledDate: string;
}

// ─── Internal schedule JSON shapes ───────────────────────────────────────────

interface FixedTimesDailyJson {
  type: "fixed_times_daily";
  dose_times: string[];
  days_of_week?: number[];
}

interface IntervalBasedJson {
  type: "interval_based";
  interval_hours: number;
}

interface TaperJson {
  type: "taper";
  steps: Array<{ days: number; dose_amount: string; times_per_day: number }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Parse YYYY-MM-DD to a local-midnight Date. */
function parseDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00`);
}

/** Format a Date to YYYY-MM-DD. */
function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Difference in whole days (date2 - date1). */
function daysDiff(date1: string, date2: string): number {
  const msPerDay = 86_400_000;
  return Math.round(
    (parseDate(date2).getTime() - parseDate(date1).getTime()) / msPerDay,
  );
}

/** Add `days` to an ISO date string; return new ISO date string. */
function addDays(isoDate: string, days: number): string {
  const d = parseDate(isoDate);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

/** Day of week (0 = Sunday … 6 = Saturday) for an ISO date string. */
function weekdayOf(isoDate: string): number {
  return parseDate(isoDate).getDay();
}

/** Build an ISO datetime string from a date (YYYY-MM-DD) and HH:mm time. */
function toDateTime(date: string, time: string): string {
  return `${date}T${time}:00`;
}

/**
 * Evenly-spaced default dose times for a given times_per_day count.
 * Mirrors the defaults in @thuocare/prescription FREQUENCY_META.
 */
function defaultDoseTimes(timesPerDay: number): string[] {
  switch (timesPerDay) {
    case 1: return ["08:00"];
    case 2: return ["08:00", "20:00"];
    case 3: return ["08:00", "14:00", "20:00"];
    case 4: return ["08:00", "12:00", "16:00", "20:00"];
    default: {
      // For unusual counts, space evenly across 08:00–22:00 (14h window)
      if (timesPerDay <= 0) return [];
      const times: string[] = [];
      const startMin = 8 * 60;
      const windowMin = 14 * 60;
      for (let i = 0; i < timesPerDay; i++) {
        const mins = startMin + Math.round((windowMin / (timesPerDay - 1 || 1)) * i);
        const h = Math.floor(mins / 60).toString().padStart(2, "0");
        const m = (mins % 60).toString().padStart(2, "0");
        times.push(`${h}:${m}`);
      }
      return times;
    }
  }
}

// ─── Per-type expanders ───────────────────────────────────────────────────────

function expandFixedTimesDaily(
  item: ActiveItemWithSchedule,
  json: FixedTimesDailyJson,
  date: string,
): ExpandedDoseSlot[] {
  const { dose_times, days_of_week } = json;
  if (dose_times.length === 0) return [];

  // Bounds check: item must be active on this date
  if (date < item.startDate) return [];
  if (item.endDate && date > item.endDate) return [];

  // QOD: only fire on even-numbered days from startDate
  if (item.frequencyCode === "QOD") {
    const diff = daysDiff(item.startDate, date);
    if (diff % 2 !== 0) return [];
  }

  // QW: only fire on the matching weekday
  if (days_of_week && days_of_week.length > 0) {
    if (!days_of_week.includes(weekdayOf(date))) return [];
  }

  // Respect first_dose_at and last_dose_at date bounds if present
  if (item.firstDoseAt) {
    const firstDate = item.firstDoseAt.slice(0, 10);
    if (date < firstDate) return [];
  }
  if (item.lastDoseAt) {
    const lastDate = item.lastDoseAt.slice(0, 10);
    if (date > lastDate) return [];
  }

  return dose_times.map((t) => ({
    prescriptionItemId: item.itemId,
    scheduledTime: toDateTime(date, t),
    scheduledDate: date,
  }));
}

function expandIntervalBased(
  item: ActiveItemWithSchedule,
  json: IntervalBasedJson,
  date: string,
): ExpandedDoseSlot[] {
  const { interval_hours } = json;
  if (!item.firstDoseAt) return [];

  const firstMs = new Date(item.firstDoseAt).getTime();
  const lastMs = item.lastDoseAt ? new Date(item.lastDoseAt).getTime() : Infinity;
  const intervalMs = interval_hours * 3_600_000;

  const dayStart = new Date(`${date}T00:00:00`).getTime();
  const dayEnd = new Date(`${date}T23:59:59`).getTime();

  const slots: ExpandedDoseSlot[] = [];

  // Walk from firstDoseAt in interval steps; collect those falling on `date`
  // Limit iterations to avoid infinite loop if lastDoseAt is missing
  const maxIterations = Math.ceil((30 * 24) / interval_hours); // cap at 30 days worth
  for (let i = 0; i < maxIterations; i++) {
    const slotMs = firstMs + i * intervalMs;
    if (slotMs > lastMs) break;
    if (slotMs > dayEnd) break;
    if (slotMs >= dayStart && slotMs <= dayEnd) {
      const d = new Date(slotMs);
      const h = d.getHours().toString().padStart(2, "0");
      const m = d.getMinutes().toString().padStart(2, "0");
      const slotDate = formatDate(d);
      slots.push({
        prescriptionItemId: item.itemId,
        scheduledTime: toDateTime(slotDate, `${h}:${m}`),
        scheduledDate: slotDate,
      });
    }
  }

  return slots;
}

function expandTaper(
  item: ActiveItemWithSchedule,
  json: TaperJson,
  date: string,
): ExpandedDoseSlot[] {
  if (!item.startDate) return [];

  // Walk through taper steps to find which one covers `date`
  let stepStartDate = item.startDate;
  for (const step of json.steps) {
    const stepEndDate = addDays(stepStartDate, step.days - 1);
    if (date >= stepStartDate && date <= stepEndDate) {
      const times = defaultDoseTimes(step.times_per_day);
      return times.map((t) => ({
        prescriptionItemId: item.itemId,
        scheduledTime: toDateTime(date, t),
        scheduledDate: date,
      }));
    }
    stepStartDate = addDays(stepStartDate, step.days);
  }

  return [];
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Expand a single item's dose schedule into concrete slots for `date`.
 * PRN items always return an empty array.
 */
export function expandScheduleForDate(
  item: ActiveItemWithSchedule,
  date: string,
): ExpandedDoseSlot[] {
  const json = item.structuredScheduleJson as
    | FixedTimesDailyJson
    | IntervalBasedJson
    | TaperJson
    | { type: "prn" }
    | null;

  if (!json) return [];
  if (json.type === "prn") return [];

  if (json.type === "fixed_times_daily") {
    return expandFixedTimesDaily(item, json, date);
  }
  if (json.type === "interval_based") {
    return expandIntervalBased(item, json, date);
  }
  if (json.type === "taper") {
    return expandTaper(item, json, date);
  }

  return [];
}

/**
 * Expand all items over a date range.
 * Returns a flat array of slots sorted by scheduledTime ascending.
 */
export function expandSchedulesForDateRange(
  items: ActiveItemWithSchedule[],
  startDate: string,
  endDate: string,
): ExpandedDoseSlot[] {
  const slots: ExpandedDoseSlot[] = [];

  // Walk through each date in the range
  let current = startDate;
  while (current <= endDate) {
    for (const item of items) {
      slots.push(...expandScheduleForDate(item, current));
    }
    current = addDays(current, 1);
  }

  slots.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  return slots;
}
