import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "../../../../components/ui/AppText";
import type { NextDoseGroup } from "../../../../types/home";
import { SliderConfirm } from "../slider-confirm";

export type ReminderExperienceProps = {
  readonly nextDose: NextDoseGroup;
  readonly viewportHeight: number;
  readonly topInset: number;
  readonly onConfirm: () => void;
  readonly onSnooze?: () => void;
  readonly onSkip?: () => void;
  readonly scrollY?: any; // kept for backwards compat but ignored
  readonly children: React.ReactNode;
};

export function ReminderExperience({
  nextDose,
  onConfirm,
  onSnooze,
  onSkip,
}: ReminderExperienceProps) {
  const insets = useSafeAreaInsets();

  const isOverdue = nextDose.minutesLate > 0;
  const badgeLabel = isOverdue ? `Overdue \u00B7 ${nextDose.minutesLate}m late` : "Due now";

  // e.g. "Evening dose"
  const getPeriodLabel = (time?: string) => {
    if (!time) return "Scheduled dose";
    const parts = time.split(':');
    const hhStr = parts[0];
    if (!hhStr) return "Scheduled dose";
    
    const hour = parseInt(hhStr, 10);
    if (!isNaN(hour)) {
      if (hour < 12) return "Morning dose";
      if (hour < 17) return "Afternoon dose";
      if (hour < 21) return "Evening dose";
      return "Night dose";
    }
    return "Scheduled dose";
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" animated />
      <LinearGradient
        colors={["#0058BC", "#003B82"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.mainContainer, { paddingTop: Math.max(32, insets.top + 16), paddingBottom: Math.max(24, insets.bottom + 16) }]}>
        
        {/* Top Area: Overdue Badge */}
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#FFFFFF" />
            <AppText variant="labelMedium" style={styles.badgeText}>
              {badgeLabel}
            </AppText>
          </View>
        </View>

        {/* Hero Center */}
        <View style={styles.heroCenter}>
          <AppText style={styles.timeText}>
            {nextDose.scheduledAt}
          </AppText>
          <AppText variant="headlineSmall" style={styles.subtitleText}>
            {getPeriodLabel(nextDose.scheduledAt)}
          </AppText>
          <View style={styles.contextRow}>
            <MaterialCommunityIcons name="clock-outline" size={18} color="#ADC6FF" />
            <AppText variant="bodyMedium" style={styles.contextText}>
              {nextDose.medications.length} {nextDose.medications.length === 1 ? 'medicine' : 'medicines'}
            </AppText>
          </View>
        </View>

        {/* Medicine Zone */}
        <ScrollView style={styles.medicineZone} contentContainerStyle={styles.medicineZoneContent} showsVerticalScrollIndicator={false}>
          {nextDose.medications.map((med) => (
            <View key={med.id} style={styles.medCard}>
              <View style={styles.medCardContent}>
                <View style={styles.dueNowChip}>
                  <AppText style={styles.dueNowChipText}>DUE NOW</AppText>
                </View>
                <AppText variant="titleMedium" style={styles.medName}>
                  {med.name}
                </AppText>
                <AppText variant="bodyMedium" style={styles.medDetails}>
                  {med.note || "Take as prescribed"} {med.instruction ? `\u00B7 ${med.instruction}` : ''}
                </AppText>
              </View>
              <View style={styles.medIconBox}>
                <MaterialCommunityIcons name="pill" size={32} color="#0058BC" />
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Bottom Action Area */}
        <View style={styles.bottomSection}>
          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.actionButton} onPress={onSnooze} activeOpacity={0.8}>
              <MaterialCommunityIcons name="sleep" size={24} color="#FFFFFF" />
              <AppText variant="labelLarge" style={styles.actionButtonText}>
                Snooze 10 min
              </AppText>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={onSkip} activeOpacity={0.8}>
              <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
              <AppText variant="labelLarge" style={styles.actionButtonText}>
                Skip dose
              </AppText>
            </TouchableOpacity>
          </View>

          <View style={styles.primaryAction}>
            <SliderConfirm
              label="Slide to confirm dose"
              onConfirm={onConfirm}
              size="lg"
            />
            <AppText variant="bodySmall" style={styles.sliderHelper}>
              Marks {nextDose.medications.length} {nextDose.medications.length === 1 ? 'medicine' : 'medicines'} as taken now.
            </AppText>
          </View>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999, // Ensure it's rendered as a takeover
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  badgeContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  badgeText: {
    color: "#FFFFFF",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  heroCenter: {
    alignItems: "center",
    marginBottom: 32,
  },
  timeText: {
    fontSize: 88,
    lineHeight: 88,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -2,
    marginBottom: 4,
  },
  subtitleText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 8,
  },
  contextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contextText: {
    color: "#ADC6FF",
  },
  medicineZone: {
    flex: 1,
  },
  medicineZoneContent: {
    gap: 16,
    paddingBottom: 24,
  },
  medCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: 16,
  },
  medCardContent: {
    flex: 1,
  },
  dueNowChip: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0, 88, 188, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 8,
  },
  dueNowChipText: {
    color: "#0058BC",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  medName: {
    color: "#1A1C1F",
    fontWeight: "700",
    marginBottom: 4,
  },
  medDetails: {
    color: "#414755",
  },
  medIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#E8F1FF",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomSection: {
    marginTop: "auto",
    gap: 24,
  },
  secondaryActions: {
    flexDirection: "row",
    gap: 16,
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 16,
    borderRadius: 20,
    gap: 8,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  primaryAction: {
    gap: 12,
  },
  sliderHelper: {
    textAlign: "center",
    color: "#ADC6FF",
  },
});

