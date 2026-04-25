import { useEffect, useState } from "react";

function msUntilNextMinute(now: Date): number {
  const ms = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
  return Math.max(250, ms);
}

export function useMinuteTicker(params?: { readonly intervalMs?: number }) {
  const intervalMs = params?.intervalMs ?? 60000;
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    function startInterval() {
      if (cancelled) return;
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), intervalMs);
    }

    timeout = setTimeout(() => startInterval(), msUntilNextMinute(new Date()));

    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [intervalMs]);

  return now;
}
