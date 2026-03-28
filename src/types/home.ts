export type DosePeriod = "morning" | "afternoon" | "evening" | "night";

export type ScheduledDose = {
  id: string;
  medicationName: string;
  dosage: string;
  instruction: string;
  scheduledAt: string; // "HH:mm"
  period: DosePeriod;
  status: "taken" | "missed" | "upcoming";
  takenAt?: string; // "HH:mm" when taken
};

export type NextDoseMedication = {
  id: string;
  name: string;
  instruction: string;
};

export type NextDoseGroup = {
  scheduledAt: string; // "HH:mm"
  minutesLate: number; // 0 = on time, >0 = overdue
  medications: NextDoseMedication[];
};

export type HomeStats = {
  taken: number;
  remaining: number;
  missed: number;
};

export type HomeData = {
  userName: string;
  stats: HomeStats;
  missedDoseAlert: { medicationName: string } | null;
  stockWarning: { medicationName: string; daysLeft: number } | null;
  nextDose: NextDoseGroup | null;
  schedule: ScheduledDose[];
  allSetToday: boolean;
};
