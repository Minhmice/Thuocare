import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Animated, StyleSheet, View } from "react-native";
import { AppText } from "../../../../components/ui/AppText";
import type { NextDoseGroup } from "../../../../types/home";
import { SliderConfirm } from "../slider-confirm";
import {
  COLLAPSE_END,
  PRIMARY,
  ReminderBadge,
  ReminderTime
} from "./shared-parts";

// ── Compact medication rows (collapsed-only layout) ─────────────────
function CompactMedicationRows({
  nextDose,
  scrollY
}: {
  readonly nextDose: NextDoseGroup;
  readonly scrollY?: Animated.Value;
}) {
  return (
    <View style={styles.compactList}>
      {nextDose.medications.map((med, index) => {
        const rowOpacity =
          scrollY?.interpolate({
            inputRange: [
              COLLAPSE_END - 130 + index * 20,
              COLLAPSE_END - 40 + index * 20
            ],
            outputRange: [0, 1],
            extrapolate: "clamp"
          }) ?? 1;

        const rowTranslateX =
          scrollY?.interpolate({
            inputRange: [
              COLLAPSE_END - 130 + index * 20,
              COLLAPSE_END - 40 + index * 20
            ],
            outputRange: [12, 0],
            extrapolate: "clamp"
          }) ?? 0;

        return (
          <Animated.View
            key={med.id}
            style={{
              opacity: rowOpacity,
              transform: [{ translateX: rowTranslateX }]
            }}
          >
            {index > 0 && <View style={styles.compactDivider} />}
            <View style={styles.compactRow}>
              <View style={styles.compactTextWrap}>
                <AppText variant="titleMedium" style={styles.compactName}>
                  {med.name}
                </AppText>
                <AppText variant="bodyMedium" style={styles.compactBenefit}>
                  {med.instruction}
                </AppText>
              </View>

              <View style={styles.compactIconWrap}>
                <MaterialCommunityIcons
                  name="pill"
                  size={22}
                  color="rgba(255, 255, 255, 0.96)"
                />
              </View>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

// ── CollapsedView ───────────────────────────────────────────────────
interface CollapsedViewProps {
  nextDose: NextDoseGroup;
  onConfirm: () => void;
  scrollY?: Animated.Value;
}

export const CollapsedView: React.FC<CollapsedViewProps> = ({
  nextDose,
  onConfirm,
  scrollY
}) => {
  return (
    <View style={styles.collapsedCard}>
      <View style={styles.header}>
        <ReminderBadge minutesLate={nextDose.minutesLate} />
        <ReminderTime scheduledAt={nextDose.scheduledAt} variant="collapsed" />
      </View>

      <CompactMedicationRows nextDose={nextDose} scrollY={scrollY} />

      {/* Slider removed for compact card view per user request */}
    </View>
  );
};

// ── Collapsed-specific styles ───────────────────────────────────────
const styles = StyleSheet.create({
  collapsedCard: {
    flex: 1,
    backgroundColor: PRIMARY,
    borderRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12, // Ultra tight bottom padding
    justifyContent: "flex-start",
    gap: 12
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4
  },
  compactList: {
    gap: 8,
    marginTop: 0
  },
  compactDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 8
  },
  compactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  compactTextWrap: {
    flex: 1
  },
  compactName: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "600"
  },
  compactBenefit: {
    display: "none" // Hide instruction to save space
  },
  compactIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center"
  }
});
