import * as SecureStore from "expo-secure-store";
import type { OnboardingSurveyAnswers } from "../../types/onboarding-survey";
import { emptySurveyAnswers } from "../../types/onboarding-survey";

export const SURVEY_LAST_STEP = 8;

const draftKey = (accountId: string) =>
  `thuocare.onboarding-survey-draft.v1.${accountId}`;

export type OnboardingSurveyDraft = {
  stepIndex: number;
  answers: OnboardingSurveyAnswers;
};

export async function readOnboardingSurveyDraft(
  accountId: string
): Promise<OnboardingSurveyDraft | null> {
  let raw: string | null = null;
  try {
    raw = await SecureStore.getItemAsync(draftKey(accountId));
  } catch {
    return null;
  }
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingSurveyDraft>;
    if (typeof parsed.stepIndex !== "number" || !parsed.answers) {
      return null;
    }
    return {
      stepIndex: Math.min(Math.max(0, parsed.stepIndex), SURVEY_LAST_STEP),
      answers: { ...emptySurveyAnswers(), ...parsed.answers }
    };
  } catch {
    return null;
  }
}

export async function writeOnboardingSurveyDraft(
  accountId: string,
  draft: OnboardingSurveyDraft
): Promise<void> {
  const safe: OnboardingSurveyDraft = {
    stepIndex: Math.min(Math.max(0, draft.stepIndex), SURVEY_LAST_STEP),
    answers: draft.answers
  };
  try {
    await SecureStore.setItemAsync(draftKey(accountId), JSON.stringify(safe));
  } catch {
    // Ignore draft persistence failures; flow still works.
  }
}

export async function clearOnboardingSurveyDraft(
  accountId: string
): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(draftKey(accountId));
  } catch {
    // Ignore failures.
  }
}
