export type MedStatus = "active" | "paused" | "stopped";

export type Med = {
  id: string;
  displayName: string;
  strengthText?: string | null;
  dosageForm?: string | null;
  doseAmount?: number | null;
  doseUnit?: string | null;
  scheduleTimes: string[]; // HH:mm in local time
  notes?: string | null;
  status: MedStatus;
};

export type MockDoseStatus = "scheduled" | "taken" | "missed" | "skipped";

export type MockDoseLog = {
  id: string;
  medId: string;
  scheduledAtIso: string; // ISO datetime (local date + schedule time)
  status: MockDoseStatus;
  actualTakenAtIso?: string | null;
};

