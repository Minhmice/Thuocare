import type {
  Medication,
  MedicationDoseStatus,
  MedicationSchedulePeriod
} from "../../types/medication";
import { mockMedications } from "../../mocks/meds";
import { getLocalMedications } from "../../lib/meds/localMedsStore";
import { supabase } from "../../lib/supabase/client";
import { getQueryUserId } from "../../lib/supabase/queryUser";

const MED_COLUMNS =
  "id, name, dosage, schedule, remaining_doses, instruction, scheduled_at, period, dose_status, taken_at, scheduled_date" as const;

type MedicationRow = {
  id: string;
  name: string;
  dosage: string;
  schedule: string;
  remaining_doses: number | null;
  instruction: string;
  scheduled_at: string;
  period: string;
  dose_status: string;
  taken_at: string | null;
  scheduled_date: string;
};

/** Last successful remote list — used by findMedicationById before next fetch. */
let cachedRemoteMedications: Medication[] = [];

/**
 * IDs that have been deleted optimistically — filtered out of the merged list
 * until the remote delete completes (success: refresh clears them from cache;
 * failure: cleared manually and a refresh restores them).
 */
const pendingDeleteIds = new Set<string>();

export function markRemoteDeletePending(id: string) {
  pendingDeleteIds.add(id);
}

export function clearRemoteDeletePending(id: string) {
  pendingDeleteIds.delete(id);
}

function mapMedicationRow(row: MedicationRow): Medication {
  const med: Medication = {
    id: row.id,
    name: row.name,
    dosage: row.dosage,
    schedule: row.schedule,
    instruction: row.instruction ?? "",
    scheduledAt: row.scheduled_at ?? "08:00",
    period: (row.period ?? "morning") as MedicationSchedulePeriod,
    doseStatus: (row.dose_status ?? "upcoming") as MedicationDoseStatus,
    scheduledDate: row.scheduled_date ?? ""
  };
  if (row.remaining_doses != null) {
    med.remainingDoses = row.remaining_doses;
  }
  if (row.taken_at) {
    med.takenAt = row.taken_at;
  }
  return med;
}

async function fetchMedicationsFromSupabase(): Promise<Medication[]> {
  const userId = await getQueryUserId();
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("medications")
    .select(MED_COLUMNS)
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as MedicationRow[]).map(mapMedicationRow);
}

/**
 * Applies local definition edits (name, dosage, schedule, etc.) onto a remote
 * scheduled row, preserving the remote schedule metadata (scheduledDate,
 * scheduledAt, doseStatus, period, takenAt).
 *
 * Used when a local override was created by the wizard/edit flow and therefore
 * lacks scheduledDate — it only captures definition-level fields.
 */
function mergeDefinitionIntoScheduled(
  scheduled: Medication,
  def: Medication
): Medication {
  return {
    ...scheduled,
    name: def.name,
    dosage: def.dosage,
    schedule: def.schedule,
    ...(def.instruction !== undefined && { instruction: def.instruction }),
    ...(def.remainingDoses !== undefined && {
      remainingDoses: def.remainingDoses,
    }),
    ...(def.wizardSnapshot !== undefined && {
      wizardSnapshot: def.wizardSnapshot,
    }),
  };
}

/**
 * Merge a remote snapshot with the current local store.
 * Dose-level overrides (local entries that carry a scheduledDate) fully replace
 * the remote row.  Definition-only overrides (no scheduledDate, from wizard/edit)
 * only patch definition fields; remote schedule metadata is preserved.
 */
function mergeMedications(remote: Medication[], local: Medication[]): Medication[] {
  const effectiveRemote =
    pendingDeleteIds.size > 0
      ? remote.filter((r) => !pendingDeleteIds.has(r.id))
      : remote;

  const doseLevelLocal = local.filter((m) => Boolean(m.scheduledDate));
  const definitionOnlyLocal = local.filter((m) => !m.scheduledDate);

  const doseLevelIds = new Set(doseLevelLocal.map((m) => m.id));
  const definitionOnlyById = new Map(definitionOnlyLocal.map((m) => [m.id, m]));
  const remoteIds = new Set(effectiveRemote.map((r) => r.id));

  const processedRemote = effectiveRemote
    .filter((r) => !doseLevelIds.has(r.id))
    .map((r) => {
      const def = definitionOnlyById.get(r.id);
      return def ? mergeDefinitionIntoScheduled(r, def) : r;
    });

  const newLocalEntries = definitionOnlyLocal.filter((m) => !remoteIds.has(m.id));

  return [...doseLevelLocal, ...newLocalEntries, ...processedRemote];
}

export async function getMedications(): Promise<Medication[] | null> {
  const remote = await fetchMedicationsFromSupabase();
  cachedRemoteMedications = remote;
  return mergeMedications(remote, getLocalMedications());
}

/**
 * Re-merge the cached remote snapshot with the current local store
 * synchronously — no network call.  Used by MedicationsProvider to reflect
 * localMedsStore changes instantly without re-fetching.
 */
export function getMedicationsMerged(): Medication[] {
  return mergeMedications(cachedRemoteMedications, getLocalMedications());
}

export function findMedicationById(id: string): Medication | undefined {
  const local = getLocalMedications().find((m) => m.id === id);
  if (local) return local;
  const fromRemote = cachedRemoteMedications.find((m) => m.id === id);
  if (fromRemote) return fromRemote;
  return mockMedications.find((m) => m.id === id);
}

/**
 * Persist a medication to Supabase.
 * - isEdit=true: partial update of definition fields only (preserves remote
 *   schedule metadata like scheduledDate, doseStatus, period, takenAt).
 * - isEdit=false: full upsert with all fields including schedule metadata.
 */
export async function upsertMedicationRemote(
  med: Medication,
  isEdit: boolean
): Promise<void> {
  const userId = await getQueryUserId();
  if (!userId) return;

  if (isEdit) {
    const { error } = await supabase
      .from("medications")
      .update({
        name: med.name,
        dosage: med.dosage,
        schedule: med.schedule,
        remaining_doses: med.remainingDoses ?? null,
        instruction: med.instruction ?? "",
      })
      .eq("id", med.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("medications").upsert({
      id: med.id,
      user_id: userId,
      name: med.name,
      dosage: med.dosage,
      schedule: med.schedule,
      remaining_doses: med.remainingDoses ?? null,
      instruction: med.instruction ?? "",
      scheduled_at: med.scheduledAt ?? "08:00",
      period: med.period ?? "morning",
      dose_status: med.doseStatus ?? "upcoming",
      taken_at: med.takenAt ?? null,
      scheduled_date: med.scheduledDate ?? "",
    });
    if (error) throw new Error(error.message);
  }
}

/** Remove a medication row from Supabase by id. */
export async function deleteMedicationRemote(id: string): Promise<void> {
  const userId = await getQueryUserId();
  if (!userId) return;
  const { error } = await supabase
    .from("medications")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}
