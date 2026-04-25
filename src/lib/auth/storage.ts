import type {
  OnboardingSurveyAnswers,
  RoutineSegment
} from "../../types/onboarding-survey";

export type ReminderPreference = "quiet" | "balanced" | "firm";
export type RoutineStage = "starting" | "steady" | "resetting";

export type StoredAuthRecord = {
  id: string;
  phone: string;
  email: string | null;
  fullName: string;
  onboardingCompleted: boolean;
  routineStage: RoutineStage | null;
  reminderPreference: ReminderPreference | null;
  onboardingSurvey: OnboardingSurveyAnswers | null;
  routineSegment: RoutineSegment | null;
  createdAt: string;
};
