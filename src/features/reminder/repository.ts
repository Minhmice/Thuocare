import type { Medication } from "../../types/medication";
import { upsertLocalMedication } from "../../lib/meds/localMedsStore";
import {
  getLocalReminderDoseState,
  upsertLocalReminderDoseState
} from "../../lib/reminder/localReminderStore";
import { parseDoseId } from "../../lib/reminder/doseId";
import { getDoseWindowStatus } from "../../lib/reminder/domain";
import {
  addMinutesToHHmm,
  buildDateForLocalTime,
  formatCountdownLabel,
  formatHHmmFromDate,
  formatWindowLabel
} from "../../lib/reminder/time";
import type { ReminderDoseVM, ReminderMedicineVM } from "../../lib/reminder/vm";
import {
  labelFromDoseWindowStatus,
  toneFromDoseWindowStatus
} from "../../lib/reminder/vm";

function formatTakenAtHHmmFromISO(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return formatHHmmFromDate(d);
}

function isMedicationTaken(m: Medication): boolean {
  return m.doseStatus === "taken" || Boolean(m.takenAt);
}

function computeHeaderLabel(params: {
  readonly statusLabel: string;
  readonly now: Date;
  readonly windowStart: Date;
  readonly windowEnd: Date;
}): string {
  const { statusLabel, now, windowStart, windowEnd } = params;
  if (statusLabel === "DUE NOW") {
    const left = formatCountdownLabel({ now, target: windowEnd });
    return left === "now" ? "Due now" : `Due now · ${left} left`;
  }
  if (statusLabel === "LATE" || statusLabel === "OVERDUE") {
    const lateBy = formatCountdownLabel({ now: windowEnd, target: now });
    return lateBy === "now" ? statusLabel : `${statusLabel} · ${lateBy}`;
  }
  if (statusLabel === "DUE SOON") {
    const inLabel = formatCountdownLabel({ now, target: windowStart });
    return inLabel === "now" ? "Due soon" : `Due soon · ${inLabel}`;
  }
  return statusLabel
    .split(" ")
    .map((w) => w.slice(0, 1) + w.slice(1).toLowerCase())
    .join(" ");
}

function doseLabelFromPeriod(period: Medication["period"]): string {
  switch (period) {
    case "morning":
      return "Morning dose";
    case "afternoon":
      return "Afternoon dose";
    case "evening":
      return "Evening dose";
    case "night":
      return "Night dose";
    default:
      return "Dose";
  }
}

export async function getReminderDoseVM(params: {
  readonly doseId: string;
  readonly medications: Medication[];
  readonly now: Date;
}): Promise<ReminderDoseVM | null> {
  const { scheduledDate, scheduledAt } = parseDoseId(params.doseId);
  if (!scheduledDate || !scheduledAt) return null;

  const meds = params.medications.filter(
    (m) =>
      m.scheduledDate === scheduledDate && (m.scheduledAt ?? "") === scheduledAt
  );
  if (meds.length === 0) return null;

  const reminderState = getLocalReminderDoseState(params.doseId);

  const allTaken = meds.length > 0 && meds.every(isMedicationTaken);
  const takenAt = allTaken
    ? (meds.find((m) => m.takenAt)?.takenAt ?? scheduledAt)
    : null;

  const windowStartHHmm = scheduledAt;
  const windowEndHHmm = addMinutesToHHmm(scheduledAt, 120);
  const windowStart = buildDateForLocalTime(params.now, windowStartHHmm);
  const windowEnd = buildDateForLocalTime(params.now, windowEndHHmm);

  const windowStatus = getDoseWindowStatus({
    scheduledAt,
    windowStart: windowStartHHmm,
    windowEnd: windowEndHHmm,
    now: params.now,
    takenAt,
    skippedAt: reminderState?.skippedAtISO ?? null,
    snoozedUntil: reminderState?.snoozedUntilISO ?? null
  });

  const statusTone = toneFromDoseWindowStatus(windowStatus);
  const statusLabel = labelFromDoseWindowStatus(windowStatus);

  const medicines: ReminderMedicineVM[] = meds.map((m) => ({
    prescriptionItemId: m.id,
    medicineName: m.name,
    doseLabel: m.dosage,
    tipLabel: m.instruction ? m.instruction : undefined,
    statusLabel,
    statusTone
  }));

  return {
    doseId: params.doseId,
    scheduledTimeLabel: scheduledAt,
    doseLabel: doseLabelFromPeriod(meds[0]?.period),
    windowLabel: formatWindowLabel(windowStartHHmm, windowEndHHmm),
    medicineCount: medicines.length,
    headerStatus: {
      label: computeHeaderLabel({
        statusLabel,
        now: params.now,
        windowStart,
        windowEnd
      }),
      tone: statusTone
    },
    medicines
  };
}

export async function markDoseTaken(params: {
  readonly doseId: string;
  readonly takenAtISO: string;
  readonly medicineIds: string[];
  readonly medications: Medication[];
}): Promise<void> {
  const takenAtHHmm = formatTakenAtHHmmFromISO(params.takenAtISO);
  const { scheduledDate, scheduledAt } = parseDoseId(params.doseId);
  for (const medicineId of params.medicineIds) {
    const existing = params.medications.find((m) => m.id === medicineId);
    if (!existing) continue;
    if (isMedicationTaken(existing)) continue;

    upsertLocalMedication({
      ...existing,
      doseStatus: "taken",
      takenAt:
        takenAtHHmm || existing.takenAt || existing.scheduledAt || "08:00",
      scheduledDate: existing.scheduledDate ?? scheduledDate,
      scheduledAt: existing.scheduledAt ?? scheduledAt
    });
  }
}

export async function snoozeDose(params: {
  readonly doseId: string;
  readonly snoozedUntilISO: string;
}): Promise<void> {
  const existing = getLocalReminderDoseState(params.doseId);
  if (
    existing?.snoozedUntilISO &&
    existing.snoozedUntilISO >= params.snoozedUntilISO
  ) {
    return;
  }
  upsertLocalReminderDoseState({
    doseId: params.doseId,
    snoozedUntilISO: params.snoozedUntilISO,
    skippedAtISO: existing?.skippedAtISO,
    skipReason: existing?.skipReason
  });
}

export async function skipDose(params: {
  readonly doseId: string;
  readonly skippedAtISO: string;
  readonly reason?: string;
}): Promise<void> {
  const existing = getLocalReminderDoseState(params.doseId);
  if (existing?.skippedAtISO) return;
  upsertLocalReminderDoseState({
    doseId: params.doseId,
    snoozedUntilISO: existing?.snoozedUntilISO,
    skippedAtISO: params.skippedAtISO,
    skipReason: params.reason
  });
}
