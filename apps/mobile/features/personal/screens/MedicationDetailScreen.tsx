import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";

import { localIsoDate } from "@/lib/adherence/history-window";
import { describeScheduleBrief } from "@/features/personal/lib/build-personal-schedule";
import { usePersonalMedicationDetail } from "@/lib/personal/use-personal-medication-detail";
import { usePersonalMedicationAdherenceSnippet } from "@/lib/personal/use-personal-medication-adherence-snippet";
import { usePersonalTimeline } from "@/lib/personal/use-personal-timeline";
import { useUpdatePersonalMedication } from "@/lib/personal/use-update-personal-medication";
import { useStopPersonalMedication } from "@/lib/personal/use-stop-personal-medication";
import { FREQUENCY_LABELS } from "@thuocare/personal";
import type { PersonalDoseVM } from "@thuocare/personal";

type Props = { medicationId: string };

const STATUS_VI: Record<string, string> = {
  active: "Đang dùng",
  paused: "Tạm dừng",
  stopped: "Đã ngừng",
};

const DOSE_STATUS_VI: Record<string, string> = {
  taken: "Đã uống",
  missed: "Quên",
  skipped: "Bỏ qua",
  scheduled: "Chưa ghi",
};

function formatClock(iso: string): string {
  const p = iso.split("T")[1];
  return p ? p.slice(0, 5) : iso;
}

function statusExplain(status: string): string {
  if (status === "active") return "Thuốc đang trong lịch — bạn sẽ thấy liều trên màn Hôm nay.";
  if (status === "paused")
    return "Tạm dừng: không nhắc liều cho đến khi bạn tiếp tục. Dùng khi du lịch hoặc tạm không uống.";
  return "Đã ngừng: không còn liều mới. Lịch sử cũ vẫn giữ trong tab Lịch sử.";
}

function nextDoseForMedication(
  doses: PersonalDoseVM[] | undefined,
  medicationId: string,
): PersonalDoseVM | null {
  if (!doses?.length) return null;
  const sched = doses
    .filter((d) => d.personalMedicationId === medicationId && d.status === "scheduled")
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  if (sched.length === 0) return null;
  const now = Date.now();
  const upcoming = sched.find((d) => new Date(d.scheduledTime).getTime() >= now);
  return upcoming ?? sched[0];
}

export function MedicationDetailScreen({ medicationId }: Props) {
  const router = useRouter();
  const todayIso = localIsoDate();
  const { data: med, isLoading, isError } = usePersonalMedicationDetail(medicationId);
  const { data: timeline } = usePersonalTimeline(todayIso);
  const { data: snippet, isLoading: snippetLoading } = usePersonalMedicationAdherenceSnippet(medicationId);

  const { mutateAsync: updateMed, isPending: updating } = useUpdatePersonalMedication(medicationId);
  const { mutateAsync: stopMed, isPending: stopping } = useStopPersonalMedication(medicationId);

  const nextDose = useMemo(
    () => nextDoseForMedication(timeline?.doses, medicationId),
    [timeline?.doses, medicationId],
  );

  const confirmStop = () => {
    Alert.alert(
      "Ngừng thuốc?",
      "Bạn sẽ không còn nhắc liều mới cho thuốc này. Lịch sử vẫn được giữ.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Ngừng",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await stopMed();
                router.back();
              } catch {
                Alert.alert("Lỗi", "Không thể ngừng thuốc.");
              }
            })();
          },
        },
      ],
    );
  };

  const togglePause = () => {
    if (!med || med.status === "stopped") return;
    const next = med.status === "paused" ? "active" : "paused";
    void (async () => {
      try {
        await updateMed({ status: next });
      } catch {
        Alert.alert("Lỗi", "Không thể đổi trạng thái.");
      }
    })();
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4a6670" />
        <Text style={styles.muted}>Đang tải…</Text>
      </View>
    );
  }

  if (isError || !med) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Không tìm thấy thuốc.</Text>
        <Pressable onPress={() => router.back()} style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  const scheduleText = describeScheduleBrief(med.doseSchedule);
  const stopped = med.status === "stopped";
  const paused = med.status === "paused";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.name}>{med.displayName}</Text>
        {med.strengthText ? <Text style={styles.strength}>{med.strengthText}</Text> : null}
        <View style={[styles.statusPill, paused && styles.statusPillPaused, stopped && styles.statusPillStopped]}>
          <Text style={styles.statusPillText}>{STATUS_VI[med.status] ?? med.status}</Text>
        </View>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusCardTitle}>Trạng thái</Text>
        <Text style={styles.statusCardBody}>{statusExplain(med.status)}</Text>
      </View>

      {!stopped && nextDose ? (
        <View style={styles.nextCard}>
          <Text style={styles.nextTitle}>Liều kế tiếp (hôm nay)</Text>
          <Text style={styles.nextTime}>{formatClock(nextDose.scheduledTime)}</Text>
          <Text style={styles.nextHint}>Mở tab Hôm nay để ghi nhận đã uống hoặc bỏ qua.</Text>
          <Pressable onPress={() => router.push("/(tabs)" as never)} style={styles.linkBtn}>
            <Text style={styles.linkBtnText}>Đi tới Hôm nay</Text>
          </Pressable>
        </View>
      ) : !stopped && med.doseSchedule.type !== "prn" ? (
        <View style={styles.nextCardMuted}>
          <Text style={styles.nextTitleMuted}>Liều kế tiếp</Text>
          <Text style={styles.mutedSmall}>Không còn liều chưa ghi trong hôm nay — hoặc lịch đã hết trong ngày.</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>Tóm tắt điều trị</Text>
        <Row label="Liều mỗi lần" value={`${med.doseAmount} ${med.doseUnit}`} />
        <Row label="Tần suất" value={`${med.frequencyCode} — ${FREQUENCY_LABELS[med.frequencyCode]}`} />
        <Row label="Lịch uống" value={scheduleText} />
        <Row label="Bắt đầu" value={med.startDate} />
        {med.endDate ? <Row label="Kết thúc" value={med.endDate} /> : null}
        {med.notes ? (
          <View style={styles.notesBlock}>
            <Text style={styles.notesLabel}>Ghi chú</Text>
            <Text style={styles.notesBody}>{med.notes}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>14 ngày gần đây</Text>
        {snippetLoading ? (
          <ActivityIndicator size="small" color="#4a6670" />
        ) : snippet ? (
          <>
            <Text style={styles.snippetStats}>
              Đã uống {snippet.takenCount} · Quên {snippet.missedCount} · Bỏ qua {snippet.skippedCount}
              {snippet.adherenceRate != null
                ? ` · ${Math.round(snippet.adherenceRate * 100)}% trong các lần đã ghi nhận`
                : ""}
            </Text>
            {snippet.recentEvents.length > 0 ? (
              <View style={styles.eventList}>
                {snippet.recentEvents.map((ev, i) => (
                  <View key={`${ev.scheduledTime}-${i}`} style={styles.eventRow}>
                    <Text style={styles.eventMain}>
                      {ev.scheduledDate} {formatClock(ev.scheduledTime)} · {DOSE_STATUS_VI[ev.status] ?? ev.status}
                    </Text>
                    {ev.status === "taken" && ev.actualTakenTime ? (
                      <Text style={styles.eventSub}>Ghi nhận lúc {formatClock(ev.actualTakenTime)}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.mutedSmall}>Chưa có sự kiện trong cửa sổ này.</Text>
            )}
          </>
        ) : null}
      </View>

      {!stopped ? (
        <View style={styles.actions}>
          <Pressable
            onPress={() => router.push(`/(personal)/edit-medication/${medicationId}` as never)}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>Chỉnh sửa lịch & liều</Text>
          </Pressable>
          <View style={styles.rowBtns}>
            <Pressable
              onPress={() => void togglePause()}
              disabled={updating || stopping}
              style={[styles.secondaryBtn, styles.flex]}
            >
              <Text style={styles.secondaryBtnText}>{paused ? "Tiếp tục" : "Tạm dừng"}</Text>
            </Pressable>
            <Pressable
              onPress={confirmStop}
              disabled={updating || stopping}
              style={[styles.dangerBtn, styles.flex]}
            >
              <Text style={styles.dangerBtnText}>{stopping ? "…" : "Ngừng"}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Text style={styles.stoppedNote}>
          Thuốc đã ngừng — không thể chỉnh lịch. Xem lại liều cũ ở tab Lịch sử.
        </Text>
      )}
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f5" },
  content: { padding: 20, paddingBottom: 48 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 12 },
  muted: { color: "#5c6f66", fontSize: 14 },
  mutedSmall: { fontSize: 13, color: "#7a8a82", lineHeight: 19 },
  errorText: { color: "#b45309", fontSize: 16 },
  hero: { marginBottom: 16 },
  name: { fontSize: 24, fontWeight: "700", color: "#1c2a24" },
  strength: { fontSize: 15, color: "#5c6f66", marginTop: 4 },
  statusPill: {
    alignSelf: "flex-start",
    marginTop: 12,
    backgroundColor: "#dcfce7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusPillPaused: { backgroundColor: "#ffedd5" },
  statusPillStopped: { backgroundColor: "#e5e7eb" },
  statusPillText: { fontSize: 12, fontWeight: "700", color: "#166534" },
  statusCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e2e8e4",
  },
  statusCardTitle: { fontSize: 12, fontWeight: "800", color: "#374942", textTransform: "uppercase" },
  statusCardBody: { fontSize: 14, color: "#4a5560", marginTop: 8, lineHeight: 22 },
  nextCard: {
    backgroundColor: "#eff6ff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  nextCardMuted: {
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  nextTitle: { fontSize: 12, fontWeight: "800", color: "#1e40af" },
  nextTitleMuted: { fontSize: 12, fontWeight: "800", color: "#374942" },
  nextTime: { fontSize: 28, fontWeight: "800", color: "#1d4ed8", marginTop: 6 },
  nextHint: { fontSize: 13, color: "#3b4f6a", marginTop: 8, lineHeight: 20 },
  linkBtn: {
    alignSelf: "flex-start",
    marginTop: 12,
    backgroundColor: "#2563eb",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  linkBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#e2e8e4",
    marginBottom: 14,
  },
  cardSectionTitle: { fontSize: 13, fontWeight: "800", color: "#374942", marginBottom: 4 },
  row: { gap: 4 },
  rowLabel: { fontSize: 12, fontWeight: "600", color: "#7a8a82", textTransform: "uppercase" },
  rowValue: { fontSize: 15, color: "#1c2a24", lineHeight: 22 },
  notesBlock: { marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#eef2f0" },
  notesLabel: { fontSize: 12, fontWeight: "600", color: "#7a8a82" },
  notesBody: { fontSize: 14, color: "#374942", marginTop: 6, lineHeight: 21 },
  snippetStats: { fontSize: 14, color: "#374942", lineHeight: 22 },
  eventList: { marginTop: 10, gap: 10 },
  eventRow: { borderLeftWidth: 3, borderLeftColor: "#94a3b8", paddingLeft: 10 },
  eventMain: { fontSize: 13, fontWeight: "600", color: "#1c2a24" },
  eventSub: { fontSize: 12, color: "#64748b", marginTop: 2 },
  actions: { gap: 12 },
  primaryBtn: {
    backgroundColor: "#4a6670",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  rowBtns: { flexDirection: "row", gap: 10 },
  flex: { flex: 1 },
  secondaryBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c5d0ca",
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  secondaryBtnText: { color: "#374942", fontWeight: "700", fontSize: 15 },
  dangerBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#dc2626",
  },
  dangerBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  stoppedNote: { fontSize: 13, color: "#5c6f66", lineHeight: 20 },
});
