import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";

import { localIsoDate, localWallClockToUtcIso } from "@/lib/adherence/history-window";
import { usePersonalTimeline } from "@/lib/personal/use-personal-timeline";
import { useMarkPersonalDose } from "@/lib/personal/use-mark-personal-dose";
import { useResetPersonalDose } from "@/lib/personal/use-reset-personal-dose";
import { PersonalDoseCard } from "@/features/personal/components/PersonalDoseCard";
import { normalizeTimeToken } from "@/features/personal/lib/build-personal-schedule";
import type { PersonalDoseVM } from "@thuocare/personal";

function personalDoseRowKey(d: PersonalDoseVM): string {
  return `${d.personalMedicationId}:${d.scheduledTime}`;
}

type DayPart = "morning" | "afternoon" | "evening" | "night";

const PART_LABEL: Record<DayPart, string> = {
  morning: "Buổi sáng",
  afternoon: "Buổi chiều",
  evening: "Buổi tối",
  night: "Đêm",
};

const PART_ORDER: DayPart[] = ["morning", "afternoon", "evening", "night"];

function dayPartFromScheduled(iso: string): DayPart {
  const d = new Date(iso);
  const h = d.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

export function PersonalHomeScreen() {
  const router = useRouter();
  const todayIso = localIsoDate();

  const {
    data: timeline,
    isLoading: timelineLoading,
    isFetching: timelineFetching,
    refetch: refetchTimeline,
  } = usePersonalTimeline(todayIso);

  const { takeDose, skipDose, isPending: markPending } = useMarkPersonalDose(todayIso);
  const { mutate: resetDose, mutateAsync: resetDoseAsync, isPending: resetPending } =
    useResetPersonalDose(todayIso);

  const [takeTimeModal, setTakeTimeModal] = useState<{
    personalMedicationId: string;
    scheduledTime: string;
  } | null>(null);
  const [takeTimeInput, setTakeTimeInput] = useState("12:00");

  const isRefreshing = timelineFetching;

  const doses = timeline?.doses ?? [];

  const stats = useMemo(() => {
    const taken = doses.filter((d) => d.status === "taken").length;
    const scheduled = doses.filter((d) => d.status === "scheduled").length;
    const now = Date.now();
    const overdue = doses.filter(
      (d) => d.status === "scheduled" && new Date(d.scheduledTime).getTime() < now,
    );
    const nextScheduled = doses
      .filter((d) => d.status === "scheduled")
      .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
    const nextUp =
      nextScheduled.find((d) => new Date(d.scheduledTime).getTime() >= now) ?? null;

    const needsAttention = doses.filter((d) => {
      if (d.status === "missed" || d.status === "skipped") return true;
      if (d.status === "scheduled" && new Date(d.scheduledTime).getTime() < now) return true;
      return false;
    });

    const byPart = new Map<DayPart, PersonalDoseVM[]>();
    for (const p of PART_ORDER) byPart.set(p, []);
    for (const d of doses) {
      const part = dayPartFromScheduled(d.scheduledTime);
      byPart.get(part)!.push(d);
    }
    for (const p of PART_ORDER) {
      byPart.get(p)!.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
    }

    return { taken, scheduled, overdue, nextUp, needsAttention, byPart };
  }, [doses]);

  const hiddenTimelineKeys = useMemo(() => {
    const s = new Set<string>();
    for (const d of stats.needsAttention) s.add(personalDoseRowKey(d));
    if (stats.nextUp) s.add(personalDoseRowKey(stats.nextUp));
    return s;
  }, [stats.needsAttention, stats.nextUp]);

  const handleRefresh = () => {
    void refetchTimeline();
  };

  const handleTake = (dose: PersonalDoseVM) => {
    takeDose({
      personalMedicationId: dose.personalMedicationId,
      scheduledTime: dose.scheduledTime,
    });
  };

  const openTakeAtTime = (dose: PersonalDoseVM) => {
    const hint = dose.scheduledTime.split("T")[1]?.slice(0, 5) ?? "08:00";
    setTakeTimeInput(hint);
    setTakeTimeModal({
      personalMedicationId: dose.personalMedicationId,
      scheduledTime: dose.scheduledTime,
    });
  };

  const confirmTakeAtTime = () => {
    if (!takeTimeModal) return;
    const norm = normalizeTimeToken(takeTimeInput.trim());
    if (!norm) {
      Alert.alert("Giờ không hợp lệ", "Nhập theo dạng 24h, VD: 08:30");
      return;
    }
    const doseDay = takeTimeModal.scheduledTime.slice(0, 10);
    takeDose({
      personalMedicationId: takeTimeModal.personalMedicationId,
      scheduledTime: takeTimeModal.scheduledTime,
      actualTakenTime: localWallClockToUtcIso(doseDay, norm),
    });
    setTakeTimeModal(null);
  };

  const handleAdjustTakenTime = (dose: PersonalDoseVM) => {
    Alert.alert(
      "Sửa giờ đã uống?",
      "Chúng tôi sẽ xóa ghi nhận hiện tại để bạn nhập lại giờ uống đúng.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Tiếp tục",
          onPress: () => {
            void (async () => {
              try {
                await resetDoseAsync(dose);
                openTakeAtTime(dose);
              } catch {
                Alert.alert("Lỗi", "Không thể đặt lại ghi nhận.");
              }
            })();
          },
        },
      ],
    );
  };

  const goMedDetail = (dose: PersonalDoseVM) => {
    router.push(`/(personal)/medication/${dose.personalMedicationId}` as never);
  };

  const handleSkip = (dose: PersonalDoseVM) => {
    skipDose({
      personalMedicationId: dose.personalMedicationId,
      scheduledTime: dose.scheduledTime,
    });
  };

  const handleCorrect = (dose: PersonalDoseVM) => {
    Alert.alert(
      "Đặt lại liều?",
      "Thao tác này xóa ghi nhận uống/bỏ qua cho liều này (dùng khi bấm nhầm).",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đặt lại",
          onPress: () => resetDose(dose),
        },
      ],
    );
  };

  const showBuckets = doses.length >= 4;

  return (
    <>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.headerBlock}>
        <Text style={styles.greeting}>Hôm nay</Text>
        <Text style={styles.dateText}>{formatDate(todayIso)}</Text>
        {doses.length > 0 ? (
          <Text style={styles.summaryLine}>
            {stats.taken} đã uống
            {stats.scheduled > 0 ? ` · ${stats.scheduled} còn lại` : ""}
          </Text>
        ) : (
          <Text style={styles.summaryLineMuted}>Chưa có liều nào trong ngày</Text>
        )}
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push("/(tabs)/medications" as never)} style={styles.headerLink}>
            <Text style={styles.headerLinkText}>Thuốc của tôi</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/(tabs)/history" as never)} style={styles.headerLink}>
            <Text style={styles.headerLinkText}>Lịch sử</Text>
          </Pressable>
        </View>
      </View>

      {timelineLoading ? (
        <ActivityIndicator size="small" color="#4a6670" style={styles.loader} />
      ) : null}

      {!timelineLoading && stats.nextUp ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Liều kế tiếp</Text>
          <PersonalDoseCard
            dose={stats.nextUp}
            onTake={handleTake}
            onSkip={handleSkip}
            onCorrect={handleCorrect}
            onLogTakenAtTime={openTakeAtTime}
            onAdjustTakenTime={handleAdjustTakenTime}
            onOpenMedicationDetail={goMedDetail}
            isPending={markPending}
            isCorrecting={resetPending}
          />
        </View>
      ) : null}

      {!timelineLoading && stats.needsAttention.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cần xem lại</Text>
          <Text style={styles.sectionHint}>Quên uống, bỏ qua, hoặc đến giờ nhưng chưa ghi nhận.</Text>
          {stats.needsAttention.map((dose) => (
            <PersonalDoseCard
              key={`${dose.personalMedicationId}:${dose.scheduledTime}:${dose.logId ?? "v"}`}
              dose={dose}
              onTake={handleTake}
              onSkip={handleSkip}
              onCorrect={handleCorrect}
              onLogTakenAtTime={openTakeAtTime}
              onAdjustTakenTime={handleAdjustTakenTime}
              onOpenMedicationDetail={goMedDetail}
              isPending={markPending}
              isCorrecting={resetPending}
            />
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Lịch trong ngày</Text>
        </View>

        {timelineLoading ? null : doses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Chưa có lịch uống thuốc</Text>
            <Text style={styles.emptyDesc}>Thêm thuốc ở tab Thuốc để có nhắc trong ngày.</Text>
            <Pressable
              onPress={() => router.push("/(personal)/add-medication" as never)}
              style={styles.inlineBtn}
            >
              <Text style={styles.inlineBtnText}>Thêm thuốc</Text>
            </Pressable>
          </View>
        ) : showBuckets ? (
          PART_ORDER.map((part) => {
            const list = (stats.byPart.get(part) ?? []).filter(
              (d) => !hiddenTimelineKeys.has(personalDoseRowKey(d)),
            );
            if (list.length === 0) return null;
            return (
              <View key={part} style={styles.bucket}>
                <Text style={styles.bucketTitle}>{PART_LABEL[part]}</Text>
                {list.map((dose) => (
                  <PersonalDoseCard
                    key={`${dose.personalMedicationId}:${dose.scheduledTime}:${dose.logId ?? "v"}`}
                    dose={dose}
                    onTake={handleTake}
                    onSkip={handleSkip}
                    onCorrect={handleCorrect}
                    onLogTakenAtTime={openTakeAtTime}
                    onAdjustTakenTime={handleAdjustTakenTime}
                    onOpenMedicationDetail={goMedDetail}
                    isPending={markPending}
                    isCorrecting={resetPending}
                  />
                ))}
              </View>
            );
          })
        ) : (
          doses
            .filter((dose) => !hiddenTimelineKeys.has(personalDoseRowKey(dose)))
            .map((dose) => (
              <PersonalDoseCard
                key={`${dose.personalMedicationId}:${dose.scheduledTime}:${dose.logId ?? "v"}`}
                dose={dose}
                onTake={handleTake}
                onSkip={handleSkip}
                onCorrect={handleCorrect}
                onLogTakenAtTime={openTakeAtTime}
                onAdjustTakenTime={handleAdjustTakenTime}
                onOpenMedicationDetail={goMedDetail}
                isPending={markPending}
                isCorrecting={resetPending}
              />
            ))
        )}
      </View>
    </ScrollView>

    <Modal transparent animationType="fade" visible={takeTimeModal != null}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalBackdrop}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setTakeTimeModal(null)} />
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Giờ uống thực tế</Text>
          <Text style={styles.modalBody}>
            Nhập giờ bạn đã uống (hôm nay). Liều hẹn vẫn giữ nguyên; chỉ lưu thời điểm uống thực tế.
          </Text>
          <TextInput
            style={styles.modalInput}
            value={takeTimeInput}
            onChangeText={setTakeTimeInput}
            placeholder="08:30"
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />
          <View style={styles.modalRow}>
            <Pressable onPress={() => setTakeTimeModal(null)} style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>Hủy</Text>
            </Pressable>
            <Pressable
              onPress={confirmTakeAtTime}
              disabled={markPending}
              style={[styles.modalOk, markPending && styles.disabledModal]}
            >
              <Text style={styles.modalOkText}>Lưu</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
    </>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  const months = [
    "tháng 1",
    "tháng 2",
    "tháng 3",
    "tháng 4",
    "tháng 5",
    "tháng 6",
    "tháng 7",
    "tháng 8",
    "tháng 9",
    "tháng 10",
    "tháng 11",
    "tháng 12",
  ];
  const dow = new Date(y, m - 1, d).getDay();
  return `${days[dow]}, ${d} ${months[m - 1]}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f5" },
  content: { paddingBottom: 40 },
  headerBlock: {
    backgroundColor: "#3d5248",
    paddingTop: 20,
    paddingBottom: 22,
    paddingHorizontal: 20,
  },
  greeting: { color: "#c5d4cc", fontSize: 13, fontWeight: "600" },
  dateText: { color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 4 },
  summaryLine: { color: "#e8f0ec", fontSize: 14, marginTop: 10, fontWeight: "500" },
  summaryLineMuted: { color: "#a8bdb2", fontSize: 14, marginTop: 10 },
  headerActions: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 },
  headerLink: {
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  headerLinkText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  loader: { marginTop: 20 },
  section: { marginTop: 18 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1c2a24", paddingHorizontal: 16, marginBottom: 6 },
  sectionHint: { fontSize: 12, color: "#5c6f66", paddingHorizontal: 16, marginBottom: 8, lineHeight: 18 },
  bucket: { marginBottom: 6 },
  bucketTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5c6f66",
    paddingHorizontal: 16,
    marginBottom: 6,
    marginTop: 4,
  },
  emptyCard: {
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 22,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#e2e8e4",
  },
  emptyTitle: { fontSize: 15, fontWeight: "600", color: "#374942" },
  emptyDesc: { fontSize: 13, color: "#7a8a82", textAlign: "center", lineHeight: 19 },
  inlineBtn: {
    marginTop: 8,
    backgroundColor: "#4a6670",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  inlineBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    gap: 12,
    zIndex: 2,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  modalBody: { fontSize: 14, color: "#4b5563", lineHeight: 21 },
  modalInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  modalRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  modalCancelText: { fontWeight: "700", color: "#374151" },
  modalOk: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10, backgroundColor: "#2563eb" },
  modalOkText: { fontWeight: "800", color: "#fff" },
  disabledModal: { opacity: 0.5 },
});
