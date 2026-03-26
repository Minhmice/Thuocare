function pad2(value: number) {
  return value.toString().padStart(2, "0");
}

/** Local (device) date string in YYYY-MM-DD. */
export function getLocalIsoDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}-${m}-${d}`;
}

export function formatTimeHHmm(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function formatCountdownHhMmSs(msRemaining: number): string {
  const safe = Math.max(0, Math.floor(msRemaining));
  const totalSeconds = Math.floor(safe / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

