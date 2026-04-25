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

export function updateLocalMedication(med: Medication) {
  const i = localMeds.findIndex((m) => m.id === med.id);
  if (i < 0) return;
  localMeds = [...localMeds.slice(0, i), med, ...localMeds.slice(i + 1)];
  emitChange();
}

/** Insert or replace by id (e.g. editing a demo med overlays local copy). */
export function upsertLocalMedication(med: Medication) {
  const i = localMeds.findIndex((m) => m.id === med.id);
  if (i < 0) {
    localMeds = [med, ...localMeds];
  } else {
    localMeds = [...localMeds.slice(0, i), med, ...localMeds.slice(i + 1)];
  }
  emitChange();
}

export function removeLocalMedication(id: string) {
  localMeds = localMeds.filter((m) => m.id !== id);
  emitChange();
}

export function getLocalMedicationById(id: string): Medication | undefined {
  return localMeds.find((m) => m.id === id);
}

export function isLocalMedicationId(id: string): boolean {
  return localMeds.some((m) => m.id === id);
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
  return useSyncExternalStore(
    subscribeLocalMedications,
    getLocalMedications,
    getLocalMedications
  );
}
