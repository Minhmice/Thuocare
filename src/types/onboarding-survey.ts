export type SurveyQ1 = "self" | "self_with_help";

export type SurveyQ2 = "once" | "twice" | "three_plus" | "as_needed" | "unsure";

export type SurveyQ3 =
  | "on_time"
  | "tracking_taken"
  | "several_meds"
  | "refill"
  | "understanding";

export type SurveyQ4 =
  | "early_morning"
  | "midday"
  | "evening"
  | "late_night"
  | "outside"
  | "routine_changes";

export type SurveyQ5 = "gentle" | "balanced" | "firm";

export type SurveyQ6 = "short_illness" | "ongoing" | "unsure";

export type SurveyQ7 = "doses_first" | "stock_first" | "both";

export type RoutineSegment =
  | "light-routine"
  | "structured-routine"
  | "high-support"
  | "uncertain-start";

export type OnboardingSurveyAnswers = {
  q1: SurveyQ1 | null;
  q2: SurveyQ2 | null;
  q3: SurveyQ3[];
  q4: SurveyQ4[];
  q5: SurveyQ5 | null;
  q6: SurveyQ6 | null;
  q7: SurveyQ7 | null;
  q8Notes: string;
};

export function emptySurveyAnswers(): OnboardingSurveyAnswers {
  return {
    q1: null,
    q2: null,
    q3: [],
    q4: [],
    q5: null,
    q6: null,
    q7: null,
    q8Notes: ""
  };
}

export function isOnboardingSurveyComplete(
  a: OnboardingSurveyAnswers
): boolean {
  return (
    a.q1 !== null &&
    a.q2 !== null &&
    a.q3.length > 0 &&
    a.q4.length > 0 &&
    a.q5 !== null &&
    a.q6 !== null &&
    a.q7 !== null
  );
}
