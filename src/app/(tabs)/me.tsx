import { useRouter } from "expo-router";
import React from 'react';
import { Alert, StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { AppScreen } from "../../components/ui/AppScreen";
import { useAuth } from "../../lib/auth/AuthProvider";
import type { ReminderPreference, RoutineStage } from "../../lib/auth/storage";

// New component system
import { ScreenHeader } from "../../features/components/composed/screen-header";
import { SettingsSection } from "../../features/components/composed/settings-section";
import { SupportSection } from "../../features/components/composed/support-section";
import { Button } from "../../features/components/wrapper/button";
import { Card } from "../../features/components/wrapper/card";
import { Typography } from "../../features/components/wrapper/typography";

// ─── helpers ────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
  }
  return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

const REMINDER_LABEL: Record<ReminderPreference, string> = {
  quiet: "Gentle",
  balanced: "Balanced",
  firm: "Firm"
};

const ROUTINE_LABEL: Record<RoutineStage, string> = {
  starting: "Short-term illness",
  steady: "Ongoing condition",
  resetting: "Not sure yet"
};

// ─── screen ─────────────────────────────────────────────────────────────────

export default function MeScreen() {
  const { record, signOut } = useAuth();
  const router = useRouter();
  const theme = useTheme();

  // Should never be null here — tabs are protected — but guard gracefully
  if (!record) {
    return (
      <AppScreen>
        <Typography color={theme.colors.onSurfaceVariant}>
          Loading profile…
        </Typography>
      </AppScreen>
    );
  }

  const reminderLabel = record.reminderPreference
    ? REMINDER_LABEL[record.reminderPreference]
    : "Not set";

  const routineLabel = record.routineStage
    ? ROUTINE_LABEL[record.routineStage]
    : "Not set";

  function handleSignOut() {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
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
      id: 'phone', 
      label: 'Phone', 
      value: record.phone, 
      onPress: () => Alert.alert("Coming soon", "Edit phone feature is in development.") 
    },
    { 
      id: 'email', 
      label: 'Email', 
      value: record.email ?? "Not added", 
      onPress: () => Alert.alert("Coming soon", "Edit email feature is in development.") 
    },
    { 
      id: 'member_since', 
      label: 'Member since', 
      value: formatDate(record.createdAt), 
      onPress: () => {}, 
      showChevron: false 
    },
  ];

  const reminderItems = [
    { 
      id: 'intensity', 
      label: 'Reminder intensity', 
      value: reminderLabel, 
      onPress: () => Alert.alert("Coming soon", "Notification settings are coming soon.") 
    },
    { 
      id: 'condition', 
      label: 'Condition type', 
      value: routineLabel, 
      onPress: () => Alert.alert("Coming soon", "Routine settings are coming soon.") 
    },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      value: 'Coming soon', 
      onPress: () => Alert.alert("Coming soon", "Push notification settings are coming soon.") 
    },
  ];

  return (
    <AppScreen>
      <ScreenHeader 
        title="Tài khoản" 
        subtitle="Quản lý thông tin cá nhân"
        style={styles.header}
      />

      {/* ── 1. Profile summary ─────────────────────────────────────────── */}
      <Card variant="elevated" style={styles.profileCard}>
        <View style={styles.profileContent}>
          {/* Avatar — initials placeholder */}
          <View
            style={[
              styles.avatar,
              { backgroundColor: theme.colors.primary }
            ]}
          >
            <Typography
              variant="headline-sm"
              weight="bold"
              color="#FFFFFF"
            >
              {getInitials(record.fullName)}
            </Typography>
          </View>

          {/* Identity */}
          <View style={styles.identity}>
            <Typography variant="title-lg" weight="bold">
              {record.fullName}
            </Typography>
            <Typography variant="body-md" color={theme.colors.onSurfaceVariant}>
              {record.phone}
            </Typography>
            {record.email ? (
              <Typography variant="body-sm" color={theme.colors.onSurfaceVariant}>
                {record.email}
              </Typography>
            ) : null}
          </View>
        </View>
      </Card>

      {/* ── 2. Account details ─────────────────────────────────────────── */}
      <SettingsSection title="Thông tin chung" items={accountItems} />

      {/* ── 3. Reminders & notifications ───────────────────────────────── */}
      <SettingsSection title="Nhắc nhở & Thông báo" items={reminderItems} />

      {/* ── 4. Support ─────────────────────────────────────────────────── */}
      <SupportSection
        title="Hỗ trợ & Trợ giúp"
        description="Bạn cần hỗ trợ về thuốc hoặc ứng dụng? Đội ngũ của chúng tôi luôn sẵn sàng."
        actionLabel="Nhận hỗ trợ"
        onPress={() => Alert.alert("Hỗ trợ", "Tính năng hỗ trợ sẽ sớm ra mắt.")}
      />

      {/* ── 5. Sign out ────────────────────────────────────────────────── */}
      <Button
        variant="text"
        label="Đăng xuất"
        onPress={handleSignOut}
        labelStyle={{ color: theme.colors.error }}
        style={styles.signOutButton}
      />

    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 0,
    marginBottom: 0,
  },
  profileCard: {
    padding: 24,
    borderRadius: 32,
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  identity: {
    flex: 1,
    gap: 2,
  },
  signOutButton: {
    marginTop: 8,
    marginBottom: 40,
  },
});
