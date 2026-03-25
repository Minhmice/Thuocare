import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import type { PersonalMedicationVM } from "@thuocare/personal";

interface PersonalMedicationCardProps {
  medication: PersonalMedicationVM;
  onPress?: () => void;
  /** Giờ liều kế tiếp trong ngày (HH:MM), từ timeline hôm nay — chỉ gắn cho thuốc đang dùng */
  nextDoseTodayHhMm?: string | null;
}

function contextLine(m: PersonalMedicationVM): string | null {
  if (m.status === "paused") {
    return "Tạm dừng — không có nhắc liều cho đến khi bạn tiếp tục.";
  }
  if (m.status === "active" && m.endDate) {
    return `Ngày kết thúc: ${m.endDate}`;
  }
  return null;
}

export function PersonalMedicationCard({
  medication,
  onPress,
  nextDoseTodayHhMm,
}: PersonalMedicationCardProps) {
  const statusColor =
    medication.status === "active" ? "#16a34a" : medication.status === "paused" ? "#d97706" : "#6b7280";

  const extra = contextLine(medication);
  const showNext =
    medication.status === "active" && nextDoseTodayHhMm != null && nextDoseTodayHhMm.length > 0;

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.name}>{medication.displayName}</Text>
          {medication.strengthText ? (
            <Text style={styles.detail}>{medication.strengthText}</Text>
          ) : null}
          <Text style={styles.detail}>
            {medication.doseAmount} {medication.doseUnit} · {medication.frequencyLabel}
          </Text>
          {showNext ? (
            <Text style={styles.nextDose}>Liều kế tiếp hôm nay: {nextDoseTodayHhMm}</Text>
          ) : null}
          {extra ? <Text style={styles.context}>{extra}</Text> : null}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {medication.status === "active"
              ? "Đang dùng"
              : medication.status === "paused"
                ? "Tạm dừng"
                : "Đã ngừng"}
          </Text>
        </View>
      </View>
      {medication.notes ? <Text style={styles.notes}>{medication.notes}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: "600", color: "#111827" },
  detail: { fontSize: 13, color: "#6b7280" },
  nextDose: { fontSize: 12, fontWeight: "600", color: "#4a6670", marginTop: 4 },
  context: { fontSize: 12, color: "#6b7280", marginTop: 2, lineHeight: 17 },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: { fontSize: 12, fontWeight: "600" },
  notes: { fontSize: 12, color: "#9ca3af", fontStyle: "italic" },
});
