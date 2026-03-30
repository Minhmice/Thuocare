import type {
  DosePeriod,
  HomeData,
  NextDoseGroup,
  ScheduledDose
} from "../../types/home";
import { getProfile } from "../me/repository";
import { profileDisplayFromFullName } from "../../lib/profile/displayFromFullName";
import { supabase } from "../../lib/supabase/client";
import { getQueryUserId } from "../../lib/supabase/queryUser";

const HOME_MED_SELECT = `
  id,
  name,
  dosage,
  instruction,
  scheduled_at,
  period,
  dose_status,
  taken_at,
  scheduled_date
` as const;

type HomeMedicationRow = {
  id: string;
  name: string;
  dosage: string;
  instruction: string;
  scheduled_at: string;
  period: string;
  dose_status: string;
  taken_at: string | null;
  scheduled_date: string;
};

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function rowToScheduledDose(row: HomeMedicationRow): ScheduledDose {
  const dose: ScheduledDose = {
    id: row.id,
    medicationName: row.name,
    dosage: row.dosage,
    instruction: row.instruction,
    scheduledAt: row.scheduled_at,
    period: row.period as DosePeriod,
    status: row.dose_status as ScheduledDose["status"]
  };
  if (row.taken_at) {
    dose.takenAt = row.taken_at;
  }
  return dose;
}

function timeToMinutes(t: string): number {
  const parts = t.split(":");
  const h = parts[0] ?? "0";
  const m = parts[1] ?? "0";
  return parseInt(h, 10) * 60 + parseInt(m, 10);
}

function buildNextDoseGroup(schedule: ScheduledDose[]): NextDoseGroup | null {
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
    scheduledAt: slot,
    minutesLate,
    medications: sameSlot.map((d) => ({
      id: `next-${d.id}`,
      name: d.medicationName,
      instruction: d.instruction,
      note: d.dosage
    }))
  };
}

async function fetchTodayMedicationRows(
  todayKey: string
): Promise<HomeMedicationRow[]> {
  const userId = await getQueryUserId();
  if (!userId) {
    return [];
  }

  const byToday = await supabase
    .from("medications")
    .select(HOME_MED_SELECT)
    .eq("user_id", userId)
    .eq("scheduled_date", todayKey)
    .order("scheduled_at", { ascending: true });

  if (byToday.error) {
    throw new Error(byToday.error.message);
  }

  let rows = (byToday.data ?? []) as HomeMedicationRow[];
  if (rows.length > 0) {
    return rows;
  }

  const fallbackUser = await supabase
    .from("medications")
    .select(HOME_MED_SELECT)
    .eq("user_id", userId)
    .order("scheduled_date", { ascending: false })
    .order("scheduled_at", { ascending: true })
    .limit(200);

  if (fallbackUser.error) {
    throw new Error(fallbackUser.error.message);
  }

  const tenantRows = (fallbackUser.data ?? []) as HomeMedicationRow[];
  if (tenantRows.length === 0) {
    return [];
  }

  const sorted = [...tenantRows].sort((a, b) =>
    b.scheduled_date.localeCompare(a.scheduled_date)
  );
  const latestDate = sorted[0]!.scheduled_date;
  return sorted
    .filter((r) => r.scheduled_date === latestDate)
    .sort(
      (a, b) =>
        timeToMinutes(a.scheduled_at) - timeToMinutes(b.scheduled_at)
    );
}

async function fetchStockWarning(): Promise<{
  medicationName: string;
  daysLeft: number;
} | null> {
  const userId = await getQueryUserId();
  if (!userId) {
    return null;
  }

  const q = await supabase
    .from("medications")
    .select("name, remaining_doses")
    .eq("user_id", userId)
    .not("remaining_doses", "is", null)
    .lte("remaining_doses", 5)
    .gt("remaining_doses", 0)
    .order("remaining_doses", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (q.error) {
    throw new Error(q.error.message);
  }

  const row = q.data as { name: string; remaining_doses: number } | null;
  if (!row) return null;
  return {
    medicationName: row.name,
    daysLeft: row.remaining_doses
  };
}

export async function getHomeData(): Promise<HomeData> {
  const todayKey = localDateKey(new Date());

  const profile = await getProfile();
  const userName = profile
    ? profileDisplayFromFullName(profile.fullName)
    : "—";

  const medRows = await fetchTodayMedicationRows(todayKey);
  const schedule = medRows.map(rowToScheduledDose);

  const taken = schedule.filter((s) => s.status === "taken").length;
  const missed = schedule.filter((s) => s.status === "missed").length;
  const remaining = schedule.filter((s) => s.status === "upcoming").length;

  const firstMissed = schedule.find((s) => s.status === "missed");
  const missedDoseAlert = firstMissed
    ? { medicationName: firstMissed.medicationName }
    : null;

  const stockWarning = await fetchStockWarning();
  const nextDose = buildNextDoseGroup(schedule);

  const allSetToday =
    schedule.length > 0 && schedule.every((s) => s.status === "taken");

  return {
    userName,
    stats: { taken, remaining, missed },
    missedDoseAlert,
    stockWarning,
    nextDose,
    schedule,
    allSetToday
  };
}
