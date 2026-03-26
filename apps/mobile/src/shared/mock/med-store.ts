import { createId } from "@/shared/lib/id";
import type { Med, MedStatus } from "@/shared/types/meds";

type Listener = () => void;

let listeners = new Set<Listener>();

function emitChange() {
  for (const l of listeners) l();
}

export function subscribeMedStore(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let meds: Med[] = [
  {
    id: "med_paracetamol",
    displayName: "Paracetamol",
    strengthText: "500 mg",
    scheduleTimes: ["07:00", "13:30"],
    status: "active",
  },
  {
    id: "med_omeprazole",
    displayName: "Omeprazole",
    strengthText: "20 mg",
    scheduleTimes: ["06:30"],
    status: "active",
  },
];

export function getMedsSnapshot() {
  return meds;
}

export function getMedById(id: string) {
  return meds.find((m) => m.id === id) ?? null;
}

export function createMed(input: Omit<Med, "id">) {
  const med: Med = { ...input, id: createId("med") };
  meds = [med, ...meds];
  emitChange();
  return med;
}

export function updateMed(id: string, patch: Partial<Omit<Med, "id">>) {
  const current = getMedById(id);
  if (!current) return null;
  const next = { ...current, ...patch };
  meds = meds.map((m) => (m.id === id ? next : m));
  emitChange();
  return next;
}

export function setMedStatus(id: string, status: MedStatus) {
  return updateMed(id, { status });
}

export function deleteMed(id: string) {
  const exists = meds.some((m) => m.id === id);
  if (!exists) return false;
  meds = meds.filter((m) => m.id !== id);
  emitChange();
  return true;
}

