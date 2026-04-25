import { Redirect, router, Stack } from "expo-router";
import { View } from "react-native";
import { LoadingState } from "../../components/state/LoadingState";
import { AppButton } from "../../components/ui/AppButton";
import { AppScreen } from "../../components/ui/AppScreen";
import { AppText } from "../../components/ui/AppText";
import { useAuth } from "../../lib/auth/AuthProvider";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import { paperTheme } from "../../theme/paperTheme";

export default function OnboardingScreen() {
  const { status } = useAuth();
  const { t } = useLanguage();

  if (status === "loading") {
    return <LoadingState />;
  }

  if (status === "ready") {
    return <Redirect href="/(tabs)/home" />;
  }

  if (status === "signedOut") {
    return <Redirect href="/sign-in" />;
  }

  return (
    <AppScreen>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, paddingTop: 8, gap: 20 }}>
        <AppText variant="headlineMedium" style={{ fontWeight: "600" }}>
          {t("onboarding_welcomeTitle")}
        </AppText>
        <AppText
          variant="bodyLarge"
          style={{ color: paperTheme.colors.onSurfaceVariant, lineHeight: 24 }}
        >
          {t("onboarding_welcomeBody")}
        </AppText>
        <AppButton onPress={() => router.push("/survey")}>
          {t("onboarding_welcomeStart")}
        </AppButton>
      </View>
    </AppScreen>
  );
}
