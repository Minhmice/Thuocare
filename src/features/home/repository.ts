import type { HomeData } from "../../types/home";
import { getProfile } from "../me/repository";
import { profileDisplayFromFullName } from "../../lib/profile/displayFromFullName";
import { computeDailySummary } from "../../lib/meds/computeDailySummary";
import { getMedications } from "../meds/repository";

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function getHomeData(): Promise<HomeData> {
  const todayKey = localDateKey(new Date());

  const [profile, medications] = await Promise.all([
    getProfile(),
    getMedications()
  ]);

  const userName = profile ? profileDisplayFromFullName(profile.fullName) : "—";

  const {
    schedule,
    stats,
    missedDoseAlert,
    stockWarning,
    nextDose,
    allSetToday
  } = computeDailySummary(medications ?? [], todayKey);

  return {
    userName,
    stats,
    missedDoseAlert,
    stockWarning,
    nextDose,
    schedule,
    allSetToday
  };
}
