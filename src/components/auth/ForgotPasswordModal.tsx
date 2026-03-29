import { useEffect, useState } from "react";
import { Modal, ScrollView, View } from "react-native";
import { Button } from "react-native-paper";
import { AppButton } from "../ui/AppButton";
import { AppText } from "../ui/AppText";
import { AppTextField } from "../ui/AppTextField";
import { readAuthStore } from "../../lib/auth/storage";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import { paperTheme } from "../../theme/paperTheme";

type Props = {
  visible: boolean;
  onDismiss: () => void;
};

type Result = {
  success: boolean;
  message: string;
};

function looksLikeEmail(value: string): boolean {
  return value.includes("@");
}

function maskEmail(email: string): string {
  const atIndex = email.indexOf("@");
  if (atIndex < 0) return email;
  return `${email.slice(0, 1)}***${email.slice(atIndex)}`;
}

function maskPhone(phone: string): string {
  if (phone.length <= 6) return phone;
  return `${phone.slice(0, 3)}***${phone.slice(-3)}`;
}

export function ForgotPasswordModal({ visible, onDismiss }: Props) {
  const { t } = useLanguage();
  const [identifier, setIdentifier] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  // Reset state each time the modal opens
  useEffect(() => {
    if (!visible) return;
    setIdentifier("");
    setResult(null);
    setSubmitting(false);
  }, [visible]);

  async function handleSubmit() {
    const trimmed = identifier.trim();
    const isEmail = looksLikeEmail(trimmed);

    try {
      setSubmitting(true);
      const store = await readAuthStore();

      const account = store.accounts.find((a) =>
        isEmail
          ? a.email && a.email.toLowerCase() === trimmed.toLowerCase()
          : a.phone === trimmed
      );

      if (account) {
        const destination = isEmail && account.email
          ? maskEmail(account.email)
          : maskPhone(account.phone);
        setResult({
          success: true,
          message: t("forgotPassword_sent", { destination })
        });
      } else {
        setResult({
          success: false,
          message: t("forgotPassword_notFound")
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      visible={visible}
      onRequestClose={onDismiss}
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
            borderRadius: 28,
            padding: 24,
            marginHorizontal: 20,
            width: "100%",
            maxWidth: 420
          }}
        >
          {/* Title */}
          <AppText variant="headlineSmall" style={{ marginBottom: 8, fontWeight: "600" }}>
            {t("forgotPassword_title")}
          </AppText>

          {result ? (
            /* Result state */
            <>
              <View
                style={{
                  backgroundColor: result.success
                    ? "rgba(0, 88, 188, 0.07)"
                    : "rgba(196, 30, 30, 0.07)",
                  borderRadius: 14,
                  padding: 16,
                  marginTop: 8,
                  marginBottom: 20
                }}
              >
                <AppText
                  variant="bodyMedium"
                  style={{
                    color: result.success ? paperTheme.colors.primary : "#9F1D1D",
                    lineHeight: 20
                  }}
                >
                  {result.message}
                </AppText>
              </View>

              <AppButton onPress={onDismiss}>
                {result.success ? t("forgotPassword_done") : t("forgotPassword_close")}
              </AppButton>
            </>
          ) : (
            /* Input state */
            <>
              <AppText
                variant="bodyMedium"
                style={{ color: paperTheme.colors.onSurfaceVariant, marginBottom: 20, lineHeight: 20 }}
              >
                {t("forgotPassword_description")}
              </AppText>

              <AppTextField
                label={t("forgotPassword_label")}
                placeholder={t("forgotPassword_placeholder")}
                autoCapitalize="none"
                keyboardType="email-address"
                value={identifier}
                onChangeText={setIdentifier}
                editable={!submitting}
                style={{ marginBottom: 20 }}
              />

              <View style={{ gap: 10 }}>
                <AppButton
                  disabled={!identifier.trim() || submitting}
                  loading={submitting}
                  onPress={handleSubmit}
                >
                  {t("forgotPassword_send")}
                </AppButton>

                <Button mode="text" onPress={onDismiss} disabled={submitting}>
                  {t("common_cancel")}
                </Button>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
