/**
 * Local calendar helpers for adherence history windows.
 * Uses the device's local date (not UTC midnight) for YYYY-MM-DD boundaries.
 *
 * Dates are ISO 8601 calendar strings (YYYY-MM-DD), aligned with adherence package inputs.
 */

/** Calendar date string YYYY-MM-DD (same shape as adherence `IsoDate`). */
export type HistoryIsoDate = string;

function parseIsoLocal(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatIsoLocal(d: Date): HistoryIsoDate {
  const y = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${month}-${day}`;
}

/** Today's date in local timezone as YYYY-MM-DD. */
export function localIsoDate(d: Date = new Date()): HistoryIsoDate {
  return formatIsoLocal(d);
}

/** Add calendar days to an ISO date string (local). */
export function addCalendarDays(isoDate: HistoryIsoDate, deltaDays: number): HistoryIsoDate {
  const base = parseIsoLocal(isoDate);
  base.setDate(base.getDate() + deltaDays);
  return formatIsoLocal(base);
}

/**
 * Default history window: last N calendar days inclusive, ending today (local).
 * e.g. daysInclusive=14 → today and the 13 prior days.
 */
export function defaultHistoryRange(daysInclusive = 14): { startDate: HistoryIsoDate; endDate: HistoryIsoDate } {
  const endDate = localIsoDate();
  const startDate = addCalendarDays(endDate, -(daysInclusive - 1));
  return { startDate, endDate };
}

/** Ensure startDate <= endDate for service input. */
export function normalizeHistoryRange(
  startDate: HistoryIsoDate,
  endDate: HistoryIsoDate,
): { startDate: HistoryIsoDate; endDate: HistoryIsoDate } {
  if (startDate <= endDate) {
    return { startDate, endDate };
  }
  return { startDate: endDate, endDate: startDate };
}
