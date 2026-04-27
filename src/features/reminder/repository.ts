import type { Medication } from "../../types/medication";
import { upsertLocalMedication } from "../../lib/meds/localMedsStore";
import {
  clearLocalReminderDoseState,
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
import { supabase } from "../../lib/supabase/client";
import { getQueryUserId } from "../../lib/supabase/queryUser";
import type { ReminderDoseVM, ReminderMedicineVM } from "../../lib/reminder/vm";
import {
  labelFromDoseWindowStatus,
  toneFromDoseWindowStatus
} from "../../lib/reminder/vm";

const REMINDER_WINDOW_MINUTES = 120;
const SNOOZE_STEP_MINUTES = 10;
const DOSE_OCCURRENCE_COLUMNS =
  "id, status, taken_at, snoozed_until, skipped_at, skip_reason, window_start_at" as const;

type DoseOccurrenceStatus = "upcoming" | "taken" | "snoozed" | "skipped" | "missed";

type DoseOccurrenceRow = {
  id: string;
  status: DoseOccurrenceStatus;
  taken_at: string | null;
  snoozed_until: string | null;
  skipped_at: string | null;
  skip_reason: string | null;
  window_start_at: string | null;
};

type DoseOccurrenceEventType = "taken" | "snoozed" | "skipped";

type DoseScheduleKey = {
  scheduledDate: string;
  scheduledAt: string;
};

type MergedReminderState = {
  takenAtISO: string | null;
  snoozedUntilISO: string | null;
  skippedAtISO: string | null;
  skipReason?: string;
};

type SupabaseErrorLike = {
  message?: string | null;
  details?: string | null;
  hint?: string | null;
  code?: string | null;
};

function parseSupabaseError(error: unknown): SupabaseErrorLike {
  if (typeof error !== "object" || error === null) {
    if (error instanceof Error) {
      return { message: error.message };
    }
    return {};
  }

  const value = error as {
    message?: unknown;
    details?: unknown;
    hint?: unknown;
    code?: unknown;
  };

  return {
    message: typeof value.message === "string" ? value.message : null,
    details: typeof value.details === "string" ? value.details : null,
    hint: typeof value.hint === "string" ? value.hint : null,
    code: typeof value.code === "string" ? value.code : null
  };
}

function isMissingTableError(error: unknown): boolean {
  const parsed = parseSupabaseError(error);
  const combined = `${parsed.message ?? ""} ${parsed.details ?? ""} ${parsed.hint ?? ""}`.toLowerCase();
  const code = (parsed.code ?? "").toUpperCase();
  if (combined.includes("schema cache")) return true;

  const mentionsReminderTables =
    combined.includes("dose_occurrences") || combined.includes("dose_events");
  if (!mentionsReminderTables) return false;

  if (combined.includes("could not find the table")) return true;
  if (combined.includes("relation") && combined.includes("does not exist")) return true;

  return code === "PGRST205" || code === "42P01";
}

async function safeGetQueryUserId(): Promise<string | null> {
  try {
    const userId = await getQueryUserId();
    return userId ?? null;
  } catch {
    return null;
  }
}

function formatTakenAtHHmmFromISO(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return formatHHmmFromDate(d);
}

function isMedicationTaken(m: Medication): boolean {
  return m.doseStatus === "taken" || Boolean(m.takenAt);
}

function safeParseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d : null;
}

function parseDoseScheduleKey(doseId: string): DoseScheduleKey | null {
  const { scheduledDate, scheduledAt } = parseDoseId(doseId);
  if (!scheduledDate || !scheduledAt) return null;
  return { scheduledDate, scheduledAt };
}

function buildDoseDateTimeFromKey(key: DoseScheduleKey): Date | null {
  const parts = key.scheduledAt.split(":");
  const hour = parseInt((parts[0] ?? "").trim(), 10);
  const minute = parseInt((parts[1] ?? "").trim(), 10);
  const second = parseInt((parts[2] ?? "00").trim(), 10);
  if (
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    !Number.isFinite(second)
  ) {
    return null;
  }
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  const ss = String(second).padStart(2, "0");
  const d = new Date(`${key.scheduledDate}T${hh}:${mm}:${ss}`);
  if (!Number.isFinite(d.getTime())) return null;
  return d;
}

function buildDoseWindowFromKey(key: DoseScheduleKey): {
  windowStartISO: string;
  windowEndISO: string;
} | null {
  const start = buildDoseDateTimeFromKey(key);
  if (!start) return null;
  const end = new Date(start.getTime() + REMINDER_WINDOW_MINUTES * 60 * 1000);
  return {
    windowStartISO: start.toISOString(),
    windowEndISO: end.toISOString()
  };
}

function mergeReminderState(params: {
  localState: ReturnType<typeof getLocalReminderDoseState>;
  remoteOccurrence: DoseOccurrenceRow | null;
}): MergedReminderState {
  const remoteTakenAt = params.remoteOccurrence?.taken_at ?? null;
  const remoteSkippedAt = params.remoteOccurrence?.skipped_at ?? null;

  const skippedAtISO = params.localState?.skippedAtISO ?? remoteSkippedAt ?? null;
  const skipReason =
    params.localState?.skipReason ?? params.remoteOccurrence?.skip_reason ?? undefined;
  const snoozedUntilISO = skippedAtISO
    ? null
    : (params.localState?.snoozedUntilISO ??
      params.remoteOccurrence?.snoozed_until ??
      null);

  return {
    takenAtISO: remoteTakenAt,
    snoozedUntilISO,
    skippedAtISO,
    skipReason
  };
}

function normalizeISOOrNull(value: string | null | undefined): string | null {
  const parsed = safeParseDate(value);
  if (parsed) return parsed.toISOString();
  return value ?? null;
}

function didOccurrenceStateChange(params: {
  previous: DoseOccurrenceRow | null;
  next: DoseOccurrenceRow;
}): boolean {
  const { previous, next } = params;
  if (!previous) return true;

  return (
    previous.status !== next.status ||
    normalizeISOOrNull(previous.taken_at) !== normalizeISOOrNull(next.taken_at) ||
    normalizeISOOrNull(previous.snoozed_until) !==
      normalizeISOOrNull(next.snoozed_until) ||
    normalizeISOOrNull(previous.skipped_at) !==
      normalizeISOOrNull(next.skipped_at) ||
    (previous.skip_reason ?? null) !== (next.skip_reason ?? null)
  );
}

async function hasDoseEventForOccurrence(params: {
  userId: string;
  occurrenceId: string;
  eventType: DoseOccurrenceEventType;
}): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("dose_events")
      .select("id")
      .eq("user_id", params.userId)
      .eq("occurrence_id", params.occurrenceId)
      .eq("event_type", params.eventType)
      .limit(1);

    if (error) {
      if (isMissingTableError(error)) return false;
      return false;
    }
    return Array.isArray(data) && data.length > 0;
  } catch (err) {
    if (isMissingTableError(err)) return false;
    return false;
  }
}

async function rollbackOccurrenceToPreviousState(params: {
  userId: string;
  occurrenceId: string;
  previousOccurrence: DoseOccurrenceRow;
}): Promise<void> {
  try {
    const { error } = await supabase
      .from("dose_occurrences")
      .update({
        status: params.previousOccurrence.status,
        taken_at: params.previousOccurrence.taken_at,
        snoozed_until: params.previousOccurrence.snoozed_until,
        skipped_at: params.previousOccurrence.skipped_at,
        skip_reason: params.previousOccurrence.skip_reason
      })
      .eq("id", params.occurrenceId)
      .eq("user_id", params.userId);

    if (error) {
      // Best-effort rollback; never throw to UI callers.
      return;
    }
  } catch {
    // Best-effort rollback; ignore.
  }
}

async function getRemoteDoseOccurrence(params: {
  userId: string;
  doseKey: DoseScheduleKey;
}): Promise<DoseOccurrenceRow | null> {
  try {
    const { data, error } = await supabase
      .from("dose_occurrences")
      .select(DOSE_OCCURRENCE_COLUMNS)
      .eq("user_id", params.userId)
      .eq("scheduled_date", params.doseKey.scheduledDate)
      .eq("scheduled_at", params.doseKey.scheduledAt)
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error)) return null;
      return null;
    }
    return (data as DoseOccurrenceRow | null) ?? null;
  } catch (err) {
    if (isMissingTableError(err)) return null;
    return null;
  }
}

async function persistDoseAction(params: {
  userId: string;
  doseId: string;
  status: "taken" | "snoozed" | "skipped";
  eventType: DoseOccurrenceEventType;
  eventAtISO: string;
  takenAtISO?: string | null;
  snoozedUntilISO?: string | null;
  skippedAtISO?: string | null;
  skipReason?: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  try {
    const doseKey = parseDoseScheduleKey(params.doseId);
    if (!doseKey) return;
    const window = buildDoseWindowFromKey(doseKey);
    if (!window) return;
    const previousOccurrence = await getRemoteDoseOccurrence({
      userId: params.userId,
      doseKey
    });

    const persistedTakenAtISO =
      params.status === "taken"
        ? previousOccurrence?.status === "taken"
          ? (previousOccurrence.taken_at ??
            params.takenAtISO ??
            params.eventAtISO)
          : (params.takenAtISO ?? params.eventAtISO)
        : null;
    const persistedSkippedAtISO =
      params.status === "skipped"
        ? previousOccurrence?.status === "skipped"
          ? (previousOccurrence.skipped_at ??
            params.skippedAtISO ??
            params.eventAtISO)
          : (params.skippedAtISO ?? params.eventAtISO)
        : null;
    const persistedSkipReason =
      params.status === "skipped"
        ? previousOccurrence?.status === "skipped"
          ? (previousOccurrence.skip_reason ?? params.skipReason ?? null)
          : (params.skipReason ?? null)
        : null;

    const { data, error } = await supabase
      .from("dose_occurrences")
      .upsert(
        {
          user_id: params.userId,
          scheduled_date: doseKey.scheduledDate,
          scheduled_at: doseKey.scheduledAt,
          window_start_at: window.windowStartISO,
          window_end_at: window.windowEndISO,
          status: params.status,
          taken_at: persistedTakenAtISO,
          snoozed_until:
            params.status === "snoozed"
              ? (params.snoozedUntilISO ?? null)
              : null,
          skipped_at: persistedSkippedAtISO,
          skip_reason: persistedSkipReason
        },
        {
          onConflict: "user_id,scheduled_date,scheduled_at"
        }
      )
      .select(DOSE_OCCURRENCE_COLUMNS)
      .single();

    if (error) {
      return;
    }

    const occurrence = data as DoseOccurrenceRow | null;
    if (!occurrence) return;
    const stateChanged = didOccurrenceStateChange({
      previous: previousOccurrence,
      next: occurrence
    });
    if (!stateChanged) {
      const hasPriorEvent = await hasDoseEventForOccurrence({
        userId: params.userId,
        occurrenceId: occurrence.id,
        eventType: params.eventType
      });
      if (hasPriorEvent) {
        return;
      }
    }

    const { error: eventError } = await supabase.from("dose_events").insert({
      user_id: params.userId,
      occurrence_id: occurrence.id,
      event_type: params.eventType,
      event_at: params.eventAtISO,
      payload: params.payload ?? null
    });

    if (eventError) {
      if (stateChanged && previousOccurrence) {
        await rollbackOccurrenceToPreviousState({
          userId: params.userId,
          occurrenceId: occurrence.id,
          previousOccurrence
        });
      }
      return;
    }
  } catch (err) {
    if (isMissingTableError(err)) return;
    return;
  }
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
  const doseKey = parseDoseScheduleKey(params.doseId);
  if (!doseKey) return null;
  const { scheduledDate, scheduledAt } = doseKey;

  const meds = params.medications.filter(
    (m) =>
      m.scheduledDate === scheduledDate && (m.scheduledAt ?? "") === scheduledAt
  );
  if (meds.length === 0) return null;

  const localReminderState = getLocalReminderDoseState(params.doseId);
  const userId = await safeGetQueryUserId();
  const remoteOccurrence =
    userId != null ? await getRemoteDoseOccurrence({ userId, doseKey }) : null;
  const reminderState = mergeReminderState({
    localState: localReminderState,
    remoteOccurrence
  });

  const allTaken = meds.length > 0 && meds.every(isMedicationTaken);
  const takenAtFromMeds = allTaken
    ? (meds.find((m) => m.takenAt)?.takenAt ?? scheduledAt)
    : null;
  const takenAt = takenAtFromMeds ?? reminderState.takenAtISO;

  const windowStartHHmm = scheduledAt;
  const windowEndHHmm = addMinutesToHHmm(scheduledAt, REMINDER_WINDOW_MINUTES);
  const windowStart = buildDateForLocalTime(params.now, windowStartHHmm);
  const windowEnd = buildDateForLocalTime(params.now, windowEndHHmm);

  const windowStatus = getDoseWindowStatus({
    scheduledAt,
    windowStart: windowStartHHmm,
    windowEnd: windowEndHHmm,
    now: params.now,
    takenAt,
    skippedAt: reminderState.skippedAtISO ?? null,
    snoozedUntil: reminderState.snoozedUntilISO ?? null
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

  clearLocalReminderDoseState(params.doseId);

  const userId = await safeGetQueryUserId();
  if (!userId) return;

  try {
    const persistedTakenAtISO =
      safeParseDate(params.takenAtISO)?.toISOString() ??
      new Date().toISOString();
    await persistDoseAction({
      userId,
      doseId: params.doseId,
      status: "taken",
      eventType: "taken",
      eventAtISO: persistedTakenAtISO,
      takenAtISO: persistedTakenAtISO,
      payload: {
        action: "mark_dose_taken",
        medicine_ids: params.medicineIds
      }
    });
  } catch (err) {
    if (isMissingTableError(err)) return;
    return;
  }
}

export async function snoozeDose10m(params: {
  readonly doseId: string;
  readonly now: Date;
}): Promise<void> {
  const doseKey = parseDoseScheduleKey(params.doseId);
  if (!doseKey) return;

  const now =
    Number.isFinite(params.now.getTime()) ? new Date(params.now) : new Date();
  const localState = getLocalReminderDoseState(params.doseId);

  const userId = await safeGetQueryUserId();
  const remoteOccurrence =
    userId != null ? await getRemoteDoseOccurrence({ userId, doseKey }) : null;
  const merged = mergeReminderState({
    localState,
    remoteOccurrence
  });

  if (merged.takenAtISO) {
    clearLocalReminderDoseState(params.doseId);
    return;
  }
  if (merged.skippedAtISO) {
    upsertLocalReminderDoseState({
      doseId: params.doseId,
      skippedAtISO: merged.skippedAtISO,
      skipReason: merged.skipReason
    });
    return;
  }

  const existingUntilMs = safeParseDate(merged.snoozedUntilISO)?.getTime() ?? 0;
  const anchorMs = Math.max(existingUntilMs, now.getTime());
  const nextSnoozedUntilISO = new Date(
    anchorMs + SNOOZE_STEP_MINUTES * 60 * 1000
  ).toISOString();

  upsertLocalReminderDoseState({
    doseId: params.doseId,
    snoozedUntilISO: nextSnoozedUntilISO
  });

  if (!userId) return;

  try {
    await persistDoseAction({
      userId,
      doseId: params.doseId,
      status: "snoozed",
      eventType: "snoozed",
      eventAtISO: now.toISOString(),
      snoozedUntilISO: nextSnoozedUntilISO,
      payload: {
        action: "snooze_10m"
      }
    });
  } catch (err) {
    if (isMissingTableError(err)) return;
    return;
  }
}

export async function snoozeDose(params: {
  readonly doseId: string;
  readonly snoozedUntilISO: string;
}): Promise<void> {
  const explicitUntil = safeParseDate(params.snoozedUntilISO);
  const baseNow = explicitUntil
    ? new Date(explicitUntil.getTime() - SNOOZE_STEP_MINUTES * 60 * 1000)
    : new Date();
  await snoozeDose10m({
    doseId: params.doseId,
    now: baseNow
  });
}

export async function skipDose(params: {
  readonly doseId: string;
  readonly skippedAtISO: string;
  readonly reason?: string;
}): Promise<void> {
  const parsedSkippedAtISO =
    safeParseDate(params.skippedAtISO)?.toISOString() ?? new Date().toISOString();

  const doseKey = parseDoseScheduleKey(params.doseId);
  const userId = await safeGetQueryUserId();
  const remoteOccurrence =
    userId && doseKey
      ? await getRemoteDoseOccurrence({ userId, doseKey })
      : null;
  if (remoteOccurrence?.taken_at || remoteOccurrence?.status === "taken") {
    clearLocalReminderDoseState(params.doseId);
    return;
  }

  const existing = getLocalReminderDoseState(params.doseId);
  if (existing?.skippedAtISO && existing.skippedAtISO >= parsedSkippedAtISO) {
    return;
  }
  upsertLocalReminderDoseState({
    doseId: params.doseId,
    skippedAtISO: parsedSkippedAtISO,
    skipReason: params.reason
  });

  if (!userId) return;

  try {
    await persistDoseAction({
      userId,
      doseId: params.doseId,
      status: "skipped",
      eventType: "skipped",
      eventAtISO: parsedSkippedAtISO,
      skippedAtISO: parsedSkippedAtISO,
      skipReason: params.reason,
      payload: {
        action: "skip_dose",
        reason: params.reason ?? null
      }
    });
  } catch (err) {
    if (isMissingTableError(err)) return;
    return;
  }
}
