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

export function getDoseWindowStatus(params: {
  readonly scheduledAt: string;
  readonly windowStart: string;
  readonly windowEnd: string;
  readonly now: Date;
  readonly takenAt?: string | null;
  readonly skippedAt?: string | null;
  readonly snoozedUntil?: string | null;
}): DoseWindowStatus {
  if (params.takenAt) return "TAKEN";

  if (params.snoozedUntil) {
    const until = new Date(params.snoozedUntil);
    if (
      Number.isFinite(until.getTime()) &&
      until.getTime() >= params.now.getTime()
    ) {
      return "SNOOZED";
    }
  }

  if (params.skippedAt) return "SKIPPED";

  const windowStart = buildDateForLocalTime(params.now, params.windowStart);
  const windowEnd = buildDateForLocalTime(params.now, params.windowEnd);

  const dueSoonStart = new Date(windowStart.getTime() - 30 * 60 * 1000);
  const lateEnd = new Date(windowEnd.getTime() + 30 * 60 * 1000);

  const nowMs = params.now.getTime();
  if (nowMs >= dueSoonStart.getTime() && nowMs < windowStart.getTime())
    return "DUE_SOON";
  if (nowMs >= windowStart.getTime() && nowMs <= windowEnd.getTime())
    return "DUE_NOW";
  if (nowMs > windowEnd.getTime() && nowMs <= lateEnd.getTime()) return "LATE";
  if (nowMs > lateEnd.getTime()) return "OVERDUE";

  return "DUE_SOON";
}
