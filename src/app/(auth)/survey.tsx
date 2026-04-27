import { Redirect, Stack, router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import Animated, {
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight
} from "react-native-reanimated";
import { AppButton } from "../../components/ui/AppButton";
import { AppScreen } from "../../components/ui/AppScreen";
import { AppText } from "../../components/ui/AppText";
import { useAuth } from "../../lib/auth/AuthProvider";
import {
  SURVEY_LAST_STEP,
  readOnboardingSurveyDraft,
  writeOnboardingSurveyDraft
} from "../../lib/auth/onboardingSurveyDraft";
import type { TranslationKey } from "../../lib/i18n/LanguageProvider";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import type {
  OnboardingSurveyAnswers,
  SurveyQ2,
  SurveyQ3,
  SurveyQ4,
  SurveyQ5,
  SurveyQ6,
  SurveyQ7
} from "../../types/onboarding-survey";
import {
  emptySurveyAnswers,
  isOnboardingSurveyComplete
} from "../../types/onboarding-survey";
import { paperTheme } from "../../theme/paperTheme";

function ChoiceButton({
  label,
  selected,
  onPress,
  multi
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  multi?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: 16,
        backgroundColor: selected ? "rgba(0, 88, 188, 0.08)" : "#FFFFFF",
        borderWidth: 1.5,
        borderColor: selected
          ? paperTheme.colors.primary
          : "rgba(0, 88, 188, 0.22)",
        padding: 16,
        marginBottom: 12,
        opacity: pressed ? 0.8 : 1
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: multi ? 6 : 10,
            borderWidth: 2,
            borderColor: selected
              ? paperTheme.colors.primary
              : "rgba(0, 88, 188, 0.22)",
            backgroundColor: selected
              ? paperTheme.colors.primary
              : "transparent",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {selected && multi ? (
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                backgroundColor: "#FFFFFF"
              }}
            />
          ) : null}
          {selected && !multi ? (
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: "#FFFFFF"
              }}
            />
          ) : null}
        </View>
        <AppText style={{ flex: 1 }}>{label}</AppText>
      </View>
    </Pressable>
  );
}

function toggleMulti<T extends string>(list: T[], value: T): T[] {
  if (list.includes(value)) {
    return list.filter((x) => x !== value);
  }
  return [...list, value];
}

function q2Label(t: (k: TranslationKey) => string, v: SurveyQ2): string {
  const m: Record<SurveyQ2, TranslationKey> = {
    once: "survey_q2_once",
    twice: "survey_q2_twice",
    three_plus: "survey_q2_three_plus",
    as_needed: "survey_q2_as_needed",
    unsure: "survey_q2_unsure"
  };
  return t(m[v]);
}

function q3Label(t: (k: TranslationKey) => string, v: SurveyQ3): string {
  const m: Record<SurveyQ3, TranslationKey> = {
    on_time: "survey_q3_on_time",
    tracking_taken: "survey_q3_tracking_taken",
    several_meds: "survey_q3_several_meds",
    refill: "survey_q3_refill",
    understanding: "survey_q3_understanding"
  };
  return t(m[v]);
}

function q4Label(t: (k: TranslationKey) => string, v: SurveyQ4): string {
  const m: Record<SurveyQ4, TranslationKey> = {
    early_morning: "survey_q4_early_morning",
    midday: "survey_q4_midday",
    evening: "survey_q4_evening",
    late_night: "survey_q4_late_night",
    outside: "survey_q4_outside",
    routine_changes: "survey_q4_routine_changes"
  };
  return t(m[v]);
}

function q5Label(t: (k: TranslationKey) => string, v: SurveyQ5): string {
  const m: Record<SurveyQ5, TranslationKey> = {
    gentle: "survey_q5_gentle",
    balanced: "survey_q5_balanced",
    firm: "survey_q5_firm"
  };
  return t(m[v]);
}

function q6Label(t: (k: TranslationKey) => string, v: SurveyQ6): string {
  const m: Record<SurveyQ6, TranslationKey> = {
    short_illness: "survey_q6_short",
    ongoing: "survey_q6_ongoing",
    unsure: "survey_q6_unsure"
  };
  return t(m[v]);
}

function q7Label(t: (k: TranslationKey) => string, v: SurveyQ7): string {
  const m: Record<SurveyQ7, TranslationKey> = {
    doses_first: "survey_q7_doses_first",
    stock_first: "survey_q7_stock_first",
    both: "survey_q7_both"
  };
  return t(m[v]);
}

function validateStep(
  stepIndex: number,
  a: OnboardingSurveyAnswers
): TranslationKey | null {
  switch (stepIndex) {
    case 0:
      return a.q1 ? null : "survey_error_pickOne";
    case 1:
      return a.q2 ? null : "survey_error_pickOne";
    case 2:
      return a.q3.length > 0 ? null : "survey_error_pickSome";
    case 3:
      return a.q4.length > 0 ? null : "survey_error_pickSome";
    case 4:
      return a.q5 ? null : "survey_error_pickOne";
    case 5:
      return a.q6 ? null : "survey_error_pickOne";
    case 6:
      return a.q7 ? null : "survey_error_pickOne";
    default:
      return null;
  }
}

export default function SurveyScreen() {
  const { completeOnboarding, record, status } = useAuth();
  const { t } = useLanguage();

  const [hydrated, setHydrated] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] =
    useState<OnboardingSurveyAnswers>(emptySurveyAnswers());
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const skipNextPersist = useRef(false);

  useEffect(() => {
    if (!record?.id) {
      setHydrated(true);
      return;
    }
    let alive = true;
    const run = async () => {
      try {
        const draft = await readOnboardingSurveyDraft(record.id);
        if (!alive) return;
        if (draft) {
          skipNextPersist.current = true;
          setStepIndex(draft.stepIndex);
          setAnswers(draft.answers);
        }
      } catch {
        // Draft load is best-effort; never crash onboarding.
      } finally {
        if (alive) {
          setHydrated(true);
        }
      }
    };
    void run();
    return () => {
      alive = false;
    };
  }, [record?.id]);

  useEffect(() => {
    if (!record?.id || !hydrated) {
      return;
    }
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    void writeOnboardingSurveyDraft(record.id, { stepIndex, answers }).catch(
      () => undefined
    );
  }, [record?.id, stepIndex, answers, hydrated]);

  if (status === "ready") {
    return <Redirect href="/(tabs)/home" />;
  }

  if (status === "signedOut") {
    return <Redirect href="/sign-in" />;
  }

  if (status === "loading") {
    return (
      <AppScreen>
        <Stack.Screen options={{ headerShown: false }} />
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator color={paperTheme.colors.primary} />
        </View>
      </AppScreen>
    );
  }

  if (!record) {
    return <Redirect href="/sign-in" />;
  }

  if (!hydrated) {
    return (
      <AppScreen>
        <Stack.Screen options={{ headerShown: false }} />
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator color={paperTheme.colors.primary} />
        </View>
      </AppScreen>
    );
  }

  const macroPart = stepIndex < 4 ? 1 : 2;
  const progress = ((stepIndex + 1) / (SURVEY_LAST_STEP + 1)) * 100;

  function goBack() {
    setError(null);
    setDirection("back");
    if (stepIndex === 0) {
      router.replace("/onboarding");
      return;
    }
    setStepIndex((s) => s - 1);
  }

  function goNext() {
    const key = validateStep(stepIndex, answers);
    if (key) {
      setError(t(key));
      return;
    }
    setError(null);
    setDirection("forward");
    setStepIndex((s) => Math.min(SURVEY_LAST_STEP, s + 1));
  }

  async function handleFinish() {
    if (!isOnboardingSurveyComplete(answers)) {
      setError(t("onboarding_answerAll"));
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await completeOnboarding({ survey: answers });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("onboarding_unable"));
    } finally {
      setSubmitting(false);
    }
  }

  const entering =
    direction === "forward"
      ? SlideInRight.duration(280)
      : SlideInLeft.duration(280);
  const exiting =
    direction === "forward"
      ? SlideOutLeft.duration(240)
      : SlideOutRight.duration(240);

  function renderBody() {
    if (stepIndex === 8) {
      return (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <AppText
            variant="headlineSmall"
            style={{ marginBottom: 12, fontWeight: "600" }}
          >
            {t("onboarding_readyTitle")}
          </AppText>
          <AppText
            variant="bodyMedium"
            style={{
              color: paperTheme.colors.onSurfaceVariant,
              marginBottom: 20
            }}
          >
            {t("survey_summaryLead")}
          </AppText>

          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: paperTheme.colors.outline,
              gap: 16
            }}
          >
            <View>
              <AppText
                variant="labelSmall"
                style={{ color: paperTheme.colors.onSurfaceVariant }}
              >
                {t("survey_q1_title")}
              </AppText>
              <AppText
                variant="bodyMedium"
                style={{ fontWeight: "600", marginTop: 4 }}
              >
                {answers.q1 === "self"
                  ? t("survey_q1_self")
                  : t("survey_q1_self_help")}
              </AppText>
            </View>
            <View>
              <AppText
                variant="labelSmall"
                style={{ color: paperTheme.colors.onSurfaceVariant }}
              >
                {t("survey_q2_title")}
              </AppText>
              <AppText
                variant="bodyMedium"
                style={{ fontWeight: "600", marginTop: 4 }}
              >
                {answers.q2 ? q2Label(t, answers.q2) : "—"}
              </AppText>
            </View>
            <View>
              <AppText
                variant="labelSmall"
                style={{ color: paperTheme.colors.onSurfaceVariant }}
              >
                {t("survey_q3_title")}
              </AppText>
              <AppText
                variant="bodyMedium"
                style={{ fontWeight: "600", marginTop: 4 }}
              >
                {answers.q3.map((x) => q3Label(t, x)).join(", ")}
              </AppText>
            </View>
            <View>
              <AppText
                variant="labelSmall"
                style={{ color: paperTheme.colors.onSurfaceVariant }}
              >
                {t("survey_q4_title")}
              </AppText>
              <AppText
                variant="bodyMedium"
                style={{ fontWeight: "600", marginTop: 4 }}
              >
                {answers.q4.map((x) => q4Label(t, x)).join(", ")}
              </AppText>
            </View>
            <View>
              <AppText
                variant="labelSmall"
                style={{ color: paperTheme.colors.onSurfaceVariant }}
              >
                {t("survey_q5_title")}
              </AppText>
              <AppText
                variant="bodyMedium"
                style={{ fontWeight: "600", marginTop: 4 }}
              >
                {answers.q5 ? q5Label(t, answers.q5) : "—"}
              </AppText>
            </View>
            <View>
              <AppText
                variant="labelSmall"
                style={{ color: paperTheme.colors.onSurfaceVariant }}
              >
                {t("survey_q6_title")}
              </AppText>
              <AppText
                variant="bodyMedium"
                style={{ fontWeight: "600", marginTop: 4 }}
              >
                {answers.q6 ? q6Label(t, answers.q6) : "—"}
              </AppText>
            </View>
            <View>
              <AppText
                variant="labelSmall"
                style={{ color: paperTheme.colors.onSurfaceVariant }}
              >
                {t("survey_q7_title")}
              </AppText>
              <AppText
                variant="bodyMedium"
                style={{ fontWeight: "600", marginTop: 4 }}
              >
                {answers.q7 ? q7Label(t, answers.q7) : "—"}
              </AppText>
            </View>
            {answers.q8Notes.trim() ? (
              <View>
                <AppText
                  variant="labelSmall"
                  style={{ color: paperTheme.colors.onSurfaceVariant }}
                >
                  {t("survey_q8_title")}
                </AppText>
                <AppText variant="bodyMedium" style={{ marginTop: 4 }}>
                  {answers.q8Notes.trim()}
                </AppText>
              </View>
            ) : null}
          </View>

          <AppText
            variant="bodyMedium"
            style={{
              color: paperTheme.colors.onSurfaceVariant,
              marginBottom: 20,
              lineHeight: 20
            }}
          >
            {t("onboarding_saved")}
          </AppText>
        </ScrollView>
      );
    }

    if (stepIndex === 0) {
      return (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppText
            variant="headlineSmall"
            style={{ marginBottom: 16, fontWeight: "600" }}
          >
            {t("survey_q1_title")}
          </AppText>
          <ChoiceButton
            label={t("survey_q1_self")}
            selected={answers.q1 === "self"}
            onPress={() => setAnswers((a) => ({ ...a, q1: "self" }))}
          />
          <ChoiceButton
            label={t("survey_q1_self_help")}
            selected={answers.q1 === "self_with_help"}
            onPress={() => setAnswers((a) => ({ ...a, q1: "self_with_help" }))}
          />
        </ScrollView>
      );
    }

    if (stepIndex === 1) {
      const opts: SurveyQ2[] = [
        "once",
        "twice",
        "three_plus",
        "as_needed",
        "unsure"
      ];
      return (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppText
            variant="headlineSmall"
            style={{ marginBottom: 16, fontWeight: "600" }}
          >
            {t("survey_q2_title")}
          </AppText>
          {opts.map((opt) => (
            <ChoiceButton
              key={opt}
              label={q2Label(t, opt)}
              selected={answers.q2 === opt}
              onPress={() => setAnswers((a) => ({ ...a, q2: opt }))}
            />
          ))}
        </ScrollView>
      );
    }

    if (stepIndex === 2) {
      const opts: SurveyQ3[] = [
        "on_time",
        "tracking_taken",
        "several_meds",
        "refill",
        "understanding"
      ];
      return (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppText
            variant="headlineSmall"
            style={{ marginBottom: 8, fontWeight: "600" }}
          >
            {t("survey_q3_title")}
          </AppText>
          <AppText
            variant="bodyMedium"
            style={{
              color: paperTheme.colors.onSurfaceVariant,
              marginBottom: 16
            }}
          >
            {t("survey_q3_sub")}
          </AppText>
          {opts.map((opt) => (
            <ChoiceButton
              key={opt}
              multi
              label={q3Label(t, opt)}
              selected={answers.q3.includes(opt)}
              onPress={() =>
                setAnswers((a) => ({ ...a, q3: toggleMulti(a.q3, opt) }))
              }
            />
          ))}
        </ScrollView>
      );
    }

    if (stepIndex === 3) {
      const opts: SurveyQ4[] = [
        "early_morning",
        "midday",
        "evening",
        "late_night",
        "outside",
        "routine_changes"
      ];
      return (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppText
            variant="headlineSmall"
            style={{ marginBottom: 8, fontWeight: "600" }}
          >
            {t("survey_q4_title")}
          </AppText>
          <AppText
            variant="bodyMedium"
            style={{
              color: paperTheme.colors.onSurfaceVariant,
              marginBottom: 16
            }}
          >
            {t("survey_q4_sub")}
          </AppText>
          {opts.map((opt) => (
            <ChoiceButton
              key={opt}
              multi
              label={q4Label(t, opt)}
              selected={answers.q4.includes(opt)}
              onPress={() =>
                setAnswers((a) => ({ ...a, q4: toggleMulti(a.q4, opt) }))
              }
            />
          ))}
        </ScrollView>
      );
    }

    if (stepIndex === 4) {
      const opts: SurveyQ5[] = ["gentle", "balanced", "firm"];
      return (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppText
            variant="headlineSmall"
            style={{ marginBottom: 16, fontWeight: "600" }}
          >
            {t("survey_q5_title")}
          </AppText>
          {opts.map((opt) => (
            <ChoiceButton
              key={opt}
              label={q5Label(t, opt)}
              selected={answers.q5 === opt}
              onPress={() => setAnswers((a) => ({ ...a, q5: opt }))}
            />
          ))}
        </ScrollView>
      );
    }

    if (stepIndex === 5) {
      const opts: SurveyQ6[] = ["short_illness", "ongoing", "unsure"];
      return (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppText
            variant="headlineSmall"
            style={{ marginBottom: 16, fontWeight: "600" }}
          >
            {t("survey_q6_title")}
          </AppText>
          {opts.map((opt) => (
            <ChoiceButton
              key={opt}
              label={q6Label(t, opt)}
              selected={answers.q6 === opt}
              onPress={() => setAnswers((a) => ({ ...a, q6: opt }))}
            />
          ))}
        </ScrollView>
      );
    }

    if (stepIndex === 6) {
      const opts: SurveyQ7[] = ["doses_first", "stock_first", "both"];
      return (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppText
            variant="headlineSmall"
            style={{ marginBottom: 16, fontWeight: "600" }}
          >
            {t("survey_q7_title")}
          </AppText>
          {opts.map((opt) => (
            <ChoiceButton
              key={opt}
              label={q7Label(t, opt)}
              selected={answers.q7 === opt}
              onPress={() => setAnswers((a) => ({ ...a, q7: opt }))}
            />
          ))}
        </ScrollView>
      );
    }

    return (
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppText
          variant="headlineSmall"
          style={{ marginBottom: 8, fontWeight: "600" }}
        >
          {t("survey_q8_title")}
        </AppText>
        <AppText
          variant="bodyMedium"
          style={{
            color: paperTheme.colors.onSurfaceVariant,
            marginBottom: 16
          }}
        >
          {t("survey_q8_sub")}
        </AppText>
        <TextInput
          mode="outlined"
          multiline
          numberOfLines={4}
          placeholder={t("survey_q8_placeholder")}
          value={answers.q8Notes}
          onChangeText={(text) => setAnswers((a) => ({ ...a, q8Notes: text }))}
          style={{ minHeight: 120, marginBottom: 8 }}
        />
      </ScrollView>
    );
  }

  return (
    <AppScreen>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={{ marginBottom: 20 }}>
        <AppText variant="titleMedium" style={{ marginBottom: 4 }}>
          {t("onboarding_title")}
        </AppText>
        <AppText
          variant="labelMedium"
          style={{ color: paperTheme.colors.onSurfaceVariant }}
        >
          {t("survey_part", { part: macroPart })}
        </AppText>
        {stepIndex < 8 ? (
          <AppText
            variant="labelSmall"
            style={{ color: paperTheme.colors.onSurfaceVariant, marginTop: 4 }}
          >
            {t("survey_questionOf", { n: stepIndex + 1 })}
          </AppText>
        ) : null}
        <View
          style={{
            height: 3,
            backgroundColor: "#F3F3F8",
            borderRadius: 2,
            marginTop: 10
          }}
        >
          <View
            style={{
              height: "100%",
              width: `${progress}%`,
              backgroundColor: paperTheme.colors.primary,
              borderRadius: 2
            }}
          />
        </View>
      </View>

      <View style={{ flex: 1, overflow: "hidden" }}>
        <Animated.View
          key={stepIndex}
          entering={entering}
          exiting={exiting}
          style={{ flex: 1 }}
        >
          {renderBody()}
        </Animated.View>
      </View>

      {error ? (
        <View
          style={{
            backgroundColor: "rgba(196, 30, 30, 0.08)",
            borderRadius: 12,
            padding: 12,
            marginBottom: 12
          }}
        >
          <AppText style={{ color: "#9F1D1D", fontSize: 14 }}>{error}</AppText>
        </View>
      ) : null}

      <View style={{ gap: 12, paddingTop: 8 }}>
        {stepIndex === 8 ? (
          <>
            <AppButton
              disabled={submitting || !isOnboardingSurveyComplete(answers)}
              loading={submitting}
              onPress={handleFinish}
            >
              {t("onboarding_getStarted")}
            </AppButton>
            <Button mode="outlined" onPress={goBack} disabled={submitting}>
              {t("onboarding_back")}
            </Button>
          </>
        ) : (
          <>
            <AppButton onPress={goNext}>{t("onboarding_continue")}</AppButton>
            <Button mode="outlined" onPress={goBack}>
              {t("onboarding_back")}
            </Button>
          </>
        )}
      </View>
    </AppScreen>
  );
}
