import { useSyncExternalStore } from "react";
import * as SecureStore from "expo-secure-store";
import type { LocalNotificationRecord, MedicationReminderNotificationData } from "./types";

const STORE_KEY = "thuocare_notification_store_v1";

type Listener = () => void;

let byDoseId = new Map<string, LocalNotificationRecord>();
const listeners = new Set<Listener>();
let _hydrated = false;

function emitChange() {
  for (const l of listeners) l();
}

function serializeStore(): string {
  const entries: Record<string, LocalNotificationRecord> = {};
  for (const [k, v] of byDoseId.entries()) entries[k] = v;
  return JSON.stringify(entries);
}

function parseMedicationReminderData(
  value: unknown
): MedicationReminderNotificationData | null {
  // Back-compat: accept the old shape without `medicationIds` and normalize it.
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;

  if (v["type"] !== "medication_reminder") return null;
  if (typeof v["doseId"] !== "string") return null;
  if (typeof v["scheduledDate"] !== "string") return null;
  if (typeof v["scheduledAt"] !== "string") return null;

  const medicationIdsRaw = v["medicationIds"];
  const medicationIds = Array.isArray(medicationIdsRaw)
    ? medicationIdsRaw.filter((x): x is string => typeof x === "string")
    : [];

  return {
    type: "medication_reminder",
    doseId: v["doseId"],
    scheduledDate: v["scheduledDate"],
    scheduledAt: v["scheduledAt"],
    medicationIds
  };
}

function migrateEntry(raw: unknown, doseIdKey: string): LocalNotificationRecord | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  const doseId = typeof r["doseId"] === "string" ? r["doseId"] : doseIdKey;
  if (!doseId) return null;

  const notificationId =
    typeof r["notificationId"] === "string" ? r["notificationId"] : null;
  if (!notificationId) return null;

  const stableKeyRaw = typeof r["stableKey"] === "string" ? r["stableKey"] : doseId;
  const stableKey = stableKeyRaw.trim() || doseId;

  const createdAtISO =
    typeof r["createdAtISO"] === "string" ? r["createdAtISO"] : new Date().toISOString();
  const updatedAtISO =
    typeof r["updatedAtISO"] === "string" ? r["updatedAtISO"] : createdAtISO;

  const scheduledForISO =
    typeof r["scheduledForISO"] === "string" ? r["scheduledForISO"] : undefined;

  const dataRaw = r["data"];
  const data = parseMedicationReminderData(dataRaw) ?? undefined;

  return {
    doseId,
    notificationId,
    stableKey,
    createdAtISO,
    updatedAtISO,
    scheduledForISO,
    data
  };
}

function deserializeStore(raw: string): Map<string, LocalNotificationRecord> {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return new Map();
    const map = new Map<string, LocalNotificationRecord>();
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      const entry = migrateEntry(v, k);
      if (entry && entry.doseId === k) {
        map.set(k, entry);
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

function persistAsync() {
  const serialized = serializeStore();
  SecureStore.setItemAsync(STORE_KEY, serialized).catch(() => {
    // Non-fatal.
  });
}

export async function hydrateLocalNotificationStore(): Promise<void> {
  if (_hydrated) return;
  try {
    const raw = await SecureStore.getItemAsync(STORE_KEY);
    if (raw) {
      const loaded = deserializeStore(raw);
      for (const [k, v] of loaded.entries()) {
        if (!byDoseId.has(k)) byDoseId.set(k, v);
      }
    }
  } catch {
    // Non-fatal.
  }
  _hydrated = true;
  emitChange();
}

export function getLocalNotificationRecord(
  doseId: string
): LocalNotificationRecord | undefined {
  return byDoseId.get(doseId);
}

export function getAllLocalNotificationRecords(): LocalNotificationRecord[] {
  return [...byDoseId.values()];
}

export function upsertLocalNotificationRecord(next: LocalNotificationRecord) {
  byDoseId.set(next.doseId, next);
  emitChange();
  persistAsync();
}

export function removeLocalNotificationRecord(doseId: string) {
  byDoseId.delete(doseId);
  emitChange();
  persistAsync();
}

export function clearAllLocalNotificationRecords() {
  byDoseId = new Map();
  emitChange();
  persistAsync();
}

export function subscribeLocalNotificationStore(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useLocalNotificationRecords() {
  return useSyncExternalStore(
    subscribeLocalNotificationStore,
    getAllLocalNotificationRecords,
    getAllLocalNotificationRecords
  );
}

void hydrateLocalNotificationStore();

