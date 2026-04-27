import { useFocusEffect, useRouter, type Href } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { AppScreen } from "../../components/ui/AppScreen";
import { getProfile } from "../../features/me/repository";
import {
  normalizeVnPhoneForDisplay,
  vnPhoneToNationalDisplay
} from "../../lib/phone/vnDisplay";
import { profileDisplayFromFullName } from "../../lib/profile/displayFromFullName";
import { useAuth } from "../../lib/auth/AuthProvider";
import type { ReminderPreference, RoutineStage } from "../../lib/auth/storage";
import type { AppLanguage } from "../../lib/i18n/storage";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import { MainTabBar } from "../../features/components/composed/main-tab-bar";

// New component system
import { ScreenHeader } from "../../features/components/composed/screen-header";
import { SettingsSection } from "../../features/components/composed/settings-section";
import { SupportSection } from "../../features/components/composed/support-section";
import { SecondaryButton } from "../../features/components/wrapper/button/secondary";
import { Card } from "../../features/components/wrapper/card";
import { Typography } from "../../features/components/wrapper/typography";

// ─── helpers ────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (
      (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")
    ).toUpperCase();
  }
  return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
}

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

// ─── screen ─────────────────────────────────────────────────────────────────

export default function MeScreen() {
  const { record, signOut } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const { language, locale, setLanguage, t } = useLanguage();

  const profileLoadedRef = useRef(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [remoteProfile, setRemoteProfile] = useState<Awaited<
    ReturnType<typeof getProfile>
  > | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setProfileError(null);
      if (!profileLoadedRef.current) {
        setProfileLoading(true);
      }
      const data = await getProfile();
      profileLoadedRef.current = true;
      setRemoteProfile(data);
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "Failed to load profile"
      );
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile])
  );

  // Should never be null here — tabs are protected — but guard gracefully
  if (!record) {
    return <LoadingState />;
  }

  if (profileLoading && !profileLoadedRef.current) {
    return (
      <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        <LoadingState />
        <MainTabBar />
      </View>
    );
  }

  if (profileError) {
    return (
      <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        <ErrorState message={profileError} onRetry={loadProfile} />
        <MainTabBar />
      </View>
    );
  }

  const fullNameSource = remoteProfile?.fullName ?? record.fullName;
  const profileHeadline = profileDisplayFromFullName(fullNameSource);
  const phoneE164 = normalizeVnPhoneForDisplay(
    remoteProfile?.phone || record.phone
  );
  const phoneNational = vnPhoneToNationalDisplay(phoneE164);
  const emailDisplay =
    [remoteProfile?.email, record.email].find(
      (e) => (e ?? "").trim().length > 0
    ) ?? "";

  const memberSinceIso = remoteProfile?.joinedAt ?? record.createdAt;

  const reminderLabelByPreference: Record<ReminderPreference, string> = {
    quiet: t("reminder_gentle"),
    balanced: t("reminder_balanced"),
    firm: t("reminder_firm")
  };

  const routineLabelByStage: Record<RoutineStage, string> = {
    starting: t("routine_starting"),
    steady: t("routine_steady"),
    resetting: t("routine_resetting")
  };

  const reminderLabel = record.reminderPreference
    ? reminderLabelByPreference[record.reminderPreference]
    : t("settings_notSet");

  const routineLabel = record.routineStage
    ? routineLabelByStage[record.routineStage]
    : t("settings_notSet");

  const languageValue =
    language === "vi"
      ? t("settings_languageValueVietnamese")
      : t("settings_languageValueEnglish");

  async function chooseLanguage(nextLanguage: AppLanguage) {
    await setLanguage(nextLanguage);
  }

  function handleFeedbackPress() {
    router.push("/feedback" as Href);
  }

  function handleLanguagePicker() {
    Alert.alert(t("settings_languagePickerTitle"), undefined, [
      {
        text: t("settings_languageEnglish"),
        onPress: () => {
          void chooseLanguage("en").catch(() => undefined);
        }
      },
      {
        text: t("settings_languageVietnamese"),
        onPress: () => {
          void chooseLanguage("vi").catch(() => undefined);
        }
      },
      { text: t("common_cancel"), style: "cancel" }
    ]);
  }

  function handleSignOut() {
    Alert.alert(t("settings_signOutTitle"), t("settings_signOutConfirm"), [
      { text: t("common_cancel"), style: "cancel" },
      {
        text: t("settings_signOut"),
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/sign-in");
        }
      }
    ]);
  }

  const accountItems = [
    {
      id: "phone",
      label: t("settings_phone"),
      value: phoneNational,
      onPress: () =>
        Alert.alert(t("common_comingSoon"), t("settings_phoneSoon"))
    },
    {
      id: "email",
      label: t("settings_email"),
      value:
        emailDisplay.trim().length > 0 ? emailDisplay : t("settings_notAdded"),
      onPress: () =>
        Alert.alert(t("common_comingSoon"), t("settings_emailSoon"))
    },
    {
      id: "member_since",
      label: t("settings_memberSince"),
      value: formatDate(memberSinceIso, locale),
      onPress: () => {},
      showChevron: false
    }
  ];

  const reminderItems = [
    {
      id: "intensity",
      label: t("settings_reminderIntensity"),
      value: reminderLabel,
      onPress: () =>
        Alert.alert(t("common_comingSoon"), t("settings_notificationSoon"))
    },
    {
      id: "condition",
      label: t("settings_conditionType"),
      value: routineLabel,
      onPress: () =>
        Alert.alert(t("common_comingSoon"), t("settings_routineSoon"))
    },
    {
      id: "notifications",
      label: t("settings_notifications"),
      value: t("common_comingSoon"),
      onPress: () => Alert.alert(t("common_comingSoon"), t("settings_pushSoon"))
    },
    {
      id: "language",
      label: t("settings_language"),
      value: languageValue,
      onPress: handleLanguagePicker
    }
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <AppScreen>
        <ScreenHeader
          title={t("settings_title")}
          subtitle={t("settings_subtitle")}
          style={styles.header}
        />

        {/* ── 1. Profile summary ─────────────────────────────────────────── */}
        <Card variant="elevated" style={styles.profileCard}>
          <View style={styles.profileContent}>
            {/* Avatar — initials placeholder */}
            <View
              style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
            >
              <Typography variant="headline-sm" weight="bold" color="#FFFFFF">
                {getInitials(fullNameSource)}
              </Typography>
            </View>

            {/* Identity — display = last word of full name (+ repeat last char); data from Supabase or auth */}
            <View style={styles.identity}>
              <Typography variant="title-lg" weight="bold">
                {profileHeadline}
              </Typography>
              <Typography
                variant="body-md"
                color={theme.colors.onSurfaceVariant}
              >
                {phoneNational}
              </Typography>
              {emailDisplay.trim().length > 0 ? (
                <Typography
                  variant="body-sm"
                  color={theme.colors.onSurfaceVariant}
                >
                  {emailDisplay}
                </Typography>
              ) : null}
            </View>
          </View>
        </Card>

        {/* ── 2. Account details ─────────────────────────────────────────── */}
        <SettingsSection
          title={t("settings_section_account")}
          items={accountItems}
        />

        {/* ── 3. Reminders & notifications ───────────────────────────────── */}
        <SettingsSection
          title={t("settings_section_reminders")}
          items={reminderItems}
        />

        {/* ── 4. Support ─────────────────────────────────────────────────── */}
        <SupportSection
          title={t("settings_section_support")}
          description={t("settings_supportDescription")}
          actionLabel={t("settings_supportAction")}
          onPress={handleFeedbackPress}
        />

        {/* ── 5. Sign out ────────────────────────────────────────────────── */}
        <SecondaryButton
          label={t("settings_signOut")}
          onPress={handleSignOut}
          labelStyle={{ color: theme.colors.error, fontWeight: "600" }}
          style={[
            styles.signOutButton,
            { backgroundColor: "rgba(196, 30, 30, 0.08)" }
          ]}
        />
      </AppScreen>
      <MainTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 0,
    marginBottom: 0
  },
  profileCard: {
    padding: 24,
    borderRadius: 32
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center"
  },
  identity: {
    flex: 1,
    gap: 2
  },
  signOutButton: {
    marginTop: 8,
    marginBottom: 120 // Space for internal tab bar
  }
});
