import { Redirect, Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { Button, Checkbox } from "react-native-paper";
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

export default function SignUpScreen() {
  const { signUp, status } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already authenticated — get out of sign-up
  if (status === "needsOnboarding") {
    return <Redirect href="/onboarding" />;
  }
  if (status === "ready") {
    return <Redirect href="/(tabs)/home" />;
  }

  const canSubmit =
    fullName.trim().length > 0 &&
    phone.trim().length > 0 &&
    password.trim().length > 0 &&
    confirmPassword.trim().length > 0 &&
    legalAccepted &&
    !submitting;

  async function handleSubmit() {
    setError(null);

    if (!fullName.trim() || !phone.trim() || !password.trim() || !confirmPassword.trim()) {
      setError(t("auth_requiredFields"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth_passwordsNoMatch"));
      return;
    }

    if (password.length < 6) {
      setError(t("auth_passwordLength"));
      return;
    }

    if (!legalAccepted) {
      setError(t("auth_acceptTerms"));
      return;
    }

    try {
      setSubmitting(true);
      await signUp({
        fullName,
        phone,
        email: email.trim() || undefined,
        password
      });
      // Status becomes "needsOnboarding" → Redirect above fires
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth_createAccountUnable"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppScreen>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Back nav */}
      <View>
        <Button mode="text" icon="arrow-left" onPress={() => router.back()} compact>
          {t("auth_backToSignIn")}
        </Button>
      </View>

      {/* Hero block */}
      <GlassSurface style={{ borderRadius: 32, padding: 24 }}>
        <View style={{ gap: 8 }}>
          <AppText variant="headlineMedium" style={{ fontWeight: "600" }}>
            {t("auth_createAccountTitle")}
          </AppText>
          <AppText variant="bodyMedium" style={{ color: paperTheme.colors.onSurfaceVariant }}>
            {t("auth_createAccountSubtitle")}
          </AppText>
        </View>
      </GlassSurface>

      {/* Form card — field order per spec: name → phone → email → password → confirm */}
      <AppCard>
        <View style={{ gap: 16 }}>

          {/* Full name */}
          <AppTextField
            label={t("auth_fullName")}
            placeholder={t("auth_fullNamePlaceholder")}
            autoCapitalize="words"
            autoComplete="name"
            value={fullName}
            onChangeText={setFullName}
            editable={!submitting}
          />

          {/* Phone — required, primary identity */}
          <AppTextField
            label={t("auth_phoneNumber")}
            placeholder={t("auth_phonePlaceholder")}
            keyboardType="phone-pad"
            autoComplete="tel"
            value={phone}
            onChangeText={setPhone}
            editable={!submitting}
          />

          {/* Email — optional */}
          <AppTextField
            label={t("auth_emailOptional")}
            placeholder={t("auth_emailPlaceholder")}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            editable={!submitting}
          />

          {/* Password with show/hide */}
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
              style={{ position: "absolute", right: 12, top: 34, padding: 8 }}
            >
              <Button mode="text" compact labelStyle={{ fontSize: 12 }}>
                {passwordVisible ? t("auth_hide") : t("auth_show")}
              </Button>
            </Pressable>
          </View>

          {/* Confirm password with show/hide */}
          <View style={{ position: "relative" }}>
            <AppTextField
              label={t("auth_confirmPassword")}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!confirmPasswordVisible}
              autoCapitalize="none"
              editable={!submitting}
            />
            <Pressable
              onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
              style={{ position: "absolute", right: 12, top: 34, padding: 8 }}
            >
              <Button mode="text" compact labelStyle={{ fontSize: 12 }}>
                {confirmPasswordVisible ? t("auth_hide") : t("auth_show")}
              </Button>
            </Pressable>
          </View>

          {/* Legal acceptance checkbox */}
          <Pressable
            onPress={() => setLegalAccepted(!legalAccepted)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 4,
              opacity: pressed ? 0.7 : 1
            })}
          >
            <Checkbox
              status={legalAccepted ? "checked" : "unchecked"}
              onPress={() => setLegalAccepted(!legalAccepted)}
            />
            <View style={{ flex: 1, paddingTop: 8 }}>
              <AppText variant="bodySmall" style={{ lineHeight: 18 }}>
                {t("auth_agreePrefix")}
                <AppText
                  variant="bodySmall"
                  style={{ color: paperTheme.colors.primary, fontWeight: "600" }}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    setLegalModalVisible(true);
                  }}
                >
                  {t("auth_termsPrivacy")}
                </AppText>
              </AppText>
            </View>
          </Pressable>

          {/* Error message */}
          {error ? (
            <View
              style={{
                backgroundColor: "rgba(196, 30, 30, 0.08)",
                borderRadius: 12,
                padding: 12
              }}
            >
              <AppText style={{ color: "#9F1D1D", fontSize: 14, lineHeight: 20 }}>
                {error}
              </AppText>
              {/* Surface the forgot-password link if duplicate phone error */}
              {error.includes("Forgot Password") ? (
                <Pressable
                  onPress={() => setForgotPasswordVisible(true)}
                  style={({ pressed }) => ({ marginTop: 8, opacity: pressed ? 0.6 : 1 })}
                >
                  <AppText
                    style={{ color: paperTheme.colors.primary, fontSize: 13, fontWeight: "600" }}
                  >
                    {`${t("auth_forgotPassword")} →`}
                  </AppText>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {/* Submit */}
          <AppButton disabled={!canSubmit} loading={submitting} onPress={handleSubmit}>
            {t("auth_createAccountButton")}
          </AppButton>

          {/* Sign-in link */}
          <View style={{ alignItems: "center" }}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <AppText style={{ color: paperTheme.colors.primary, fontSize: 13 }}>
                {t("auth_haveAccount")}
              </AppText>
            </Pressable>
          </View>

        </View>
      </AppCard>

      {/* Forgot password modal */}
      <ForgotPasswordModal
        visible={forgotPasswordVisible}
        onDismiss={() => setForgotPasswordVisible(false)}
      />

      {/* Legal modal */}
      <Modal
        visible={legalModalVisible}
        onRequestClose={() => setLegalModalVisible(false)}
        animationType="fade"
        transparent={true}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
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
                {t("auth_legalCreateLine3")}
              </AppText>
              <AppText variant="bodySmall" style={{ lineHeight: 20, marginLeft: 12, marginBottom: 12 }}>
                {t("auth_legalBullets")}
              </AppText>
              <AppText variant="bodySmall" style={{ lineHeight: 20 }}>
                {t("auth_legalLine4")}
              </AppText>
            </ScrollView>

            <AppButton
              onPress={() => {
                setLegalAccepted(true);
                setLegalModalVisible(false);
              }}
            >
              {t("auth_understandAgree")}
            </AppButton>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}
