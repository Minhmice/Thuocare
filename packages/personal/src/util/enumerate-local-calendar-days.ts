/**
 * Walk an inclusive YYYY-MM-DD range using local calendar arithmetic (JS Date in local TZ).
 * Never uses UTC day labels (avoids `toISOString().slice(0, 10)` bugs for non-UTC users).
 */
export function enumerateLocalCalendarDaysInclusive(startDate: string, endDate: string): string[] {
  const [ys, ms, ds] = startDate.split("-").map(Number);
  const [ye, me, de] = endDate.split("-").map(Number);
  const cur = new Date(ys, ms - 1, ds);
  const end = new Date(ye, me - 1, de);
  const out: string[] = [];
  while (cur <= end) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const day = String(cur.getDate()).padStart(2, "0");
    out.push(`${y}-${m}-${day}`);
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}
