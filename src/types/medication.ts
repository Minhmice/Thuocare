export type MedicationWizardSnapshot = {
  whatFor: string;
  form: "tablet" | "liquid" | "powder";
  quantity: string;
  moments: {
    id: "morning" | "noon" | "evening";
    label: string;
    active: boolean;
    mealRelation: "before" | "with" | "after";
  }[];
  stock: string;
  startDate: string;
  endDate: string;
};

export type MedicationDoseStatus = "taken" | "missed" | "upcoming";

export type MedicationSchedulePeriod =
  | "morning"
  | "afternoon"
  | "evening"
  | "night";

export type Medication = {
  id: string;
  name: string;
  dosage: string;
  schedule: string;
  remainingDoses?: number;
  /** Merged from scheduled_doses — dose line for today / regimen */
  instruction?: string;
  scheduledAt?: string;
  period?: MedicationSchedulePeriod;
  doseStatus?: MedicationDoseStatus;
  takenAt?: string;
  /** YYYY-MM-DD from DB */
  scheduledDate?: string;
  /** Saved when using the add wizard — enables full edit pre-fill. */
  wizardSnapshot?: MedicationWizardSnapshot;
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
  phone: string;
  timezone: string;
  /** ISO timestamp from profiles.created_at (member since) */
  joinedAt?: string;
};
