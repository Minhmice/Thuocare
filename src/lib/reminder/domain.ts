import { buildDateForLocalTime } from "./time";

export type DoseWindowStatus =
  | "DUE_SOON"
  | "DUE_NOW"
  | "LATE"
  | "OVERDUE"
  | "TAKEN"
  | "SNOOZED"
  | "SKIPPED"
  | "MISSED";

const DEFAULT_DUE_SOON_THRESHOLD_MIN = 30;
const DEFAULT_LATE_GRACE_MIN = 30;
const DEFAULT_MISSED_AFTER_MIN = 360;

function safeParseDate(iso: string): Date | null {
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d : null;
}

export function getDoseWindowStatus(params: {
  readonly scheduledAt: string;
  readonly windowStart: string;
  readonly windowEnd: string;
  readonly now: Date;
  readonly takenAt?: string | null;
  readonly skippedAt?: string | null;
  readonly snoozedUntil?: string | null;
}): DoseWindowStatus {
  // Priority must match docs: TAKEN > SKIPPED > SNOOZED > time-based.
  if (params.takenAt) return "TAKEN";

  if (params.skippedAt) {
    const skipped = safeParseDate(params.skippedAt);
    // If skippedAt is present but malformed, ignore it (treat as unset).
    if (!skipped) {
      // fall through
    } else {
      return "SKIPPED";
    }
  }

  if (params.snoozedUntil) {
    const until = safeParseDate(params.snoozedUntil);
    if (until && until.getTime() > params.now.getTime()) return "SNOOZED";
  }

  const windowStart = buildDateForLocalTime(params.now, params.windowStart);
  const windowEnd = buildDateForLocalTime(params.now, params.windowEnd);

  const dueSoonStart = new Date(
    windowStart.getTime() - DEFAULT_DUE_SOON_THRESHOLD_MIN * 60 * 1000
  );
  const lateEnd = new Date(
    windowEnd.getTime() + DEFAULT_LATE_GRACE_MIN * 60 * 1000
  );
  const missedCutoff = new Date(
    windowEnd.getTime() + DEFAULT_MISSED_AFTER_MIN * 60 * 1000
  );

  const nowMs = params.now.getTime();
  if (nowMs >= dueSoonStart.getTime() && nowMs < windowStart.getTime())
    return "DUE_SOON";
  if (nowMs >= windowStart.getTime() && nowMs <= windowEnd.getTime())
    return "DUE_NOW";
  if (nowMs > windowEnd.getTime() && nowMs <= lateEnd.getTime()) return "LATE";
  if (nowMs > lateEnd.getTime() && nowMs <= missedCutoff.getTime())
    return "OVERDUE";
  if (nowMs > missedCutoff.getTime()) return "MISSED";

  return "DUE_SOON";
}
