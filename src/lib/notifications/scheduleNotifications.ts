import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import type { Medication } from "../../types/medication";
import { buildDateForLocalTime } from "../reminder/time";
import {
  getAllLocalNotificationRecords,
  getLocalNotificationRecord,
  removeLocalNotificationRecord,
  upsertLocalNotificationRecord,
  clearAllLocalNotificationRecords
} from "./localNotificationStore";
import type {
  MedicationReminderNotificationData,
  NotificationCancelAllResult,
  NotificationCancelResult,
  NotificationRescheduleResult,
  NotificationScheduleResult,
  UpcomingDoseNotification
} from "./types";
import { clampDaysAhead } from "./types";

const ANDROID_CHANNEL_ID = "medication-reminders";

// ── Stable key ──────────────────────────────────────────────────────────────
// The doseId already encodes (scheduledDate, scheduledAt) so it is the
// stable identity for a notification slot.
export function buildStableKey(doseId: string): string {
  return doseId;
}

// ── Local helpers ────────────────────────────────────────────────────────────

function localDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildNotificationBody(names: string[], dosages: string[]): string {
  if (names.length === 1) {
    const label = [names[0], dosages[0]].filter(Boolean).join(" ");
    return `Time to take ${label}`;
  }
  const preview = names.slice(0, 3).join(", ");
  const extra = names.length > 3 ? ` and ${names.length - 3} more` : "";
  return `Time to take ${names.length} medications: ${preview}${extra}`;
}

// ── Upcoming-dose builder (pure, no side-effects) ───────────────────────────

export function buildUpcomingDoseNotifications(
  medications: Medication[],
  opts?: { now?: Date; daysAhead?: number; maxDaysAhead?: number }
): UpcomingDoseNotification[] {
  const now = opts?.now ?? new Date();
  const days = clampDaysAhead(opts?.daysAhead, opts?.maxDaysAhead);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const groupMap = new Map<
    string,
    {
      scheduledDate: string;
      scheduledAt: string;
      scheduledFor: Date;
      medicationIds: string[];
      medicationNames: string[];
      dosages: string[];
    }
  >();

  for (const med of medications) {
    if (!med.scheduledAt) continue;

    for (let offset = 0; offset < days; offset++) {
      const baseDate = new Date(today.getTime() + offset * 86400000);
      let scheduledFor: Date;
      try {
        scheduledFor = buildDateForLocalTime(baseDate, med.scheduledAt);
      } catch {
        if (__DEV__) {
          console.warn(
            `[scheduleNotifications] Skipping med "${med.id}": invalid scheduledAt "${med.scheduledAt}"`
          );
        }
        continue;
      }
      if (scheduledFor.getTime() <= now.getTime()) continue;

      const scheduledDate = localDateString(baseDate);
      const doseId = `${scheduledDate}T${med.scheduledAt}`;
      const group = groupMap.get(doseId);
      if (group) {
        group.medicationIds.push(med.id);
        group.medicationNames.push(med.name);
        group.dosages.push(med.dosage ?? "");
      } else {
        groupMap.set(doseId, {
          scheduledDate,
          scheduledAt: med.scheduledAt,
          scheduledFor,
          medicationIds: [med.id],
          medicationNames: [med.name],
          dosages: [med.dosage ?? ""]
        });
      }
    }
  }

  return [...groupMap.entries()].map(([doseId, g]) => {
    const data: MedicationReminderNotificationData = {
      type: "medication_reminder",
      doseId,
      scheduledDate: g.scheduledDate,
      scheduledAt: g.scheduledAt,
      medicationIds: g.medicationIds
    };
    return {
      doseId,
      stableKey: buildStableKey(doseId),
      scheduledDate: g.scheduledDate,
      scheduledAt: g.scheduledAt,
      scheduledFor: g.scheduledFor,
      medicationIds: g.medicationIds,
      data
    };
  });
}

// ── Core scheduling primitives ───────────────────────────────────────────────

export async function scheduleDoseNotification(params: {
  readonly doseId: string;
  readonly scheduledDate: string;
  readonly scheduledAt: string;
  readonly triggerDate: Date;
  readonly medicationIds: string[];
  readonly title: string;
  readonly body: string;
  readonly osScheduledIds?: ReadonlySet<string>;
}): Promise<NotificationScheduleResult> {
  const {
    doseId,
    scheduledDate,
    scheduledAt,
    triggerDate,
    medicationIds,
    title,
    body,
    osScheduledIds
  } = params;
  const stableKey = buildStableKey(doseId);
  const scheduledForISO = triggerDate.toISOString();

  try {
    const existing = getLocalNotificationRecord(doseId);

    // Same slot, same time — nothing to do.
    if (existing && existing.scheduledForISO === scheduledForISO) {
      // Critical: don't trust store-only dedupe. If OS no longer has this id,
      // treat as unscheduled and create a new OS schedule + refresh store.
      if (osScheduledIds && !osScheduledIds.has(existing.notificationId)) {
        removeLocalNotificationRecord(doseId);
      } else {
      return {
        ok: true,
        doseId,
        stableKey,
        notificationId: existing.notificationId,
        scheduledForISO
      };
      }
    }

    // Time changed — cancel the old notification first.
    if (existing) {
      await Notifications.cancelScheduledNotificationAsync(
        existing.notificationId
      ).catch(() => {
        // Best-effort; the notification may already have fired.
      });
      removeLocalNotificationRecord(doseId);
    }

    const content: Notifications.NotificationContentInput = {
      title,
      body,
      sound: true,
      data: {
        type: "medication_reminder",
        doseId,
        scheduledDate,
        scheduledAt,
        medicationIds
      } satisfies MedicationReminderNotificationData
    };

    if (Platform.OS === "android") {
      // Cast needed because expo-notifications types don't always expose
      // channelId on the generic ContentInput.
      (content as Record<string, unknown>)["channelId"] = ANDROID_CHANNEL_ID;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate
      }
    });

    const nowISO = new Date().toISOString();
    upsertLocalNotificationRecord({
      doseId,
      notificationId,
      stableKey,
      createdAtISO: existing?.createdAtISO ?? nowISO,
      updatedAtISO: nowISO,
      scheduledForISO,
      data: {
        type: "medication_reminder",
        doseId,
        scheduledDate,
        scheduledAt,
        medicationIds
      }
    });

    return { ok: true, doseId, stableKey, notificationId, scheduledForISO };
  } catch (err) {
    return {
      ok: false,
      doseId,
      stableKey,
      errorMessage:
        err instanceof Error ? err.message : "Failed to schedule notification"
    };
  }
}

export async function cancelDoseNotification(
  doseId: string
): Promise<NotificationCancelResult> {
  const existing = getLocalNotificationRecord(doseId);
  if (!existing) return { ok: true, doseId };

  try {
    await Notifications.cancelScheduledNotificationAsync(
      existing.notificationId
    ).catch(() => {});
    removeLocalNotificationRecord(doseId);
    return { ok: true, doseId, notificationId: existing.notificationId };
  } catch (err) {
    return {
      ok: false,
      doseId,
      notificationId: existing.notificationId,
      errorMessage:
        err instanceof Error ? err.message : "Failed to cancel notification"
    };
  }
}

export async function cancelNotificationsForMedication(
  medicationId: string
): Promise<NotificationCancelResult[]> {
  const matching = getAllLocalNotificationRecords().filter((r) => {
    const ids = (r.data as (typeof r.data & { medicationIds?: string[] }) | undefined)
      ?.medicationIds;
    return Array.isArray(ids) && ids.includes(medicationId);
  });
  return Promise.all(matching.map((r) => cancelDoseNotification(r.doseId)));
}

export async function cancelAllMedicationNotifications(): Promise<NotificationCancelAllResult> {
  const records = getAllLocalNotificationRecords();

  // Cancel all at the OS level in one shot (best-effort; never throws).
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Best-effort.
  }

  // Build per-record results from the store snapshot (all treated as ok after OS cancel).
  const canceled: NotificationCancelResult[] = records.map((r) => ({
    ok: true,
    doseId: r.doseId,
    notificationId: r.notificationId
  }));

  clearAllLocalNotificationRecords();

  return { canceled, storeCleared: true };
}

// ── Bulk scheduler ───────────────────────────────────────────────────────────

export async function scheduleNotificationsForMedications(
  medicationsOrParams:
    | Medication[]
    | {
        readonly medications: Medication[];
        readonly daysAhead?: number;
        readonly now?: Date;
        readonly osScheduledIds?: ReadonlySet<string>;
      },
  daysAhead = 7
): Promise<NotificationScheduleResult[]> {
  const nowSnapshot = new Date();
  const meds = Array.isArray(medicationsOrParams)
    ? medicationsOrParams
    : medicationsOrParams.medications;
  const days = Array.isArray(medicationsOrParams)
    ? daysAhead
    : (medicationsOrParams.daysAhead ?? daysAhead);
  const now =
    !Array.isArray(medicationsOrParams) && medicationsOrParams.now
      ? medicationsOrParams.now
      : nowSnapshot;
  const osScheduledIds =
    !Array.isArray(medicationsOrParams) ? medicationsOrParams.osScheduledIds : undefined;

  const upcoming = buildUpcomingDoseNotifications(meds, { daysAhead: days, now });

  // Perf: pre-index meds for name/dosage lookup.
  const byId = new Map(meds.map((m) => [m.id, m]));

  const results: NotificationScheduleResult[] = [];
  for (const dose of upcoming) {
    const names = dose.data.medicationIds.map((id) => {
      const med = byId.get(id);
      return med?.name ?? id;
    });
    const dosages = dose.data.medicationIds.map((id) => {
      const med = byId.get(id);
      return med?.dosage ?? "";
    });

    const result = await scheduleDoseNotification({
      doseId: dose.doseId,
      scheduledDate: dose.scheduledDate,
      scheduledAt: dose.scheduledAt,
      triggerDate: dose.scheduledFor,
      medicationIds: dose.medicationIds,
      title: "Medication Reminder",
      body: buildNotificationBody(names, dosages),
      osScheduledIds
    });
    results.push(result);
  }
  return results;
}

/**
 * Bulk reschedule for all medications — called by MedicationsProvider when
 * the medication list changes. Never throws.
 *
 * Reconciles the full schedule:
 * 1. Builds the desired future notification set.
 * 2. Cancels stale store records not in the desired set (meds removed or
 *    schedule window changed).
 * 3. Schedules/dedupes the desired set (time-change handled inside
 *    `scheduleDoseNotification`).
 *
 * Accepts either the flat array form or an object `{ medications, daysAhead }`.
 */
export async function rescheduleMedicationNotifications(
  medicationsOrParams: Medication[] | { medications: Medication[]; daysAhead?: number },
  daysAhead = 7
): Promise<NotificationScheduleResult[]> {
  let meds: Medication[];
  let days: number;

  if (Array.isArray(medicationsOrParams)) {
    meds = medicationsOrParams;
    days = daysAhead;
  } else {
    meds = medicationsOrParams.medications;
    days = medicationsOrParams.daysAhead ?? daysAhead;
  }

  // Single boundary `now` snapshot for the entire reconciliation.
  const now = new Date();

  // Critical: reconcile against OS scheduled notifications, not just local store.
  const osScheduledIds = new Set<string>();
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const s of scheduled) osScheduledIds.add(s.identifier);
  } catch {
    // Best-effort; fall back to store-only if OS query fails.
  }

  // Determine the desired set of future dose IDs.
  const desired = buildUpcomingDoseNotifications(meds, { daysAhead: days, now });
  const desiredDoseIds = new Set(desired.map((d) => d.doseId));

  // Cancel stale store records that are no longer in the desired set.
  const staleRecords = getAllLocalNotificationRecords().filter(
    (r) => !desiredDoseIds.has(r.doseId)
  );
  await Promise.all(staleRecords.map((r) => cancelDoseNotification(r.doseId)));

  // Schedule desired notifications; dedupe/time-change handled per slot.
  return scheduleNotificationsForMedications({
    medications: meds,
    daysAhead: days,
    now,
    osScheduledIds
  });
}

/**
 * Reschedule a single medication across the horizon. Cancels existing
 * notifications for that medication first, then re-schedules.
 */
export async function rescheduleSingleMedicationNotifications(params: {
  readonly medication: Medication;
  readonly daysAhead?: number;
}): Promise<NotificationRescheduleResult[]> {
  const { medication, daysAhead = 7 } = params;

  const cancelResults = await cancelNotificationsForMedication(medication.id);
  const scheduleResults = await scheduleNotificationsForMedications(
    [medication],
    daysAhead
  );

  const cancelMap = new Map(cancelResults.map((r) => [r.doseId, r]));
  return scheduleResults.map((s) => ({
    ok: s.ok,
    doseId: s.doseId,
    stableKey: s.stableKey,
    canceled: cancelMap.get(s.doseId),
    scheduled: s,
    errorMessage: s.errorMessage
  }));
}
