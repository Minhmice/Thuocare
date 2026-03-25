import type { AnyActorContext } from "@thuocare/auth";

import type { PersonalDbClient } from "../repository/db-client.js";
import { fetchPersonalMedications } from "../repository/personal-medication-repo.js";
import {
  deletePersonalAdherenceLog,
  fetchPersonalAdherenceLogs,
  fetchPersonalAdherenceLogsForMedicationRange,
  fetchPersonalAdherenceLogsRange,
  upsertPersonalAdherenceLog,
} from "../repository/personal-adherence-repo.js";
import type {
  PersonalMedicationRow,
  PersonalAdherenceLogRow,
  MarkPersonalDoseTakenInput,
  MarkPersonalDoseSkippedInput,
  GetPersonalTimelineInput,
  ResetPersonalDoseInput,
  DoseScheduleJson,
} from "../domain/types.js";
import { PersonalError } from "../errors/personal-errors.js";
import type {
  PersonalDoseVM,
  PersonalDailyTimelineVM,
  PersonalMedicationAdherenceSnippetVM,
} from "../domain/view-models.js";
import { enumerateLocalCalendarDaysInclusive } from "../util/enumerate-local-calendar-days.js";

// ─── Schedule expansion (inline, mirrors @thuocare/adherence logic) ────────────

function expandScheduleForDate(
  med: PersonalMedicationRow,
  date: string,
): string[] {
  const schedule: DoseScheduleJson = med.dose_schedule_json;

  // Don't expand if medication not yet started or already ended
  if (date < med.start_date) return [];
  if (med.end_date && date > med.end_date) return [];
  if (med.status === "stopped") return [];

  if (schedule.type === "prn") return [];

  if (schedule.type === "fixed_times_daily") {
    // Check days_of_week if set
    if (schedule.days_of_week && schedule.days_of_week.length > 0) {
      const [y, m, d] = date.split("-").map(Number);
      const dow = new Date(y, m - 1, d).getDay();
      if (!schedule.days_of_week.includes(dow)) return [];
    }
    return schedule.dose_times.map((t) => `${date}T${t}:00`);
  }

  if (schedule.type === "interval_based") {
    // Generate slots at interval from start of day
    const slots: string[] = [];
    const hours = schedule.interval_hours;
    if (hours <= 0 || hours > 24) return [];
    let hour = 6; // start at 06:00
    while (hour < 24) {
      const hh = String(Math.floor(hour)).padStart(2, "0");
      const mm = String(Math.round((hour % 1) * 60)).padStart(2, "0");
      slots.push(`${date}T${hh}:${mm}:00`);
      hour += hours;
    }
    return slots;
  }

  return [];
}

// ─── Timeline builder ─────────────────────────────────────────────────────────

function buildPersonalTimeline(
  medications: PersonalMedicationRow[],
  logs: PersonalAdherenceLogRow[],
  date: string,
): PersonalDailyTimelineVM {
  const logMap = new Map<string, PersonalAdherenceLogRow>();
  for (const log of logs) {
    const key = `${log.personal_medication_id}:${log.scheduled_time}`;
    logMap.set(key, log);
  }

  const doses: PersonalDoseVM[] = [];

  for (const med of medications) {
    if (med.status === "stopped") continue;
    const prnFlag = med.dose_schedule_json.type === "prn";

    if (prnFlag) {
      // Show PRN entries from logs only
      for (const log of logs) {
        if (log.personal_medication_id !== med.id) continue;
        doses.push({
          logId: log.id,
          personalMedicationId: med.id,
          medicationName: med.display_name,
          strengthText: med.strength_text,
          doseAmount: med.dose_amount,
          doseUnit: med.dose_unit,
          scheduledTime: log.scheduled_time,
          scheduledDate: date,
          actualTakenTime: log.actual_taken_time,
          status: log.status,
          notes: log.notes,
          prnFlag: true,
        });
      }
      continue;
    }

    const slots = expandScheduleForDate(med, date);
    for (const scheduledTime of slots) {
      const key = `${med.id}:${scheduledTime}`;
      const log = logMap.get(key);
      doses.push({
        logId: log?.id ?? null,
        personalMedicationId: med.id,
        medicationName: med.display_name,
        strengthText: med.strength_text,
        doseAmount: med.dose_amount,
        doseUnit: med.dose_unit,
        scheduledTime,
        scheduledDate: date,
        actualTakenTime: log?.actual_taken_time ?? null,
        status: log?.status ?? "scheduled",
        notes: log?.notes ?? null,
        prnFlag: false,
      });
    }
  }

  doses.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  // Compute adherence rate (exclude scheduled)
  const resolved = doses.filter((d) => d.status !== "scheduled");
  const taken = resolved.filter((d) => d.status === "taken");
  const adherenceRate = resolved.length > 0 ? taken.length / resolved.length : null;

  return { date, doses, adherenceRate };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getPersonalTimeline(
  db: PersonalDbClient,
  actor: AnyActorContext,
  input: GetPersonalTimelineInput,
): Promise<PersonalDailyTimelineVM> {
  if (actor.kind !== "patient") {
    return { date: input.date, doses: [], adherenceRate: null };
  }

  const [medications, logs] = await Promise.all([
    fetchPersonalMedications(db, actor.patientId),
    fetchPersonalAdherenceLogs(db, actor.patientId, input.date),
  ]);

  return buildPersonalTimeline(medications, logs, input.date);
}

export async function getPersonalTimelineRange(
  db: PersonalDbClient,
  actor: AnyActorContext,
  patientId: string,
  startDate: string,
  endDate: string,
): Promise<PersonalDailyTimelineVM[]> {
  if (actor.kind !== "patient") return [];

  const [medications, allLogs] = await Promise.all([
    fetchPersonalMedications(db, actor.patientId),
    fetchPersonalAdherenceLogsRange(db, actor.patientId, startDate, endDate),
  ]);

  const results: PersonalDailyTimelineVM[] = [];
  const dayKeys = enumerateLocalCalendarDaysInclusive(startDate, endDate);
  for (const dateStr of dayKeys) {
    const dayLogs = allLogs.filter((l) => l.scheduled_date === dateStr);
    results.push(buildPersonalTimeline(medications, dayLogs, dateStr));
  }

  return results;
}

export async function markPersonalDoseTaken(
  db: PersonalDbClient,
  actor: AnyActorContext,
  input: MarkPersonalDoseTakenInput,
): Promise<PersonalAdherenceLogRow> {
  if (actor.kind !== "patient") throw new Error("Patient actor required");

  const scheduledDate = input.scheduledTime.slice(0, 10);
  const now = new Date().toISOString();

  return upsertPersonalAdherenceLog(
    db,
    input.patientId,
    input.personalMedicationId,
    input.scheduledTime,
    scheduledDate,
    "taken",
    input.actualTakenTime ?? now,
    "user",
    input.notes ?? null,
  );
}

export async function markPersonalDoseSkipped(
  db: PersonalDbClient,
  actor: AnyActorContext,
  input: MarkPersonalDoseSkippedInput,
): Promise<PersonalAdherenceLogRow> {
  if (actor.kind !== "patient") throw new Error("Patient actor required");

  const scheduledDate = input.scheduledTime.slice(0, 10);

  return upsertPersonalAdherenceLog(
    db,
    input.patientId,
    input.personalMedicationId,
    input.scheduledTime,
    scheduledDate,
    "skipped",
    null,
    "user",
    input.notes ?? null,
  );
}

/**
 * Undo a mistaken mark (taken/skipped) or remove a PRN log so the slot shows as scheduled again.
 */
export async function resetPersonalDoseLog(
  db: PersonalDbClient,
  actor: AnyActorContext,
  input: ResetPersonalDoseInput,
): Promise<void> {
  if (actor.kind !== "patient") {
    throw new PersonalError("patient_mismatch", "Patient actor required");
  }
  if (actor.patientId !== input.patientId) {
    throw new PersonalError("patient_mismatch", "Patient id mismatch");
  }

  if (input.prnFlag) {
    if (!input.logId) {
      throw new PersonalError("invalid_dose_reset", "PRN reset requires log id");
    }
    await deletePersonalAdherenceLog(db, input.logId, input.patientId);
    return;
  }

  if (!input.logId) {
    throw new PersonalError("invalid_dose_reset", "No adherence log to reset");
  }

  await deletePersonalAdherenceLog(db, input.logId, input.patientId);
}

export interface GetPersonalMedicationAdherenceSnippetInput {
  patientId: string;
  personalMedicationId: string;
  startDate: string;
  endDate: string;
}

/**
 * Small adherence window + recent log lines for the medication detail screen.
 */
export async function getPersonalMedicationAdherenceSnippet(
  db: PersonalDbClient,
  actor: AnyActorContext,
  input: GetPersonalMedicationAdherenceSnippetInput,
): Promise<PersonalMedicationAdherenceSnippetVM> {
  if (actor.kind !== "patient") {
    throw new PersonalError("patient_mismatch", "Patient actor required");
  }
  if (actor.patientId !== input.patientId) {
    throw new PersonalError("patient_mismatch", "Patient id mismatch");
  }

  const logs = await fetchPersonalAdherenceLogsForMedicationRange(
    db,
    input.patientId,
    input.personalMedicationId,
    input.startDate,
    input.endDate,
  );

  let takenCount = 0;
  let missedCount = 0;
  let skippedCount = 0;
  for (const log of logs) {
    if (log.status === "taken") takenCount++;
    else if (log.status === "missed") missedCount++;
    else if (log.status === "skipped") skippedCount++;
  }

  const resolved = takenCount + missedCount + skippedCount;
  const adherenceRate = resolved > 0 ? takenCount / resolved : null;

  const recentEvents = logs.slice(0, 8).map((row) => ({
    scheduledTime: row.scheduled_time,
    scheduledDate: row.scheduled_date,
    status: row.status,
    actualTakenTime: row.actual_taken_time,
  }));

  return {
    startDate: input.startDate,
    endDate: input.endDate,
    takenCount,
    missedCount,
    skippedCount,
    adherenceRate,
    recentEvents,
  };
}
