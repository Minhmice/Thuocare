import type {
  OnboardingSurveyAnswers,
  RoutineSegment,
  SurveyQ5,
  SurveyQ6
} from "../../types/onboarding-survey";
import type { ReminderPreference, RoutineStage } from "./storage";

export function mapQ5ToReminderPreference(q5: SurveyQ5): ReminderPreference {
  switch (q5) {
    case "gentle":
      return "quiet";
    case "balanced":
      return "balanced";
    case "firm":
      return "firm";
  }
}

export function mapQ6ToRoutineStage(q6: SurveyQ6): RoutineStage {
  switch (q6) {
    case "short_illness":
      return "starting";
    case "ongoing":
      return "steady";
    case "unsure":
      return "resetting";
  }
}

export function deriveRoutineSegment(
  answers: OnboardingSurveyAnswers
): RoutineSegment {
  if (answers.q6 === "unsure" || answers.q2 === "unsure") {
    return "uncertain-start";
  }
  if (
    answers.q5 === "firm" ||
    answers.q2 === "three_plus" ||
    answers.q3.includes("several_meds")
  ) {
    return "high-support";
  }
  if (
    answers.q5 === "gentle" &&
    (answers.q2 === "once" || answers.q2 === "as_needed")
  ) {
    return "light-routine";
  }
  return "structured-routine";
}
