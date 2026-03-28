import { useSyncExternalStore } from "react";
import type { Medication } from "../../types/medication";

type Listener = () => void;

let localMeds: Medication[] = [];
let pendingHighlightId: string | null = null;
const listeners = new Set<Listener>();

function emitChange() {
  for (const listener of listeners) listener();
}

export function addLocalMedication(med: Medication) {
  localMeds = [med, ...localMeds];
  emitChange();
}

export function getLocalMedications() {
  return localMeds;
}

export function clearLocalMedications() {
  localMeds = [];
  emitChange();
}

export function setPendingHighlightId(id: string) {
  pendingHighlightId = id;
}

/** Returns and clears the pending highlight id. */
export function takePendingHighlightId(): string | null {
  const id = pendingHighlightId;
  pendingHighlightId = null;
  return id;
}

export function subscribeLocalMedications(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useLocalMedications() {
  return useSyncExternalStore(subscribeLocalMedications, getLocalMedications, getLocalMedications);
}

