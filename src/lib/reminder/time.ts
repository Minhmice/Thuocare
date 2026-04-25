export type HHmm = `${string}:${string}`;

export function parseHHmmToMinutes(hhmm: string): number {
  const [hRaw, mRaw] = hhmm.split(":");
  const h = parseInt(hRaw ?? "0", 10);
  const m = parseInt(mRaw ?? "0", 10);
  const safeH = Number.isFinite(h) ? h : 0;
  const safeM = Number.isFinite(m) ? m : 0;
  return safeH * 60 + safeM;
}

export function minutesToHHmm(totalMinutes: number): string {
  const clamped = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = String(Math.floor(clamped / 60)).padStart(2, "0");
  const m = String(clamped % 60).padStart(2, "0");
  return `${h}:${m}`;
}

export function addMinutesToHHmm(hhmm: string, minutes: number): string {
  return minutesToHHmm(parseHHmmToMinutes(hhmm) + minutes);
}

export function buildDateForLocalTime(baseDate: Date, hhmm: string): Date {
  const minutes = parseHHmmToMinutes(hhmm);
  const d = new Date(baseDate);
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d;
}

export function formatHHmmFromDate(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function formatWindowLabel(startHHmm: string, endHHmm: string): string {
  return `${startHHmm}–${endHHmm}`;
}

function clampToMinute(ms: number): number {
  return Math.max(0, Math.floor(ms / 60000));
}

export function formatCountdownLabel(params: {
  readonly now: Date;
  readonly target: Date;
}): string {
  const diffMs = params.target.getTime() - params.now.getTime();
  const mins = clampToMinute(Math.abs(diffMs));
  if (mins <= 1) return diffMs >= 0 ? "now" : "just now";
  return `${mins}m`;
}
