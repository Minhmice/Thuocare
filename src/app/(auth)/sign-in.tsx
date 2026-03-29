import { useRouter, Redirect, Stack } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { Button, TextInput as RNPTextInput } from "react-native-paper";
import { ForgotPasswordModal } from "../../components/auth/ForgotPasswordModal";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { AppScreen } from "../../components/ui/AppScreen";
import { AppText } from "../../components/ui/AppText";
import { AppTextField } from "../../components/ui/AppTextField";
import { GlassSurface } from "../../components/ui/GlassSurface";
import { useAuth } from "../../lib/auth/AuthProvider";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import { paperTheme } from "../../theme/paperTheme";

export default function SignInScreen() {
  const { signIn, status } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  const [mode, setMode] = useState<"phone" | "email">("phone");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [legalVisible, setLegalVisible] = useState(false);
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);

  if (status === "needsOnboarding") {
    return <Redirect href="/onboarding" />;
  }

  if (status === "ready") {
    return <Redirect href="/(tabs)/home" />;
  }

  async function handleSubmit() {
    if (!identifier.trim() || !password.trim()) {
      setError(t("auth_fillAllFields"));
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await signIn({ identifier, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth_signInUnable"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppScreen>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Hero block */}
      <GlassSurface style={{ borderRadius: 32, padding: 24 }}>
        <View style={{ gap: 8 }}>
          <AppText variant="displaySmall" style={{ fontWeight: "600" }}>
            Thuocare
          </AppText>
          <AppText variant="bodyLarge" style={{ color: paperTheme.colors.onSurfaceVariant }}>
            {t("auth_tagline")}
          </AppText>
        </View>
      </GlassSurface>

      {/* Sign In form */}
      <AppCard>
        <View style={{ gap: 16 }}>
          {/* Mode toggle */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <AppText variant="titleMedium">{mode === "phone" ? t("auth_phoneNumber") : t("auth_emailAddress")}</AppText>
            <Button
              mode="text"
              compact
              onPress={() => {
                setMode(mode === "phone" ? "email" : "phone");
                setIdentifier("");
                setError(null);
              }}
              labelStyle={{ fontSize: 12 }}
            >
              {mode === "phone" ? t("auth_useEmail") : t("auth_usePhone")}
            </Button>
          </View>

          {/* Identifier input */}
          {mode === "phone" ? (
            <AppTextField
              label={t("auth_phoneNumber")}
              placeholder={t("auth_phonePlaceholder")}
              keyboardType="phone-pad"
              autoComplete="tel"
              value={identifier}
              onChangeText={setIdentifier}
              editable={!submitting}
            />
          ) : (
            <AppTextField
              label={t("auth_emailAddress")}
              placeholder={t("auth_emailPlaceholder")}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={identifier}
              onChangeText={setIdentifier}
              editable={!submitting}
            />
          )}

          {/* Password input with visibility toggle */}
          <View style={{ position: "relative" }}>
            <AppTextField
              label={t("auth_password")}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
              autoCapitalize="none"
              editable={!submitting}
            />
            <Pressable
              onPress={() => setPasswordVisible(!passwordVisible)}
              style={{
                position: "absolute",
                right: 12,
                top: 34,
                padding: 8
              }}
            >
              <Button
                mode="text"
                compact
                labelStyle={{ fontSize: 12 }}
              >
                {passwordVisible ? t("auth_hide") : t("auth_show")}
              </Button>
            </Pressable>
          </View>

          {/* Error message */}
          {error ? (
            <View style={{ backgroundColor: "rgba(196, 30, 30, 0.08)", borderRadius: 12, padding: 12 }}>
              <AppText style={{ color: "#9F1D1D", fontSize: 14 }}>{error}</AppText>
            </View>
          ) : null}

          {/* Submit button */}
          <AppButton
            disabled={!identifier.trim() || !password.trim() || submitting}
            loading={submitting}
            onPress={handleSubmit}
          >
            {t("auth_signIn")}
          </AppButton>

          {/* Forgot password link */}
          <Pressable
            onPress={() => setForgotPasswordVisible(true)}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <AppText style={{ color: paperTheme.colors.primary, textAlign: "right", fontSize: 13 }}>
              {t("auth_forgotPassword")}
            </AppText>
          </Pressable>
        </View>
      </AppCard>

      {/* Create account block */}
      <GlassSurface style={{ borderRadius: 28, padding: 20 }}>
        <View style={{ gap: 10 }}>
          <AppText variant="titleMedium">{t("auth_firstTime")}</AppText>
          <Pressable
            onPress={() => router.push("/sign-up")}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <AppText style={{ color: paperTheme.colors.primary, fontSize: 14 }}>
              {t("auth_createPrototypeAccount")}
            </AppText>
          </Pressable>
        </View>
      </GlassSurface>

      {/* Legal footer */}
      <View style={{ alignItems: "center", paddingTop: 8, paddingBottom: 16 }}>
        <AppText
          variant="bodySmall"
          style={{ color: paperTheme.colors.onSurfaceVariant, textAlign: "center", lineHeight: 18 }}
        >
          {t("auth_legalAgreement")}
          <AppText
            variant="bodySmall"
            style={{ color: paperTheme.colors.primary, fontWeight: "600" }}
            onPress={() => setLegalVisible(true)}
          >
            {t("auth_termsPrivacy")}
          </AppText>
        </AppText>
      </View>

      {/* Forgot password modal */}
      <ForgotPasswordModal
        visible={forgotPasswordVisible}
        onDismiss={() => setForgotPasswordVisible(false)}
      />

      {/* Legal modal */}
      <Modal
        visible={legalVisible}
        onRequestClose={() => setLegalVisible(false)}
        animationType="fade"
        transparent={true}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "center", alignItems: "center" }}>
          <View
            style={{
              backgroundColor: paperTheme.colors.surface,
              borderRadius: 24,
              padding: 24,
              marginHorizontal: 20,
              maxHeight: "80%"
            }}
          >
            <AppText variant="headlineSmall" style={{ marginBottom: 16 }}>
              {t("auth_legalTitle")}
            </AppText>

            <ScrollView style={{ maxHeight: 300, marginBottom: 20 }}>
              <AppText variant="bodySmall" style={{ lineHeight: 20, marginBottom: 12 }}>
                {t("auth_legalLine1")}
              </AppText>
              <AppText variant="bodySmall" style={{ lineHeight: 20, marginBottom: 12 }}>
                {t("auth_legalLine2")}
              </AppText>
              <AppText variant="bodySmall" style={{ lineHeight: 20, marginBottom: 12 }}>
                {t("auth_legalLine3")}
              </AppText>
              <AppText variant="bodySmall" style={{ lineHeight: 20, marginLeft: 12, marginBottom: 12 }}>
                {t("auth_legalBullets")}
              </AppText>
              <AppText variant="bodySmall" style={{ lineHeight: 20 }}>
                {t("auth_legalLine4")}
              </AppText>
            </ScrollView>

            <AppButton mode="contained" onPress={() => setLegalVisible(false)}>
              {t("auth_understand")}
            </AppButton>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}
