import React from "react";
import { View, Text, StyleSheet } from "react-native";

import { describeScheduleBrief } from "@/features/personal/lib/build-personal-schedule";
import type { DoseScheduleJson } from "@thuocare/personal";
import { FREQUENCY_LABELS } from "@thuocare/personal";
import type { FrequencyCode } from "@thuocare/personal";

interface RoutinePreviewBoxProps {
  frequencyCode: FrequencyCode;
  schedule: DoseScheduleJson;
}

export function RoutinePreviewBox({ frequencyCode, schedule }: RoutinePreviewBoxProps) {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>Xem trước lịch</Text>
      <Text style={styles.line}>
        <Text style={styles.k}>Tần suất: </Text>
        {frequencyCode} — {FREQUENCY_LABELS[frequencyCode]}
      </Text>
      <Text style={styles.line}>
        <Text style={styles.k}>Lịch lưu: </Text>
        {describeScheduleBrief(schedule)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    gap: 6,
    marginTop: 4,
  },
  title: { fontSize: 12, fontWeight: "800", color: "#166534", textTransform: "uppercase" },
  line: { fontSize: 13, color: "#14532d", lineHeight: 20 },
  k: { fontWeight: "700", color: "#15803d" },
});
