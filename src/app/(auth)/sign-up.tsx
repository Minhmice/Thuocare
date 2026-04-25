import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, Checkbox } from "react-native-paper";
import {
  AuthModalPanel,
  AuthScreenPanel
} from "../../components/auth/AuthScreenPanel";
import { ForgotPasswordModal } from "../../components/auth/ForgotPasswordModal";
import { AppButton } from "../../components/ui/AppButton";
import { AppScreen } from "../../components/ui/AppScreen";
import { AppText } from "../../components/ui/AppText";
import { AppTextField } from "../../components/ui/AppTextField";
import { useAuth } from "../../lib/auth/AuthProvider";
import {
  RedirectToSignInAfterSignUp,
  shouldOfferPasswordRecoveryHint
} from "../../lib/auth/authErrors";
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

    if (
      !fullName.trim() ||
      !phone.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
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
    } catch (err) {
      if (err instanceof RedirectToSignInAfterSignUp) {
        router.replace("/sign-in?afterSignup=1");
        return;
      }
      setError(
        err instanceof Error ? err.message : t("auth_createAccountUnable")
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.screenRoot}>
      <AppScreen>
        <Stack.Screen options={{ headerShown: false }} />

        <View style={styles.backRow}>
          <Button
            mode="text"
            icon="arrow-left"
            onPress={() => router.back()}
            compact
            textColor={paperTheme.colors.primary}
          >
            {t("auth_backToSignIn")}
          </Button>
        </View>

        <View style={styles.hero}>
          <AppText variant="headlineMedium" style={styles.heroTitle}>
            {t("auth_createAccountTitle")}
          </AppText>
          <AppText variant="bodyMedium" style={styles.heroSubtitle}>
            {t("auth_createAccountSubtitle")}
          </AppText>
        </View>

        <AuthScreenPanel>
          <View style={styles.formInner}>
            <AppTextField
              label={t("auth_fullName")}
              placeholder={t("auth_fullNamePlaceholder")}
              autoCapitalize="words"
              autoComplete="name"
              value={fullName}
              onChangeText={setFullName}
              editable={!submitting}
            />

            <AppTextField
              label={t("auth_phoneNumber")}
              placeholder={t("auth_phonePlaceholder")}
              keyboardType="phone-pad"
              autoComplete="tel"
              value={phone}
              onChangeText={setPhone}
              editable={!submitting}
            />

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

            <AppTextField
              label={t("auth_password")}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
              autoCapitalize="none"
              editable={!submitting}
              rightAccessory={
                <Pressable
                  onPress={() => setPasswordVisible(!passwordVisible)}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={
                    passwordVisible ? t("auth_hide") : t("auth_show")
                  }
                >
                  <MaterialCommunityIcons
                    name={passwordVisible ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color={paperTheme.colors.primary}
                  />
                </Pressable>
              }
            />

            <AppTextField
              label={t("auth_confirmPassword")}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!confirmPasswordVisible}
              autoCapitalize="none"
              editable={!submitting}
              rightAccessory={
                <Pressable
                  onPress={() =>
                    setConfirmPasswordVisible(!confirmPasswordVisible)
                  }
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={
                    confirmPasswordVisible ? t("auth_hide") : t("auth_show")
                  }
                >
                  <MaterialCommunityIcons
                    name={
                      confirmPasswordVisible ? "eye-off-outline" : "eye-outline"
                    }
                    size={22}
                    color={paperTheme.colors.primary}
                  />
                </Pressable>
              }
            />

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
                color={paperTheme.colors.primary}
              />
              <View style={styles.checkboxCopy}>
                <AppText variant="bodySmall" style={styles.checkboxText}>
                  {t("auth_agreePrefix")}
                  <AppText
                    variant="bodySmall"
                    style={styles.inlineLink}
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

            {error ? (
              <View style={styles.errorBox}>
                <AppText style={styles.errorText}>{error}</AppText>
                {shouldOfferPasswordRecoveryHint(error) ? (
                  <Pressable
                    onPress={() => setForgotPasswordVisible(true)}
                    style={({ pressed }) => ({
                      marginTop: 8,
                      opacity: pressed ? 0.6 : 1
                    })}
                  >
                    <AppText style={styles.errorForgotLink}>
                      {`${t("auth_forgotPassword")} →`}
                    </AppText>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            <AppButton
              disabled={!canSubmit}
              loading={submitting}
              onPress={handleSubmit}
            >
              {t("auth_createAccountButton")}
            </AppButton>

            <View style={styles.signInRow}>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <AppText style={styles.signInLink}>
                  {t("auth_haveAccount")}
                </AppText>
              </Pressable>
            </View>
          </View>
        </AuthScreenPanel>

        <ForgotPasswordModal
          visible={forgotPasswordVisible}
          onDismiss={() => setForgotPasswordVisible(false)}
        />

        <Modal
          visible={legalModalVisible}
          onRequestClose={() => setLegalModalVisible(false)}
          animationType="fade"
          transparent={true}
        >
          <View style={styles.modalBackdrop}>
            <AuthModalPanel style={styles.legalPanel}>
              <AppText variant="headlineSmall" style={styles.modalTitle}>
                {t("auth_legalTitle")}
              </AppText>

              <ScrollView
                style={styles.legalScroll}
                contentContainerStyle={styles.legalScrollContent}
              >
                <AppText variant="bodySmall" style={styles.legalBody}>
                  {t("auth_legalLine1")}
                </AppText>
                <AppText variant="bodySmall" style={styles.legalBody}>
                  {t("auth_legalLine2")}
                </AppText>
                <AppText variant="bodySmall" style={styles.legalBody}>
                  {t("auth_legalCreateLine3")}
                </AppText>
                <AppText variant="bodySmall" style={styles.legalBullets}>
                  {t("auth_legalBullets")}
                </AppText>
                <AppText variant="bodySmall" style={styles.legalBodyLast}>
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
            </AuthModalPanel>
          </View>
        </Modal>
      </AppScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: paperTheme.colors.background
  },
  backRow: {
    marginLeft: -8
  },
  hero: {
    gap: 8,
    paddingTop: 4,
    paddingBottom: 4
  },
  heroTitle: {
    fontWeight: "600",
    color: paperTheme.colors.onSurface
  },
  heroSubtitle: {
    color: paperTheme.colors.onSurfaceVariant
  },
  formInner: {
    gap: 16
  },
  checkboxCopy: {
    flex: 1,
    paddingTop: 8
  },
  checkboxText: {
    lineHeight: 18,
    color: paperTheme.colors.onSurface
  },
  inlineLink: {
    color: paperTheme.colors.primary,
    fontWeight: "600"
  },
  errorBox: {
    backgroundColor: "rgba(196, 30, 30, 0.08)",
    borderRadius: 12,
    padding: 12
  },
  errorText: {
    color: "#9F1D1D",
    fontSize: 14,
    lineHeight: 20
  },
  errorForgotLink: {
    color: paperTheme.colors.primary,
    fontSize: 13,
    fontWeight: "600"
  },
  signInRow: {
    alignItems: "center"
  },
  signInLink: {
    color: paperTheme.colors.primary,
    fontSize: 13
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  legalPanel: {
    maxHeight: "80%"
  },
  modalTitle: {
    marginBottom: 16
  },
  legalScroll: {
    maxHeight: 300,
    marginBottom: 20
  },
  legalScrollContent: {
    paddingBottom: 4
  },
  legalBody: {
    lineHeight: 20,
    marginBottom: 12,
    color: paperTheme.colors.onSurface
  },
  legalBullets: {
    lineHeight: 20,
    marginLeft: 12,
    marginBottom: 12,
    color: paperTheme.colors.onSurface
  },
  legalBodyLast: {
    lineHeight: 20,
    color: paperTheme.colors.onSurface
  }
});
