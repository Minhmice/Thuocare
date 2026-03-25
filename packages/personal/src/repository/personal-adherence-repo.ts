import type { PersonalDbClient } from "./db-client.js";
import type { PersonalAdherenceLogRow, PersonalDoseStatus } from "../domain/types.js";

export async function fetchPersonalAdherenceLogs(
  db: PersonalDbClient,
  patientId: string,
  scheduledDate: string,
): Promise<PersonalAdherenceLogRow[]> {
  const { data, error } = await db
    .from("personal_adherence_log")
    .select("*")
    .eq("patient_id", patientId)
    .eq("scheduled_date", scheduledDate);

  if (error) throw error;
  return (data ?? []) as PersonalAdherenceLogRow[];
}

export async function fetchPersonalAdherenceLogsRange(
  db: PersonalDbClient,
  patientId: string,
  startDate: string,
  endDate: string,
): Promise<PersonalAdherenceLogRow[]> {
  const { data, error } = await db
    .from("personal_adherence_log")
    .select("*")
    .eq("patient_id", patientId)
    .gte("scheduled_date", startDate)
    .lte("scheduled_date", endDate)
    .order("scheduled_time", { ascending: true });

  if (error) throw error;
  return (data ?? []) as PersonalAdherenceLogRow[];
}

export async function upsertPersonalAdherenceLog(
  db: PersonalDbClient,
  patientId: string,
  personalMedicationId: string,
  scheduledTime: string,
  scheduledDate: string,
  status: PersonalDoseStatus,
  actualTakenTime: string | null,
  source: "user" | "system",
  notes: string | null,
): Promise<PersonalAdherenceLogRow> {
  const { data, error } = await db
    .from("personal_adherence_log")
    .upsert(
      {
        patient_id: patientId,
        personal_medication_id: personalMedicationId,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        actual_taken_time: actualTakenTime,
        status,
        source,
        notes,
      },
      { onConflict: "patient_id,personal_medication_id,scheduled_time" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return data as PersonalAdherenceLogRow;
}

export async function deletePersonalAdherenceLog(
  db: PersonalDbClient,
  logId: string,
  patientId: string,
): Promise<void> {
  const { error } = await db
    .from("personal_adherence_log")
    .delete()
    .eq("id", logId)
    .eq("patient_id", patientId);

  if (error) throw error;
}

/** Recent adherence rows for one medication across a date range (newest first). */
export async function fetchPersonalAdherenceLogsForMedicationRange(
  db: PersonalDbClient,
  patientId: string,
  personalMedicationId: string,
  startDate: string,
  endDate: string,
): Promise<PersonalAdherenceLogRow[]> {
  const { data, error } = await db
    .from("personal_adherence_log")
    .select("*")
    .eq("patient_id", patientId)
    .eq("personal_medication_id", personalMedicationId)
    .gte("scheduled_date", startDate)
    .lte("scheduled_date", endDate)
    .order("scheduled_time", { ascending: false });

  if (error) throw error;
  return (data ?? []) as PersonalAdherenceLogRow[];
}
