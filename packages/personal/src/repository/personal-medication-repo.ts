import type { PersonalDbClient } from "./db-client.js";
import type {
  PersonalMedicationRow,
  AddPersonalMedicationInput,
  UpdatePersonalMedicationInput,
} from "../domain/types.js";

export async function fetchPersonalMedications(
  db: PersonalDbClient,
  patientId: string,
  statusFilter: Array<"active" | "paused" | "stopped"> = ["active", "paused"],
): Promise<PersonalMedicationRow[]> {
  const { data, error } = await db
    .from("personal_medication")
    .select("*")
    .eq("patient_id", patientId)
    .in("status", statusFilter)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as PersonalMedicationRow[];
}

/** All statuses — for medication management / history surfaces. */
export async function fetchPersonalMedicationsAllStatuses(
  db: PersonalDbClient,
  patientId: string,
): Promise<PersonalMedicationRow[]> {
  const { data, error } = await db
    .from("personal_medication")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as PersonalMedicationRow[];
}

export async function fetchPersonalMedicationById(
  db: PersonalDbClient,
  id: string,
  patientId: string,
): Promise<PersonalMedicationRow | null> {
  const { data, error } = await db
    .from("personal_medication")
    .select("*")
    .eq("id", id)
    .eq("patient_id", patientId)
    .maybeSingle();

  if (error) throw error;
  return data as PersonalMedicationRow | null;
}

export async function insertPersonalMedication(
  db: PersonalDbClient,
  input: AddPersonalMedicationInput,
): Promise<PersonalMedicationRow> {
  const { data, error } = await db
    .from("personal_medication")
    .insert({
      patient_id: input.patientId,
      personal_profile_id: input.personalProfileId,
      catalog_id: input.catalogId ?? null,
      custom_name: input.customName ?? null,
      display_name: input.displayName,
      strength_text: input.strengthText ?? null,
      dosage_form: input.dosageForm ?? null,
      dose_amount: input.doseAmount,
      dose_unit: input.doseUnit,
      frequency_code: input.frequencyCode,
      dose_schedule_json: input.doseSchedule,
      start_date: input.startDate,
      end_date: input.endDate ?? null,
      notes: input.notes ?? null,
      status: "active",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as PersonalMedicationRow;
}

export async function updatePersonalMedication(
  db: PersonalDbClient,
  id: string,
  patientId: string,
  updates: UpdatePersonalMedicationInput,
): Promise<PersonalMedicationRow> {
  const patch: Record<string, unknown> = {};
  if (updates.displayName !== undefined) patch.display_name = updates.displayName;
  if (updates.strengthText !== undefined) patch.strength_text = updates.strengthText;
  if (updates.doseAmount !== undefined) patch.dose_amount = updates.doseAmount;
  if (updates.doseUnit !== undefined) patch.dose_unit = updates.doseUnit;
  if (updates.frequencyCode !== undefined) patch.frequency_code = updates.frequencyCode;
  if (updates.doseSchedule !== undefined) patch.dose_schedule_json = updates.doseSchedule;
  if (updates.startDate !== undefined) patch.start_date = updates.startDate;
  if (updates.endDate !== undefined) patch.end_date = updates.endDate;
  if (updates.notes !== undefined) patch.notes = updates.notes;
  if (updates.status !== undefined) patch.status = updates.status;

  const { data, error } = await db
    .from("personal_medication")
    .update(patch)
    .eq("id", id)
    .eq("patient_id", patientId)
    .select("*")
    .single();

  if (error) throw error;
  return data as PersonalMedicationRow;
}
