import { useSyncExternalStore } from "react";

type Listener = () => void;

export type LocalReminderDoseState = {
  readonly doseId: string;
  readonly snoozedUntilISO?: string;
  readonly skippedAtISO?: string;
  readonly skipReason?: string;
};

let byDoseId = new Map<string, LocalReminderDoseState>();
const listeners = new Set<Listener>();

function emitChange() {
  for (const listener of listeners) listener();
}

export function getLocalReminderDoseState(
  doseId: string
): LocalReminderDoseState | undefined {
  return byDoseId.get(doseId);
}

export function upsertLocalReminderDoseState(next: LocalReminderDoseState) {
  byDoseId.set(next.doseId, next);
  emitChange();
}

export function clearLocalReminderDoseState(doseId: string) {
  byDoseId.delete(doseId);
  emitChange();
}

export function getAllLocalReminderDoseStates(): LocalReminderDoseState[] {
  return [...byDoseId.values()];
}

export function clearAllLocalReminderDoseStates() {
  byDoseId = new Map();
  emitChange();
}

export function subscribeLocalReminderStore(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useLocalReminderDoseStates() {
  return useSyncExternalStore(
    subscribeLocalReminderStore,
    getAllLocalReminderDoseStates,
    getAllLocalReminderDoseStates
  );
}
