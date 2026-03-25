import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import type { PersonalDoseVM } from "@thuocare/personal";

interface PersonalDoseCardProps {
  dose: PersonalDoseVM;
  onTake: (dose: PersonalDoseVM) => void;
  onSkip: (dose: PersonalDoseVM) => void;
  /** Hoàn tác khi đánh dấu nhầm (xóa nhật ký liều). */
  onCorrect?: (dose: PersonalDoseVM) => void;
  /** Mở ô chọn giờ thực tế (uống trễ / ghi nhận khác giờ hẹn). */
  onLogTakenAtTime?: (dose: PersonalDoseVM) => void;
  /** Đặt lại rồi ghi nhận lại giờ uống (khi đã bấm đúng nhưng giờ sai). */
  onAdjustTakenTime?: (dose: PersonalDoseVM) => void;
  /** Mở màn chi tiết thuốc (Hôm nay → quản lý). */
  onOpenMedicationDetail?: (dose: PersonalDoseVM) => void;
  isPending: boolean;
  isCorrecting?: boolean;
}

function formatTime(isoTime: string): string {
  const parts = isoTime.split("T");
  if (parts.length < 2) return isoTime;
  return parts[1].slice(0, 5);
}

function formatTakenLine(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return formatTime(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return formatTime(iso);
  }
}

const STATUS_CONFIG: Record<
  PersonalDoseVM["status"],
  { label: string; color: string; bg: string }
> = {
  scheduled: { label: "Chưa uống", color: "#2563eb", bg: "#eff6ff" },
  taken: { label: "Đã uống", color: "#16a34a", bg: "#f0fdf4" },
  skipped: { label: "Bỏ qua", color: "#d97706", bg: "#fffbeb" },
  missed: { label: "Quên uống", color: "#dc2626", bg: "#fef2f2" },
};

export function PersonalDoseCard({
  dose,
  onTake,
  onSkip,
  onCorrect,
  onLogTakenAtTime,
  onAdjustTakenTime,
  onOpenMedicationDetail,
  isPending,
  isCorrecting,
}: PersonalDoseCardProps) {
  const cfg = STATUS_CONFIG[dose.status];
  const actionable = dose.status === "scheduled";
  const canCorrect = Boolean(onCorrect && dose.logId && dose.status !== "scheduled");
  const canLogCustomTime = Boolean(actionable && onLogTakenAtTime);
  const canAdjustTaken = Boolean(dose.status === "taken" && dose.logId && onAdjustTakenTime);

  return (
    <View style={[styles.card, { borderLeftColor: cfg.color }]}>
      <View style={styles.header}>
        <View style={styles.nameCol}>
          <Text style={styles.medName}>{dose.medicationName}</Text>
          {onOpenMedicationDetail ? (
            <Pressable onPress={() => onOpenMedicationDetail(dose)} hitSlop={6}>
              <Text style={styles.detailLink}>Chi tiết thuốc ›</Text>
            </Pressable>
          ) : null}
          {dose.strengthText ? (
            <Text style={styles.sub}>{dose.strengthText}</Text>
          ) : null}
          <Text style={styles.sub}>
            {dose.doseAmount} {dose.doseUnit}
          </Text>
        </View>
        <View style={styles.timeBlock}>
          <Text style={styles.time}>{formatTime(dose.scheduledTime)}</Text>
          <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>
      </View>
      {dose.status === "taken" && dose.actualTakenTime ? (
        <Text style={styles.takenLine}>Ghi nhận uống lúc {formatTakenLine(dose.actualTakenTime)}</Text>
      ) : null}
      {dose.notes ? <Text style={styles.notes}>{dose.notes}</Text> : null}
      {actionable ? (
        <View style={styles.actions}>
          <Pressable
            disabled={isPending}
            onPress={() => onTake(dose)}
            style={[styles.takeBtn, isPending && styles.disabled]}
          >
            <Text style={styles.takeBtnText}>Đã uống (giờ hiện tại)</Text>
          </Pressable>
          <Pressable
            disabled={isPending}
            onPress={() => onSkip(dose)}
            style={[styles.skipBtn, isPending && styles.disabled]}
          >
            <Text style={styles.skipBtnText}>Bỏ qua</Text>
          </Pressable>
        </View>
      ) : null}
      {canLogCustomTime ? (
        <Pressable
          disabled={isPending}
          onPress={() => onLogTakenAtTime?.(dose)}
          style={styles.subtleLink}
        >
          <Text style={styles.subtleLinkText}>Ghi nhận giờ uống khác…</Text>
        </Pressable>
      ) : null}
      {canAdjustTaken ? (
        <Pressable
          disabled={isPending || isCorrecting}
          onPress={() => onAdjustTakenTime?.(dose)}
          style={styles.subtleLink}
        >
          <Text style={styles.subtleLinkText}>Sửa giờ đã uống…</Text>
        </Pressable>
      ) : null}
      {canCorrect ? (
        <Pressable
          disabled={isCorrecting || isPending}
          onPress={() => onCorrect?.(dose)}
          style={styles.correctBtn}
        >
          <Text style={styles.correctBtnText}>
            {isCorrecting ? "Đang hoàn tác…" : "Sửa nhầm — đặt lại liều"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    borderLeftWidth: 3,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  nameCol: { flex: 1, paddingRight: 8 },
  medName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  detailLink: { fontSize: 12, fontWeight: "600", color: "#4a6670", marginTop: 4 },
  sub: { fontSize: 12, color: "#6b7280", marginTop: 1 },
  timeBlock: { alignItems: "flex-end", gap: 4 },
  time: { fontSize: 18, fontWeight: "700", color: "#111827" },
  badge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  takenLine: { fontSize: 12, fontWeight: "600", color: "#15803d" },
  notes: { fontSize: 12, color: "#9ca3af", fontStyle: "italic" },
  actions: { flexDirection: "row", gap: 8, marginTop: 4 },
  takeBtn: {
    flex: 1,
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center",
  },
  takeBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  skipBtn: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center",
  },
  skipBtnText: { color: "#374151", fontWeight: "600", fontSize: 14 },
  subtleLink: { alignSelf: "flex-start", paddingVertical: 4 },
  subtleLinkText: { fontSize: 12, fontWeight: "600", color: "#4a6670", textDecorationLine: "underline" },
  correctBtn: { marginTop: 2, alignSelf: "flex-start", paddingVertical: 6, paddingHorizontal: 4 },
  correctBtnText: { fontSize: 12, fontWeight: "600", color: "#4a6670", textDecorationLine: "underline" },
  disabled: { opacity: 0.5 },
});
