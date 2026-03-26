export const personalQueryKeys = {
  all: ["personal"] as const,

  today: () => [...personalQueryKeys.all, "today"] as const,

  todaySchedule: (patientId: string, scheduledDate: string) =>
    [...personalQueryKeys.today(), "schedule", patientId, scheduledDate] as const,
};

