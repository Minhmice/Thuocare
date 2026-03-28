export type Medication = {
  id: string;
  name: string;
  dosage: string;
  schedule: string;
  remainingDoses?: number;
};

export type DailySummary = {
  totalDosesToday: number;
  takenDoses: number;
  missedDoses: number;
  nextDoseAt: string;
};

export type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  timezone: string;
};
