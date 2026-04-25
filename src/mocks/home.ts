import type { HomeData } from "../types/home";

export const mockHomeData: HomeData = {
  userName: "David",
  stats: { taken: 3, remaining: 5, missed: 1 },
  missedDoseAlert: { medicationName: "Paracetamol" },
  stockWarning: { medicationName: "Aspirin 81mg", daysLeft: 3 },
  nextDose: {
    scheduledDate: "2026-04-25",
    scheduledAt: "09:00",
    minutesLate: 10,
    medications: [
      {
        id: "dose-1",
        name: "Aspirin 81mg",
        instruction: "Cardiovascular",
        note: "1 viên · trước bữa ăn"
      },
      {
        id: "dose-2",
        name: "Vitamin C 500mg",
        instruction: "Immune support",
        note: "1 viên · sau bữa ăn"
      },
      {
        id: "dose-3",
        name: "Omega 3",
        instruction: "Brain & joint support",
        note: "1 viên · sau bữa ăn"
      }
    ]
  },
  schedule: [
    {
      id: "dose-1",
      medicationName: "Vitamin C 500mg",
      dosage: "500mg",
      instruction: "1 tablet",
      scheduledDate: "2026-04-25",
      scheduledAt: "07:00",
      period: "morning",
      status: "taken",
      takenAt: "07:05"
    },
    {
      id: "dose-2",
      medicationName: "Paracetamol",
      dosage: "500mg",
      instruction: "1 tablet",
      scheduledDate: "2026-04-25",
      scheduledAt: "07:00",
      period: "morning",
      status: "missed"
    },
    {
      id: "dose-3",
      medicationName: "Omega 3",
      dosage: "1000mg",
      instruction: "1 tablet • After lunch",
      scheduledDate: "2026-04-25",
      scheduledAt: "12:30",
      period: "afternoon",
      status: "upcoming"
    }
  ],
  allSetToday: false
};
