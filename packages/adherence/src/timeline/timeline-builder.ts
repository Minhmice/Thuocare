/**
 * Timeline builder — merges expanded schedule slots with adherence log rows
 * into view models.
 *
 * DESIGN:
 * - Pure functions; no DB calls.
 * - Slots with no matching log entry get status = 'scheduled' (virtual).
 * - Slots are matched by (prescriptionItemId, scheduledTime) key.
 * - adherenceRate = taken / (taken + missed + skipped); excludes pending slots.
 */

import type { MedicationAdherenceLogRow } from "../domain/types.js";
import type {
  ActiveMedicationVM,
  AdherenceByMedicationVM,
  AdherenceSummaryVM,
  DailyTimelineVM,
  TimelineDoseVM,
} from "../domain/view-models.js";
import type { ActiveItemWithSchedule } from "../repository/item-repo.js";
import type { ExpandedDoseSlot } from "./schedule-expander.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Key for matching expanded slots to log rows. */
function slotKey(prescriptionItemId: string, scheduledTime: string): string {
  return `${prescriptionItemId}|${scheduledTime}`;
}

/** Build a Map<slotKey, MedicationAdherenceLogRow> for O(1) lookups. */
function buildLogIndex(
  logs: MedicationAdherenceLogRow[],
): Map<string, MedicationAdherenceLogRow> {
  const map = new Map<string, MedicationAdherenceLogRow>();
  for (const log of logs) {
    map.set(slotKey(log.prescription_item_id, log.scheduled_time), log);
  }
  return map;
}

/** Build a Map<itemId, ActiveItemWithSchedule> for O(1) lookups. */
function buildItemIndex(
  items: ActiveItemWithSchedule[],
): Map<string, ActiveItemWithSchedule> {
  return new Map(items.map((it) => [it.itemId, it]));
}

function calcAdherenceRate(taken: number, missed: number, skipped: number): number | null {
  const resolved = taken + missed + skipped;
  if (resolved === 0) return null;
  return Math.round((taken / resolved) * 1000) / 10; // 1 decimal place
}

function computeDaysRemaining(startDate: string, daysSupply: number, today: string): number | null {
  if (daysSupply <= 0) return null;
  const endDate = new Date(`${startDate}T00:00:00`);
  endDate.setDate(endDate.getDate() + daysSupply - 1);
  const todayDate = new Date(`${today}T00:00:00`);
  const remaining = Math.ceil(
    (endDate.getTime() - todayDate.getTime()) / 86_400_000,
  );
  return Math.max(0, remaining);
}

// ─── Slot → TimelineDoseVM ────────────────────────────────────────────────────

function buildDoseVM(
  slot: ExpandedDoseSlot,
  item: ActiveItemWithSchedule,
  log: MedicationAdherenceLogRow | undefined,
): TimelineDoseVM {
  const medicationName = item.brandName
    ? `${item.genericName} (${item.brandName})`
    : item.genericName;

  if (log) {
    return {
      logId: log.id,
      prescriptionItemId: slot.prescriptionItemId,
      medicationName,
      strengthText: item.strengthText,
      doseAmount: item.doseAmount,
      doseUnit: item.doseUnit,
      patientInstruction: item.patientInstruction,
      scheduledTime: slot.scheduledTime,
      scheduledDate: slot.scheduledDate,
      actualTakenTime: log.actual_taken_time,
      status: log.status,
      source: log.source,
      notes: log.notes,
      prnFlag: item.prnFlag,
    };
  }

  return {
    logId: null,
    prescriptionItemId: slot.prescriptionItemId,
    medicationName,
    strengthText: item.strengthText,
    doseAmount: item.doseAmount,
    doseUnit: item.doseUnit,
    patientInstruction: item.patientInstruction,
    scheduledTime: slot.scheduledTime,
    scheduledDate: slot.scheduledDate,
    actualTakenTime: null,
    status: "scheduled",
    source: "system",
    notes: null,
    prnFlag: item.prnFlag,
  };
}

// ─── Public builders ──────────────────────────────────────────────────────────

/**
 * Build a DailyTimelineVM for a specific date.
 *
 * @param date        YYYY-MM-DD
 * @param slots       Expanded dose slots for this date
 * @param items       All active items (for medication name / instruction lookups)
 * @param logs        Adherence logs for this date (can include other dates; filtered by key)
 */
export function buildDailyTimeline(
  date: string,
  slots: ExpandedDoseSlot[],
  items: ActiveItemWithSchedule[],
  logs: MedicationAdherenceLogRow[],
): DailyTimelineVM {
  const logIndex = buildLogIndex(logs);
  const itemIndex = buildItemIndex(items);

  const doses: TimelineDoseVM[] = [];
  let taken = 0;
  let missed = 0;
  let skipped = 0;
  let scheduled = 0;

  for (const slot of slots) {
    const item = itemIndex.get(slot.prescriptionItemId);
    if (!item) continue;

    const log = logIndex.get(slotKey(slot.prescriptionItemId, slot.scheduledTime));
    const dose = buildDoseVM(slot, item, log);
    doses.push(dose);

    switch (dose.status) {
      case "taken":     taken++;     break;
      case "missed":    missed++;    break;
      case "skipped":   skipped++;   break;
      case "scheduled": scheduled++; break;
    }
  }

  doses.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  return {
    date,
    doses,
    takenCount: taken,
    missedCount: missed,
    skippedCount: skipped,
    scheduledCount: scheduled,
    adherenceRate: calcAdherenceRate(taken, missed, skipped),
  };
}

/**
 * Build DailyTimelineVM[] for a date range.
 *
 * @param startDate   YYYY-MM-DD
 * @param endDate     YYYY-MM-DD (inclusive)
 * @param slots       All expanded slots for the range
 * @param items       All active items for the range
 * @param logs        All adherence logs for the range
 */
export function buildTimelineRange(
  startDate: string,
  endDate: string,
  slots: ExpandedDoseSlot[],
  items: ActiveItemWithSchedule[],
  logs: MedicationAdherenceLogRow[],
): DailyTimelineVM[] {
  // Group slots by date
  const slotsByDate = new Map<string, ExpandedDoseSlot[]>();
  for (const slot of slots) {
    const existing = slotsByDate.get(slot.scheduledDate) ?? [];
    existing.push(slot);
    slotsByDate.set(slot.scheduledDate, existing);
  }

  const results: DailyTimelineVM[] = [];
  let current = startDate;
  while (current <= endDate) {
    results.push(
      buildDailyTimeline(current, slotsByDate.get(current) ?? [], items, logs),
    );
    const d = new Date(`${current}T00:00:00`);
    d.setDate(d.getDate() + 1);
    current = d.toISOString().slice(0, 10);
  }

  return results;
}

/**
 * Build an AdherenceSummaryVM from adherence log rows.
 * Does NOT require expanded slots — works from resolved log rows only.
 *
 * @param patientId
 * @param periodStart   YYYY-MM-DD
 * @param periodEnd     YYYY-MM-DD
 * @param logs          Adherence logs in the period (any status)
 * @param itemIndex     Map from itemId to ActiveItemWithSchedule (for medication names)
 */
export function buildAdherenceSummary(
  patientId: string,
  periodStart: string,
  periodEnd: string,
  logs: MedicationAdherenceLogRow[],
  items: ActiveItemWithSchedule[],
): AdherenceSummaryVM {
  const itemMap = buildItemIndex(items);

  // Aggregate per item
  const byItem = new Map<
    string,
    { medicationName: string; taken: number; missed: number; skipped: number }
  >();

  let totalTaken = 0;
  let totalMissed = 0;
  let totalSkipped = 0;

  for (const log of logs) {
    if (log.status === "scheduled") continue; // exclude unresolved

    const item = itemMap.get(log.prescription_item_id);
    const medicationName = item
      ? (item.brandName ? `${item.genericName} (${item.brandName})` : item.genericName)
      : "Unknown";

    const agg = byItem.get(log.prescription_item_id) ?? {
      medicationName,
      taken: 0,
      missed: 0,
      skipped: 0,
    };

    switch (log.status) {
      case "taken":   agg.taken++;   totalTaken++;   break;
      case "missed":  agg.missed++;  totalMissed++;  break;
      case "skipped": agg.skipped++; totalSkipped++; break;
    }

    byItem.set(log.prescription_item_id, agg);
  }

  const byMedication: AdherenceByMedicationVM[] = Array.from(byItem.entries()).map(
    ([itemId, agg]) => {
      const resolved = agg.taken + agg.missed + agg.skipped;
      return {
        prescriptionItemId: itemId,
        medicationName: agg.medicationName,
        totalTaken: agg.taken,
        totalMissed: agg.missed,
        totalSkipped: agg.skipped,
        totalResolved: resolved,
        adherenceRate: calcAdherenceRate(agg.taken, agg.missed, agg.skipped),
      };
    },
  );

  const totalResolved = totalTaken + totalMissed + totalSkipped;

  return {
    patientId,
    periodStart,
    periodEnd,
    totalTaken,
    totalMissed,
    totalSkipped,
    totalResolved,
    adherenceRate: calcAdherenceRate(totalTaken, totalMissed, totalSkipped),
    byMedication,
  };
}

/**
 * Build ActiveMedicationVM[] from active items and their schedules.
 *
 * @param items   All active items (including PRN)
 * @param today   YYYY-MM-DD for computing daysRemaining
 */
export function buildActiveMedications(
  items: ActiveItemWithSchedule[],
  today: string,
): ActiveMedicationVM[] {
  return items.map((item) => {
    const medicationName = item.brandName
      ? `${item.genericName} (${item.brandName})`
      : item.genericName;

    const daysRemaining = item.prnFlag
      ? null
      : computeDaysRemaining(item.startDate, item.daysSupply, today);

    // Extract dose_times for fixed_times_daily schedules
    let doseTimes: string[] | null = null;
    const json = item.structuredScheduleJson as
      | { type: string; dose_times?: string[] }
      | null;
    if (json?.type === "fixed_times_daily" && Array.isArray(json.dose_times)) {
      doseTimes = json.dose_times;
    }

    return {
      prescriptionItemId: item.itemId,
      prescriptionId: item.prescriptionId,
      medicationName,
      strengthText: item.strengthText,
      doseAmount: item.doseAmount,
      doseUnit: item.doseUnit,
      frequencyText: item.frequencyText,
      patientInstruction: item.patientInstruction,
      startDate: item.startDate,
      endDate: item.endDate,
      daysRemaining,
      timesPerDay: item.timesPerDay,
      doseTimes,
      prnFlag: item.prnFlag,
      isRefillable: item.isRefillable,
    };
  });
}
