import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import type { PersonalDailyTimelineVM, PersonalDoseVM } from "@thuocare/personal";

import { safeFormatDate } from "@/features/adherence-history/components/HistoryDayGroup";

function safeFormatTime(isoDateTime: string | null) {
  if (!isoDateTime) return "—";
  try {
    const d = new Date(isoDateTime);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

function PersonalHistoryEventRow({
  dose,
  onPressMedication,
}: {
  dose: PersonalDoseVM;
  onPressMedication?: (medicationId: string) => void;
}) {
  const isTaken = dose.status === "taken";
  const isMissed = dose.status === "missed";
  const isSkipped = dose.status === "skipped";

  let statusColor = "#9ca3af";
  let statusText = "Đã lên lịch";
  if (isTaken) {
    statusColor = "#10b981";
    statusText = "Đã uống";
  } else if (isMissed) {
    statusColor = "#ef4444";
    statusText = "Bỏ lỡ";
  } else if (isSkipped) {
    statusColor = "#f59e0b";
    statusText = "Bỏ qua";
  }

  const timeLabel = safeFormatTime(dose.actualTakenTime || dose.scheduledTime);

  const body = (
    <>
      <Text style={styles.title} numberOfLines={2}>
        {dose.medicationName || "Thuốc"}
      </Text>
      <Text style={styles.doseInfo}>
        {dose.doseAmount} {dose.doseUnit}
        {dose.strengthText ? ` · ${dose.strengthText}` : ""}
      </Text>
      <Text style={[styles.statusTag, { color: statusColor }]}>{statusText}</Text>
    </>
  );

  return (
    <View style={styles.row}>
      <View style={styles.timeCol}>
        <Text style={styles.timeText} numberOfLines={1}>
          {timeLabel}
        </Text>
        <View style={[styles.dot, { backgroundColor: statusColor }]} />
      </View>
      {onPressMedication ? (
        <Pressable
          onPress={() => onPressMedication(dose.personalMedicationId)}
          style={styles.card}
          accessibilityRole="button"
        >
          {body}
        </Pressable>
      ) : (
        <View style={styles.card}>{body}</View>
      )}
    </View>
  );
}

export function PersonalHistoryDayGroup({
  dayInfo,
  onPressMedication,
}: {
  dayInfo: PersonalDailyTimelineVM;
  onPressMedication?: (medicationId: string) => void;
}) {
  if (!dayInfo.doses || dayInfo.doses.length === 0) return null;

  const taken = dayInfo.doses.filter((d) => d.status === "taken").length;
  const missed = dayInfo.doses.filter((d) => d.status === "missed").length;
  const skipped = dayInfo.doses.filter((d) => d.status === "skipped").length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.dateTitle}>{safeFormatDate(dayInfo.date)}</Text>
        <Text style={styles.statsText}>
          {taken} uống · {missed} quên · {skipped} bỏ qua
        </Text>
      </View>
      <View>
        {dayInfo.doses.map((dose, idx) => (
          <PersonalHistoryEventRow
            key={dose.logId ?? `${dose.personalMedicationId}-${dose.scheduledTime}-${idx}`}
            dose={dose}
            onPressMedication={onPressMedication}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 24 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  dateTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#374151",
    textTransform: "capitalize",
  },
  statsText: { fontSize: 12, color: "#6b7280" },
  row: {
    flexDirection: "row",
    marginBottom: 14,
    paddingHorizontal: 16,
  },
  timeCol: {
    width: 56,
    alignItems: "center",
  },
  timeText: { fontSize: 12, color: "#6b7280", marginBottom: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  title: { fontSize: 15, fontWeight: "600", color: "#111827" },
  doseInfo: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  statusTag: { fontSize: 12, fontWeight: "600", marginTop: 8 },
});
