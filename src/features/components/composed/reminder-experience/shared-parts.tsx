import React from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "../../../../components/ui/AppText";

// ── Shared constants ────────────────────────────────────────────────
export const PRIMARY = "#0058BC";
export const COLLAPSE_START = 40;
export const COLLAPSE_END = 300;

// ── ReminderBadge ───────────────────────────────────────────────────
export function ReminderBadge({
  minutesLate,
}: {
  readonly minutesLate: number;
}) {
  const badgeLabel = minutesLate > 0 ? `${minutesLate} MIN OVERDUE` : "UP NEXT";

  return (
    <View style={styles.badge}>
      <AppText variant="labelSmall" style={styles.badgeText}>
        {badgeLabel}
      </AppText>
    </View>
  );
}

// ── ReminderTime ────────────────────────────────────────────────────
export function ReminderTime({
  scheduledAt,
  variant,
}: {
  readonly scheduledAt: string;
  readonly variant: "expanded" | "collapsed";
}) {
  return (
    <AppText
      variant="displayLarge"
      style={variant === "expanded" ? styles.expandedTime : styles.collapsedTime}
    >
      {scheduledAt}
    </AppText>
  );
}

// ── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.20)",
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    color: "rgba(255, 255, 255, 0.95)",
    textTransform: "uppercase",
    letterSpacing: 1.1,
    fontWeight: "700",
  },
  expandedTime: {
    color: "#FFFFFF",
    fontWeight: "800",
    letterSpacing: -1.6,
    lineHeight: 68,
    marginTop: -4,
  },
  collapsedTime: {
    color: "#FFFFFF",
    fontWeight: "800",
    letterSpacing: -1.4,
    lineHeight: 68,
    marginTop: 8,
    marginBottom: 16,
  },
});
