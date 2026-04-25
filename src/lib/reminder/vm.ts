import type { DoseWindowStatus } from "./domain";

export type ReminderTone = "blue" | "amber" | "red" | "green" | "gray";

export type ReminderDoseVM = {
  readonly doseId: string;
  readonly scheduledTimeLabel: string; // "18:00"
  readonly doseLabel: string; // "Evening dose"
  readonly windowLabel: string; // "18:00–20:00"
  readonly medicineCount: number;
  readonly headerStatus: {
    readonly label: string; // "Due now · 1h 12m left"
    readonly tone: ReminderTone;
  };
  readonly medicines: ReminderMedicineVM[];
};

export type ReminderMedicineVM = {
  readonly prescriptionItemId: string;
  readonly medicineName: string;
  readonly doseLabel: string; // "500mg"
  readonly tipLabel?: string; // "Take with water"
  readonly statusLabel: string; // "DUE NOW"
  readonly statusTone: ReminderTone;
  readonly imageUrl?: string;
  readonly iconName?: string;
};

export function toneFromDoseWindowStatus(
  status: DoseWindowStatus
): ReminderTone {
  switch (status) {
    case "TAKEN":
      return "green";
    case "SKIPPED":
    case "SNOOZED":
      return "gray";
    case "DUE_SOON":
    case "DUE_NOW":
      return "blue";
    case "LATE":
      return "amber";
    case "OVERDUE":
    case "MISSED":
      return "red";
  }
}

export function labelFromDoseWindowStatus(status: DoseWindowStatus): string {
  switch (status) {
    case "DUE_SOON":
      return "DUE SOON";
    case "DUE_NOW":
      return "DUE NOW";
    case "LATE":
      return "LATE";
    case "OVERDUE":
      return "OVERDUE";
    case "TAKEN":
      return "TAKEN";
    case "SNOOZED":
      return "SNOOZED";
    case "SKIPPED":
      return "SKIPPED";
    case "MISSED":
      return "MISSED";
  }
}
