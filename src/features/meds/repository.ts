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

export async function getMedications(): Promise<Medication[] | null> {
  const remote = await fetchMedicationsFromSupabase();
  cachedRemoteMedications = remote;

  const local = getLocalMedications();
  const overridden = new Set(local.map((m) => m.id));
  const remoteRest = remote.filter((m) => !overridden.has(m.id));

  return [...local, ...remoteRest];
}

export function findMedicationById(id: string): Medication | undefined {
  const local = getLocalMedications().find((m) => m.id === id);
  if (local) return local;
  const fromRemote = cachedRemoteMedications.find((m) => m.id === id);
  if (fromRemote) return fromRemote;
  return mockMedications.find((m) => m.id === id);
}
