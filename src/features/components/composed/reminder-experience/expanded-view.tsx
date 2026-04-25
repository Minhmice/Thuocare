import React from "react";
import { Animated, StyleSheet, View } from "react-native";
import type { NextDoseGroup } from "../../../../types/home";
import { PrimaryMedicationCard } from "../primary-medication-card";
import { SliderConfirm } from "../slider-confirm";
import {
  COLLAPSE_END,
  COLLAPSE_START,
  PRIMARY,
  ReminderBadge,
  ReminderTime
} from "./shared-parts";

interface ExpandedViewProps {
  nextDose: NextDoseGroup;
  expandedHeight: number;
  topInset: number;
  onConfirm: () => void;
  scrollY?: Animated.Value;
}

export const ExpandedView: React.FC<ExpandedViewProps> = ({
  nextDose,
  expandedHeight,
  topInset,
  onConfirm,
  scrollY
}) => {
  return (
    <View
      style={[
        styles.surface,
        {
          minHeight: expandedHeight,
          height: expandedHeight,
          paddingTop: 36 + topInset,
          paddingBottom: 40
        }
      ]}
    >
      <View style={styles.topContent}>
        <ReminderBadge minutesLate={nextDose.minutesLate} />
        <ReminderTime scheduledAt={nextDose.scheduledAt} variant="expanded" />

        <View style={styles.cardsContainer}>
          <View style={styles.cards}>
            {nextDose.medications.map((med, index) => {
              const itemOpacity =
                scrollY?.interpolate({
                  inputRange: [
                    0,
                    COLLAPSE_START + index * 20,
                    COLLAPSE_END - 100
                  ],
                  outputRange: [1, 1, 0],
                  extrapolate: "clamp"
                }) ?? 1;

              const itemScale =
                scrollY?.interpolate({
                  inputRange: [0, COLLAPSE_START, COLLAPSE_END],
                  outputRange: [1, 1, 0.92],
                  extrapolate: "clamp"
                }) ?? 1;

              return (
                <Animated.View
                  key={med.id}
                  style={{
                    opacity: itemOpacity,
                    transform: [{ scale: itemScale }]
                  }}
                >
                  <PrimaryMedicationCard
                    name={med.name}
                    dosageNote={med.note ?? ""}
                    benefitText={med.instruction}
                  />
                </Animated.View>
              );
            })}
          </View>
        </View>
      </View>

      <Animated.View
        style={{
          transform: [
            {
              translateY:
                scrollY?.interpolate({
                  inputRange: [0, COLLAPSE_START, COLLAPSE_START + 100],
                  outputRange: [0, 0, 40],
                  extrapolate: "clamp"
                }) ?? 0
            }
          ]
        }}
      >
        <SliderConfirm
          size="lg"
          label="Slide to confirm all"
          onConfirm={onConfirm}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  surface: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    justifyContent: "space-between"
  },
  topContent: {
    gap: 16,
    flex: 1
  },
  cardsContainer: {
    flex: 1,
    marginTop: 8,
    marginBottom: 16
  },
  cards: {
    gap: 12,
    paddingBottom: 20
  }
});
