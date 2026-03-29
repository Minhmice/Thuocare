import { Redirect, Stack } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { Button } from "react-native-paper";
import { AppButton } from "../../components/ui/AppButton";
import { AppScreen } from "../../components/ui/AppScreen";
import { AppText } from "../../components/ui/AppText";
import { useAuth } from "../../lib/auth/AuthProvider";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import { paperTheme } from "../../theme/paperTheme";

type ReminderPreference = "quiet" | "balanced" | "firm";
type RoutineStage = "starting" | "steady" | "resetting";

function ChoiceButton({
  label,
  selected,
  onPress
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: 16,
        backgroundColor: selected ? "rgba(0, 88, 188, 0.08)" : "#FFFFFF",
        borderWidth: 1.5,
        borderColor: selected ? paperTheme.colors.primary : "rgba(0, 88, 188, 0.22)",
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
            borderRadius: 10,
            borderWidth: 2,
            borderColor: selected ? paperTheme.colors.primary : "rgba(0, 88, 188, 0.22)",
            backgroundColor: selected ? paperTheme.colors.primary : "transparent",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {selected && (
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: "#FFFFFF"
              }}
            />
          )}
        </View>
        <AppText style={{ flex: 1 }}>{label}</AppText>
      </View>
    </Pressable>
  );
}

export default function OnboardingScreen() {
  const { completeOnboarding, status } = useAuth();
  const { t } = useLanguage();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedReminder, setSelectedReminder] = useState<ReminderPreference | null>(null);
  const [selectedRoutine, setSelectedRoutine] = useState<RoutineStage | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "ready") {
    return <Redirect href="/(tabs)/home" />;
  }

  if (status === "signedOut") {
    return <Redirect href="/sign-in" />;
  }

  async function handleComplete() {
    if (!selectedReminder || !selectedRoutine) {
      setError(t("onboarding_answerAll"));
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await completeOnboarding({
        routineStage: selectedRoutine,
        reminderPreference: selectedReminder
      });
      // Status will change to "ready" and redirect above
    } catch (err) {
      setError(err instanceof Error ? err.message : t("onboarding_unable"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppScreen>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header with step indicator */}
      <View style={{ marginBottom: 24 }}>
        <AppText variant="titleMedium" style={{ marginBottom: 8 }}>
          {t("onboarding_title")}
        </AppText>
        <AppText variant="labelMedium" style={{ color: paperTheme.colors.onSurfaceVariant }}>
          {t("onboarding_step", { step })}
        </AppText>
        {/* Simple progress bar */}
        <View style={{ height: 3, backgroundColor: "#F3F3F8", borderRadius: 2, marginTop: 8 }}>
          <View
            style={{
              height: "100%",
              width: `${(step / 2) * 100}%`,
              backgroundColor: paperTheme.colors.primary,
              borderRadius: 2
            }}
          />
        </View>
      </View>

      {step === 1 ? (
        <>
          {/* Step 1: Reminder Preference */}
          <View style={{ marginBottom: 24 }}>
            <AppText variant="headlineSmall" style={{ marginBottom: 16, fontWeight: "600" }}>
              {t("onboarding_reminderQuestion")}
            </AppText>
            <AppText
              variant="bodyMedium"
              style={{ color: paperTheme.colors.onSurfaceVariant, marginBottom: 20 }}
            >
              {t("onboarding_reminderDescription")}
            </AppText>

            <ChoiceButton
              label={t("onboarding_reminderGentle")}
              selected={selectedReminder === "quiet"}
              onPress={() => setSelectedReminder("quiet")}
            />
            <ChoiceButton
              label={t("onboarding_reminderBalanced")}
              selected={selectedReminder === "balanced"}
              onPress={() => setSelectedReminder("balanced")}
            />
            <ChoiceButton
              label={t("onboarding_reminderFirm")}
              selected={selectedReminder === "firm"}
              onPress={() => setSelectedReminder("firm")}
            />
          </View>

          {/* Step 1: Illness Duration */}
          <View style={{ marginBottom: 32 }}>
            <AppText variant="headlineSmall" style={{ marginBottom: 16, fontWeight: "600" }}>
              {t("onboarding_conditionQuestion")}
            </AppText>
            <AppText
              variant="bodyMedium"
              style={{ color: paperTheme.colors.onSurfaceVariant, marginBottom: 20 }}
            >
              {t("onboarding_conditionDescription")}
            </AppText>

            <ChoiceButton
              label={t("onboarding_conditionShort")}
              selected={selectedRoutine === "starting"}
              onPress={() => setSelectedRoutine("starting")}
            />
            <ChoiceButton
              label={t("onboarding_conditionOngoing")}
              selected={selectedRoutine === "steady"}
              onPress={() => setSelectedRoutine("steady")}
            />
            <ChoiceButton
              label={t("onboarding_conditionUnsure")}
              selected={selectedRoutine === "resetting"}
              onPress={() => setSelectedRoutine("resetting")}
            />
          </View>

          {/* Error message */}
          {error ? (
            <View style={{ backgroundColor: "rgba(196, 30, 30, 0.08)", borderRadius: 12, padding: 12, marginBottom: 16 }}>
              <AppText style={{ color: "#9F1D1D", fontSize: 14 }}>{error}</AppText>
            </View>
          ) : null}

          {/* Next button */}
          <AppButton
            disabled={!selectedReminder || !selectedRoutine || submitting}
            loading={submitting}
            onPress={() => setStep(2)}
          >
            {t("onboarding_continue")}
          </AppButton>
        </>
      ) : (
        <>
          {/* Step 2: Confirmation */}
          <View style={{ marginBottom: 32 }}>
            <AppText variant="headlineSmall" style={{ marginBottom: 20, fontWeight: "600" }}>
              {t("onboarding_readyTitle")}
            </AppText>

            {/* Summary */}
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                padding: 20,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: paperTheme.colors.outline
              }}
            >
              <AppText variant="labelSmall" style={{ color: paperTheme.colors.onSurfaceVariant, marginBottom: 8 }}>
                {t("onboarding_summaryReminder")}
              </AppText>
              <AppText
                variant="bodyMedium"
                style={{
                  fontWeight: "600",
                  marginBottom: 16,
                  textTransform: "capitalize"
                }}
              >
                {selectedReminder === "quiet"
                  ? t("reminder_gentle")
                  : selectedReminder === "balanced"
                    ? t("reminder_balanced")
                    : t("reminder_firm")}
              </AppText>

              <AppText variant="labelSmall" style={{ color: paperTheme.colors.onSurfaceVariant, marginBottom: 8 }}>
                {t("onboarding_summaryCondition")}
              </AppText>
              <AppText
                variant="bodyMedium"
                style={{
                  fontWeight: "600",
                  textTransform: "capitalize"
                }}
              >
                {selectedRoutine === "starting"
                  ? t("routine_starting")
                  : selectedRoutine === "steady"
                    ? t("routine_steady")
                    : t("routine_resetting")}
              </AppText>
            </View>

            <AppText
              variant="bodyMedium"
              style={{ color: paperTheme.colors.onSurfaceVariant, marginBottom: 24, lineHeight: 20 }}
            >
              {t("onboarding_saved")}
            </AppText>
          </View>

          {/* Error message */}
          {error ? (
            <View style={{ backgroundColor: "rgba(196, 30, 30, 0.08)", borderRadius: 12, padding: 12, marginBottom: 16 }}>
              <AppText style={{ color: "#9F1D1D", fontSize: 14 }}>{error}</AppText>
            </View>
          ) : null}

          {/* Buttons */}
          <View style={{ gap: 12 }}>
            <AppButton
              disabled={submitting}
              loading={submitting}
              onPress={handleComplete}
            >
              {t("onboarding_getStarted")}
            </AppButton>
            <Button
              mode="outlined"
              onPress={() => setStep(1)}
              disabled={submitting}
            >
              {t("onboarding_back")}
            </Button>
          </View>
        </>
      )}
    </AppScreen>
  );
}
