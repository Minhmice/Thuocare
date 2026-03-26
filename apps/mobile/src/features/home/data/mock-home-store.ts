import { createId } from "@/shared/lib/id";
import type { MockDoseLog, MockDoseStatus } from "@/shared/types/meds";
import { getLocalIsoDate } from "@/core/personal/time";
import { getMedsSnapshot, subscribeMedStore } from "@/shared/mock/med-store";

type Listener = () => void;

let listeners = new Set<Listener>();
let snapshot: { meds: ReturnType<typeof getMedsSnapshot>; doseLogs: MockDoseLog[] };

function emitChange() {
  for (const l of listeners) l();
}

export function subscribeMockHomeStore(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let doseLogs: MockDoseLog[] = [];

function buildScheduledAtIso(localDate: string, hhmm: string) {
  // Create a local-time ISO string: YYYY-MM-DDTHH:mm:00
  return `${localDate}T${hhmm}:00`;
}

function ensureTodayLogs() {
  const today = getLocalIsoDate();
  const expected = new Set<string>();
  const meds = getMedsSnapshot();
  for (const med of meds) {
    if (med.status !== "active") continue;
    for (const t of med.scheduleTimes) {
      expected.add(`${med.id}|${buildScheduledAtIso(today, t)}`);
    }
  }

  // Remove logs that no longer correspond to active meds today.
  // MVP: keep only the current day's active schedule.
  doseLogs = doseLogs.filter((l) => expected.has(`${l.medId}|${l.scheduledAtIso}`));

  const existing = new Set(doseLogs.map((l) => `${l.medId}|${l.scheduledAtIso}`));
  for (const key of expected) {
    if (existing.has(key)) continue;
    const [medId, scheduledAtIso] = key.split("|");
    doseLogs.push({
      id: createId("dose"),
      medId,
      scheduledAtIso,
      status: "scheduled",
      actualTakenAtIso: null,
    });
  }
}

function refreshSnapshot() {
  snapshot = { meds: getMedsSnapshot(), doseLogs };
}

export function getMockHomeState() {
  // IMPORTANT: getSnapshot must be pure/stable for useSyncExternalStore.
  return snapshot;
}

export function setDoseStatus(doseId: string, status: MockDoseStatus) {
  const idx = doseLogs.findIndex((d) => d.id === doseId);
  if (idx < 0) return;
  doseLogs[idx] = {
    ...doseLogs[idx],
    status,
    actualTakenAtIso: status === "taken" ? new Date().toISOString() : null,
  };
  refreshSnapshot();
  emitChange();
}

const AUTO_MISS_GRACE_MS = 60 * 60 * 1000; // 60 minutes (MVP default)

export function runAutoMiss(now: Date = new Date()) {
  const nowMs = now.getTime();
  let changed = false;
  for (let i = 0; i < doseLogs.length; i++) {
    const d = doseLogs[i];
    if (d.status !== "scheduled") continue;
    const t = new Date(d.scheduledAtIso).getTime();
    if (!Number.isFinite(t)) continue;
    if (nowMs - t >= AUTO_MISS_GRACE_MS) {
      doseLogs[i] = { ...d, status: "missed", actualTakenAtIso: null };
      changed = true;
    }
  }
  if (!changed) return;
  refreshSnapshot();
  emitChange();
}

// Initialize snapshot once.
ensureTodayLogs();
refreshSnapshot();

// When meds change, recompute today logs + snapshot.
subscribeMedStore(() => {
  ensureTodayLogs();
  refreshSnapshot();
  emitChange();
});

