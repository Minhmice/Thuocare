import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
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
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import { paperTheme } from "../../theme/paperTheme";

export default function SignInScreen() {
  const { signIn, status } = useAuth();
  const router = useRouter();
  const { afterSignup } = useLocalSearchParams<{ afterSignup?: string }>();
  const { t } = useLanguage();
  const showAfterSignupHint = afterSignup === "1" || afterSignup === "true";

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
    <View style={styles.screenRoot}>
      <AppScreen>
        <Stack.Screen options={{ headerShown: false }} />

        <View style={styles.hero}>
          <AppText variant="displaySmall" style={styles.heroTitle}>
            Thuocare
          </AppText>
          <AppText variant="bodyLarge" style={styles.heroSubtitle}>
            {t("auth_tagline")}
          </AppText>
        </View>

        <AuthScreenPanel>
          <View style={styles.formInner}>
            {showAfterSignupHint ? (
              <View style={styles.afterSignupBanner}>
                <AppText
                  variant="bodySmall"
                  style={styles.afterSignupBannerText}
                >
                  {t("auth_afterSignupBanner")}
                </AppText>
              </View>
            ) : null}
            <View style={styles.modeRow}>
              <AppText variant="titleMedium">
                {mode === "phone"
                  ? t("auth_phoneNumber")
                  : t("auth_emailAddress")}
              </AppText>
              <Button
                mode="text"
                compact
                textColor={paperTheme.colors.primary}
                onPress={() => {
                  setMode(mode === "phone" ? "email" : "phone");
                  setIdentifier("");
                  setError(null);
                }}
                labelStyle={styles.linkButtonLabel}
              >
                {mode === "phone" ? t("auth_useEmail") : t("auth_usePhone")}
              </Button>
            </View>

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

            {error ? (
              <View style={styles.errorBox}>
                <AppText style={styles.errorText}>{error}</AppText>
              </View>
            ) : null}

            <AppButton
              disabled={!identifier.trim() || !password.trim() || submitting}
              loading={submitting}
              onPress={handleSubmit}
            >
              {t("auth_signIn")}
            </AppButton>

            <View style={styles.postLoginRow}>
              <View style={styles.postLoginLeft}>
                <Pressable
                  onPress={() => router.push("/sign-up")}
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                >
                  <AppText style={styles.secondaryLink}>
                    {t("auth_createAccount")}
                  </AppText>
                </Pressable>
              </View>
              <Pressable
                onPress={() => setForgotPasswordVisible(true)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.6 : 1,
                  flexShrink: 0
                })}
              >
                <AppText style={styles.forgotLink}>
                  {t("auth_forgotPassword")}
                </AppText>
              </Pressable>
            </View>
          </View>
        </AuthScreenPanel>

        <View style={styles.legalFooter}>
          <AppText variant="bodySmall" style={styles.legalText}>
            {t("auth_legalAgreement")}
            <AppText
              variant="bodySmall"
              style={styles.legalLink}
              onPress={() => setLegalVisible(true)}
            >
              {t("auth_termsPrivacy")}
            </AppText>
          </AppText>
        </View>

        <ForgotPasswordModal
          visible={forgotPasswordVisible}
          onDismiss={() => setForgotPasswordVisible(false)}
        />

        <Modal
          visible={legalVisible}
          onRequestClose={() => setLegalVisible(false)}
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
                  {t("auth_legalLine3")}
                </AppText>
                <AppText variant="bodySmall" style={styles.legalBullets}>
                  {t("auth_legalBullets")}
                </AppText>
                <AppText variant="bodySmall" style={styles.legalBodyLast}>
                  {t("auth_legalLine4")}
                </AppText>
              </ScrollView>

              <AppButton
                mode="contained"
                onPress={() => setLegalVisible(false)}
              >
                {t("auth_understand")}
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
  afterSignupBanner: {
    backgroundColor: "rgba(0, 88, 188, 0.08)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 88, 188, 0.2)"
  },
  afterSignupBannerText: {
    color: paperTheme.colors.primary,
    lineHeight: 20
  },
  modeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 0
  },
  linkButtonLabel: {
    fontSize: 12
  },
  errorBox: {
    backgroundColor: "rgba(196, 30, 30, 0.08)",
    borderRadius: 12,
    padding: 12
  },
  errorText: {
    color: "#9F1D1D",
    fontSize: 14
  },
  postLoginRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 4
  },
  postLoginLeft: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-start",
    justifyContent: "center"
  },
  forgotLink: {
    color: paperTheme.colors.primary,
    textAlign: "right",
    fontSize: 13
  },
  secondaryLink: {
    color: paperTheme.colors.primary,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "left"
  },
  legalFooter: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 16
  },
  legalText: {
    color: paperTheme.colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 18
  },
  legalLink: {
    color: paperTheme.colors.primary,
    fontWeight: "600"
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
