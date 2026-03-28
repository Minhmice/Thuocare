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
import { paperTheme } from "../../theme/paperTheme";

export default function SignInScreen() {
  const { signIn, status } = useAuth();
  const router = useRouter();

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
      setError("Please fill in all fields.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await signIn({ identifier, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
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
            A calmer medication routine for everyday personal care.
          </AppText>
        </View>
      </GlassSurface>

      {/* Sign In form */}
      <AppCard>
        <View style={{ gap: 16 }}>
          {/* Mode toggle */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <AppText variant="titleMedium">{mode === "phone" ? "Phone number" : "Email address"}</AppText>
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
              {mode === "phone" ? "Use email" : "Use phone"}
            </Button>
          </View>

          {/* Identifier input */}
          {mode === "phone" ? (
            <AppTextField
              label="Phone number"
              placeholder="e.g., 09123456789"
              keyboardType="phone-pad"
              autoComplete="tel"
              value={identifier}
              onChangeText={setIdentifier}
              editable={!submitting}
            />
          ) : (
            <AppTextField
              label="Email address"
              placeholder="you@example.com"
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
              label="Password"
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
                {passwordVisible ? "Hide" : "Show"}
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
            Sign in
          </AppButton>

          {/* Forgot password link */}
          <Pressable
            onPress={() => setForgotPasswordVisible(true)}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <AppText style={{ color: paperTheme.colors.primary, textAlign: "right", fontSize: 13 }}>
              Forgot password?
            </AppText>
          </Pressable>
        </View>
      </AppCard>

      {/* Create account block */}
      <GlassSurface style={{ borderRadius: 28, padding: 20 }}>
        <View style={{ gap: 10 }}>
          <AppText variant="titleMedium">First time here?</AppText>
          <Pressable
            onPress={() => router.push("/sign-up")}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <AppText style={{ color: paperTheme.colors.primary, fontSize: 14 }}>
              Create a new prototype account →
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
          By continuing you agree to our{" "}
          <AppText
            variant="bodySmall"
            style={{ color: paperTheme.colors.primary, fontWeight: "600" }}
            onPress={() => setLegalVisible(true)}
          >
            Terms and Privacy Policy
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
              Terms & Privacy
            </AppText>

            <ScrollView style={{ maxHeight: 300, marginBottom: 20 }}>
              <AppText variant="bodySmall" style={{ lineHeight: 20, marginBottom: 12 }}>
                This is a prototype application in development mode.
              </AppText>
              <AppText variant="bodySmall" style={{ lineHeight: 20, marginBottom: 12 }}>
                All data is stored locally on your device using secure storage. No data is sent to servers in this prototype phase.
              </AppText>
              <AppText variant="bodySmall" style={{ lineHeight: 20, marginBottom: 12 }}>
                By using this app, you acknowledge that:
              </AppText>
              <AppText variant="bodySmall" style={{ lineHeight: 20, marginLeft: 12, marginBottom: 12 }}>
                • This is a prototype and may contain bugs{"\n"}• Your data is stored locally and not backed up{"\n"}• You can delete the app to remove all data
              </AppText>
              <AppText variant="bodySmall" style={{ lineHeight: 20 }}>
                Future versions will include a full privacy policy and terms of service.
              </AppText>
            </ScrollView>

            <AppButton mode="contained" onPress={() => setLegalVisible(false)}>
              I understand
            </AppButton>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}
