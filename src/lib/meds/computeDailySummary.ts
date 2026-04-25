import type { Medication } from "../../types/medication";
import type {
  DosePeriod,
  HomeStats,
  NextDoseGroup,
  ScheduledDose
} from "../../types/home";

export type DailySummaryResult = {
  schedule: ScheduledDose[];
  stats: HomeStats;
  missedDoseAlert: { medicationName: string } | null;
  stockWarning: { medicationName: string; daysLeft: number } | null;
  nextDose: NextDoseGroup | null;
  allSetToday: boolean;
};

function timeToMinutes(t: string): number {
  const parts = t.split(":");
  const h = parseInt(parts[0] ?? "0", 10);
  const m = parseInt(parts[1] ?? "0", 10);
  // Guard against NaN (empty string, non-numeric, or malformed "HH:MM") so
  // sort comparisons remain deterministic.
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

function medicationToScheduledDose(
  med: Medication,
  scheduledDate: string
): ScheduledDose {
  const inferredStatus: ScheduledDose["status"] = (med.doseStatus ??
    (med.takenAt ? "taken" : "upcoming")) as ScheduledDose["status"];
  const dose: ScheduledDose = {
    id: med.id,
    medicationName: med.name,
    dosage: med.dosage,
    instruction: med.instruction ?? "",
    scheduledDate: med.scheduledDate ?? scheduledDate,
    scheduledAt: med.scheduledAt ?? "08:00",
    period: (med.period ?? "morning") as DosePeriod,
    status: inferredStatus
  };
  if (med.takenAt) {
    dose.takenAt = med.takenAt;
  }
  return dose;
}

function buildNextDoseGroup(
  schedule: ScheduledDose[],
  scheduledDate: string
): NextDoseGroup | null {
  const upcoming = schedule.filter((s) => s.status === "upcoming");
  if (upcoming.length === 0) return null;
  upcoming.sort(
    (a, b) => timeToMinutes(a.scheduledAt) - timeToMinutes(b.scheduledAt)
  );
  const first = upcoming[0]!;
  const slot = first.scheduledAt;
  const now = new Date();
  const nowM = now.getHours() * 60 + now.getMinutes();
  const slotM = timeToMinutes(slot);
  const minutesLate = Math.max(0, nowM - slotM);
  const sameSlot = upcoming.filter((u) => u.scheduledAt === slot);
  return {
    scheduledDate,
    scheduledAt: slot,
    minutesLate,
    medications: sameSlot.map((d) => ({
      id: d.id,
      name: d.medicationName,
      instruction: d.instruction,
      note: d.dosage
    }))
  };
}

function computeStockWarning(
  medications: Medication[]
): { medicationName: string; daysLeft: number } | null {
  // Deduplicate by name, keep the minimum remainingDoses per medication name.
  const stockByName = new Map<string, number>();
  for (const m of medications) {
    if (
      m.remainingDoses != null &&
      m.remainingDoses > 0 &&
      m.remainingDoses <= 5
    ) {
      const existing = stockByName.get(m.name);
      if (existing === undefined || m.remainingDoses < existing) {
        stockByName.set(m.name, m.remainingDoses);
      }
    }
  }
  if (stockByName.size === 0) return null;
  const [name, daysLeft] = [...stockByName.entries()].sort(
    (a, b) => a[1] - b[1]
  )[0]!;
  return { medicationName: name, daysLeft };
}

/**
 * Derives the daily summary (stats, schedule, alerts) for a given day from a
 * flat list of Medication records — the same list returned by getMedications().
 *
 * Medications whose scheduledDate matches todayKey form the active schedule.
 * If none match, the most-recent available date is used as a fallback (useful
 * in development when today's rows haven't been generated yet).
 *
 * Medications that have no scheduledDate at all (definition-only local entries
 * added via the wizard before syncing) are excluded from daily counts.
 */
export function computeDailySummary(
  medications: Medication[],
  todayKey: string
): DailySummaryResult {
  const todayMeds = medications.filter((m) => m.scheduledDate === todayKey);

  // Fallback: if no rows for today, use the most-recent available date.
  let effective = todayMeds;
  let effectiveDate = effective.length > 0 ? todayKey : "";
  if (effective.length === 0) {
    const dates = medications
      .map((m) => m.scheduledDate)
      .filter((d): d is string => Boolean(d));
    if (dates.length > 0) {
      const latest = dates.reduce((a, b) => (a > b ? a : b));
      effective = medications.filter((m) => m.scheduledDate === latest);
      effectiveDate = latest;
    }
  }

  const schedule =
    effective.length > 0 && effectiveDate
      ? effective
          .slice()
          .sort(
            (a, b) =>
              timeToMinutes(a.scheduledAt ?? "08:00") -
              timeToMinutes(b.scheduledAt ?? "08:00")
          )
          .map((m) => medicationToScheduledDose(m, effectiveDate))
      : [];

  const taken = schedule.filter((s) => s.status === "taken").length;
  const missed = schedule.filter((s) => s.status === "missed").length;
  const remaining = schedule.filter((s) => s.status === "upcoming").length;

  const firstMissed = schedule.find((s) => s.status === "missed");
  const missedDoseAlert = firstMissed
    ? { medicationName: firstMissed.medicationName }
    : null;

  const stockWarning = computeStockWarning(medications);
  const nextDose =
    effectiveDate && schedule.length > 0
      ? buildNextDoseGroup(schedule, effectiveDate)
      : null;
  const allSetToday =
    schedule.length > 0 && schedule.every((s) => s.status === "taken");

  return {
    schedule,
    stats: { taken, remaining, missed },
    missedDoseAlert,
    stockWarning,
    nextDose,
    allSetToday
  };
}
