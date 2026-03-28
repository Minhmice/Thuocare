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
import { paperTheme } from "../../theme/paperTheme";

export default function SignUpScreen() {
  const { signUp, status } = useAuth();
  const router = useRouter();

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
      setError("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!legalAccepted) {
      setError("Please accept the Terms and Privacy Policy to continue.");
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
      setError(err instanceof Error ? err.message : "Unable to create account.");
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
          Back to sign in
        </Button>
      </View>

      {/* Hero block */}
      <GlassSurface style={{ borderRadius: 32, padding: 24 }}>
        <View style={{ gap: 8 }}>
          <AppText variant="headlineMedium" style={{ fontWeight: "600" }}>
            Create Account
          </AppText>
          <AppText variant="bodyMedium" style={{ color: paperTheme.colors.onSurfaceVariant }}>
            Set up your local prototype account. All data stays on your device.
          </AppText>
        </View>
      </GlassSurface>

      {/* Form card — field order per spec: name → phone → email → password → confirm */}
      <AppCard>
        <View style={{ gap: 16 }}>

          {/* Full name */}
          <AppTextField
            label="Full name"
            placeholder="Your full name"
            autoCapitalize="words"
            autoComplete="name"
            value={fullName}
            onChangeText={setFullName}
            editable={!submitting}
          />

          {/* Phone — required, primary identity */}
          <AppTextField
            label="Phone number"
            placeholder="e.g., 09123456789"
            keyboardType="phone-pad"
            autoComplete="tel"
            value={phone}
            onChangeText={setPhone}
            editable={!submitting}
          />

          {/* Email — optional */}
          <AppTextField
            label="Email address (optional)"
            placeholder="you@example.com"
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
              label="Password"
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
                {passwordVisible ? "Hide" : "Show"}
              </Button>
            </Pressable>
          </View>

          {/* Confirm password with show/hide */}
          <View style={{ position: "relative" }}>
            <AppTextField
              label="Confirm password"
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
                {confirmPasswordVisible ? "Hide" : "Show"}
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
                I agree to the{" "}
                <AppText
                  variant="bodySmall"
                  style={{ color: paperTheme.colors.primary, fontWeight: "600" }}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    setLegalModalVisible(true);
                  }}
                >
                  Terms and Privacy Policy
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
                    Go to Forgot Password →
                  </AppText>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {/* Submit */}
          <AppButton disabled={!canSubmit} loading={submitting} onPress={handleSubmit}>
            Create account
          </AppButton>

          {/* Sign-in link */}
          <View style={{ alignItems: "center" }}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <AppText style={{ color: paperTheme.colors.primary, fontSize: 13 }}>
                Already have an account? Sign in
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
              Terms & Privacy
            </AppText>

            <ScrollView style={{ maxHeight: 300, marginBottom: 20 }}>
              <AppText variant="bodySmall" style={{ lineHeight: 20, marginBottom: 12 }}>
                This is a prototype application in development mode.
              </AppText>
              <AppText variant="bodySmall" style={{ lineHeight: 20, marginBottom: 12 }}>
                All data is stored locally on your device using secure storage. No data is sent
                to servers in this prototype phase.
              </AppText>
              <AppText variant="bodySmall" style={{ lineHeight: 20, marginBottom: 12 }}>
                By creating an account you acknowledge that:
              </AppText>
              <AppText variant="bodySmall" style={{ lineHeight: 20, marginLeft: 12, marginBottom: 12 }}>
                {"• This is a prototype and may contain bugs\n• Your data is stored locally and not backed up\n• You can delete the app to remove all data"}
              </AppText>
              <AppText variant="bodySmall" style={{ lineHeight: 20 }}>
                Future versions will include a full privacy policy and terms of service.
              </AppText>
            </ScrollView>

            <AppButton
              onPress={() => {
                setLegalAccepted(true);
                setLegalModalVisible(false);
              }}
            >
              I understand and agree
            </AppButton>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}
