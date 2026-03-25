import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";

import { IsoDateField } from "@/features/personal/components/IsoDateField";
import { RoutinePreviewBox } from "@/features/personal/components/RoutinePreviewBox";
import { TimeSlotsEditor } from "@/features/personal/components/TimeSlotsEditor";
import {
  isIntervalFrequency,
  normalizeTimeToken,
  scheduleFromRoutineState,
} from "@/features/personal/lib/build-personal-schedule";
import { usePersonalMedicationDetail } from "@/lib/personal/use-personal-medication-detail";
import { useUpdatePersonalMedication } from "@/lib/personal/use-update-personal-medication";
import { useStopPersonalMedication } from "@/lib/personal/use-stop-personal-medication";
import type { FrequencyCode, DoseScheduleJson } from "@thuocare/personal";
import { FREQUENCY_LABELS, FREQUENCY_CODE_VALUES } from "@thuocare/personal";

const DOSE_UNITS = ["viên", "mg", "ml", "giọt", "gói", "miếng", "lần"];
const DOW_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"] as const;

type Props = { medicationId: string };

export function EditMedicationScreen({ medicationId }: Props) {
  const router = useRouter();
  const { data: med, isLoading, isError } = usePersonalMedicationDetail(medicationId);
  const { mutateAsync: updateMed, isPending: saving } = useUpdatePersonalMedication(medicationId);
  const { mutateAsync: stopMed, isPending: stopping } = useStopPersonalMedication(medicationId);

  const [displayName, setDisplayName] = useState("");
  const [strengthText, setStrengthText] = useState("");
  const [doseAmount, setDoseAmount] = useState("1");
  const [doseUnit, setDoseUnit] = useState("viên");
  const [frequencyCode, setFrequencyCode] = useState<FrequencyCode>("QD");
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showRoutineDetail, setShowRoutineDetail] = useState(false);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [intervalHoursStr, setIntervalHoursStr] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  useEffect(() => {
    if (!med) return;
    setDisplayName(med.displayName);
    setStrengthText(med.strengthText ?? "");
    setDoseAmount(String(med.doseAmount));
    setDoseUnit(med.doseUnit);
    setFrequencyCode(med.frequencyCode);
    setNotes(med.notes ?? "");
    setStartDate(med.startDate);
    setEndDate(med.endDate ?? "");

    const s = med.doseSchedule;
    if (s.type === "fixed_times_daily") {
      setTimeSlots([...s.dose_times]);
      setSelectedDays(s.days_of_week ?? []);
      setIntervalHoursStr("");
    } else if (s.type === "interval_based") {
      setIntervalHoursStr(String(s.interval_hours));
      setTimeSlots([]);
      setSelectedDays([]);
    } else {
      setTimeSlots([]);
      setIntervalHoursStr("");
      setSelectedDays([]);
    }
  }, [med]);

  const toggleDay = (d: number) => {
    setSelectedDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  };

  const previewSchedule: DoseScheduleJson = useMemo(() => {
    const slots = timeSlots
      .map((t) => normalizeTimeToken(t.trim()))
      .filter((x): x is string => x != null);
    return scheduleFromRoutineState({
      frequencyCode,
      customTimeSlots: slots,
      intervalHoursStr,
      selectedDays,
    });
  }, [frequencyCode, timeSlots, intervalHoursStr, selectedDays]);

  const computeScheduleForSave = (): DoseScheduleJson => {
    const slots = timeSlots
      .map((t) => normalizeTimeToken(t.trim()))
      .filter((x): x is string => x != null);
    return scheduleFromRoutineState({
      frequencyCode,
      customTimeSlots: slots,
      intervalHoursStr,
      selectedDays,
    });
  };

  const stopped = med?.status === "stopped";
  const paused = med?.status === "paused";

  const handleSave = async () => {
    if (!med || stopped) return;
    if (!displayName.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tên thuốc.");
      return;
    }
    const amount = parseFloat(doseAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Liều không hợp lệ", "Vui lòng nhập liều hợp lệ.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      Alert.alert("Ngày không hợp lệ", "Ngày bắt đầu dùng định dạng YYYY-MM-DD.");
      return;
    }
    if (endDate.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(endDate.trim())) {
      Alert.alert("Ngày không hợp lệ", "Ngày kết thúc dùng định dạng YYYY-MM-DD hoặc để trống.");
      return;
    }

    const schedule = computeScheduleForSave();
    if (schedule.type === "fixed_times_daily" && schedule.dose_times.length === 0) {
      Alert.alert("Lịch uống", "Thêm ít nhất một giờ hoặc để trống danh sách để dùng gợi ý theo tần suất.");
      return;
    }

    try {
      await updateMed({
        displayName: displayName.trim(),
        strengthText: strengthText.trim() ? strengthText.trim() : null,
        doseAmount: amount,
        doseUnit,
        frequencyCode,
        doseSchedule: schedule,
        startDate,
        endDate: endDate.trim() === "" ? null : endDate.trim(),
        notes: notes.trim() === "" ? undefined : notes.trim(),
      });
      router.back();
    } catch {
      Alert.alert("Lỗi", "Không thể cập nhật. Vui lòng thử lại.");
    }
  };

  const togglePause = async () => {
    if (!med || stopped) return;
    try {
      await updateMed({ status: paused ? "active" : "paused" });
      router.back();
    } catch {
      Alert.alert("Lỗi", "Không thể đổi trạng thái tạm dừng.");
    }
  };

  const confirmStop = () => {
    if (stopped) return;
    Alert.alert(
      "Ngừng thuốc",
      "Bạn sẽ không còn nhắc liều cho thuốc này. Bạn có chắc không?",
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.pageTitle}>Chỉnh sửa thuốc</Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Tạm dừng so với ngừng</Text>
        <Text style={styles.infoBody}>
          Tạm dừng: ẩn nhắc trong lúc bạn không uống (du lịch, hết thuốc tạm thời). Tiếp tục bất cứ lúc nào. Ngừng:
          kết thúc hẳn lịch — thường không quay lại trừ khi thêm lại thuốc mới.
        </Text>
      </View>

      {stopped ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Thuốc này đã ngừng. Bạn không thể chỉnh sửa lịch uống.</Text>
        </View>
      ) : null}

      <View style={styles.field}>
        <Text style={styles.label}>Tên thuốc *</Text>
        <TextInput
          style={[styles.input, stopped && styles.inputDisabled]}
          value={displayName}
          onChangeText={setDisplayName}
          editable={!stopped}
          placeholder="Tên thuốc"
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Hàm lượng (tùy chọn)</Text>
        <TextInput
          style={[styles.input, stopped && styles.inputDisabled]}
          value={strengthText}
          onChangeText={setStrengthText}
          editable={!stopped}
          placeholder="VD: 500mg"
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Liều mỗi lần</Text>
          <TextInput
            style={[styles.input, stopped && styles.inputDisabled]}
            value={doseAmount}
            onChangeText={setDoseAmount}
            editable={!stopped}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Đơn vị</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {DOSE_UNITS.map((u) => (
              <Pressable
                key={u}
                onPress={() => !stopped && setDoseUnit(u)}
                style={[styles.chip, doseUnit === u && styles.chipActive, stopped && styles.chipDisabled]}
              >
                <Text style={[styles.chipText, doseUnit === u && styles.chipTextActive]}>{u}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Tần suất (gợi ý)</Text>
        <Text style={styles.hint}>Đổi mã tần suất khi cần; tinh chỉnh giờ ở phần tùy chỉnh.</Text>
        <View style={styles.freqGrid}>
          {(FREQUENCY_CODE_VALUES as readonly FrequencyCode[]).map((code) => (
            <Pressable
              key={code}
              onPress={() => !stopped && setFrequencyCode(code)}
              style={[
                styles.freqChip,
                frequencyCode === code && styles.freqChipActive,
                stopped && styles.freqChipDisabled,
              ]}
            >
              <Text style={[styles.freqCode, frequencyCode === code && styles.freqCodeActive]}>{code}</Text>
              <Text style={[styles.freqLabel, frequencyCode === code && styles.freqLabelActive]}>
                {FREQUENCY_LABELS[code]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <RoutinePreviewBox frequencyCode={frequencyCode} schedule={previewSchedule} />

      {!stopped ? (
        <Pressable onPress={() => setShowRoutineDetail((v) => !v)} style={styles.disclosureBtn}>
          <Text style={styles.disclosureBtnText}>
            {showRoutineDetail ? "Ẩn tùy chỉnh lịch" : "Tùy chỉnh lịch chi tiết"}
          </Text>
        </Pressable>
      ) : null}

      {!stopped && showRoutineDetail ? (
        <View style={styles.detailCard}>
          {frequencyCode === "PRN" ? (
            <Text style={styles.detailMuted}>Khi cần — không có giờ cố định.</Text>
          ) : isIntervalFrequency(frequencyCode) ? (
            <>
              <Text style={styles.label}>Khoảng cách (giờ)</Text>
              <TextInput
                style={styles.input}
                value={intervalHoursStr}
                onChangeText={setIntervalHoursStr}
                placeholder={frequencyCode === "Q8H" ? "8" : "12"}
                placeholderTextColor="#9ca3af"
                keyboardType="decimal-pad"
              />
            </>
          ) : (
            <TimeSlotsEditor times={timeSlots} onChange={setTimeSlots} />
          )}
          {frequencyCode !== "PRN" ? (
            <>
              <Text style={[styles.label, { marginTop: 14 }]}>Ngày trong tuần (tùy chọn)</Text>
              <Text style={styles.detailMuted}>Không chọn = mỗi ngày.</Text>
              <View style={styles.dowRow}>
                {DOW_LABELS.map((label, idx) => (
                  <Pressable
                    key={label}
                    onPress={() => toggleDay(idx)}
                    style={[styles.dowChip, selectedDays.includes(idx) && styles.dowChipActive]}
                  >
                    <Text style={[styles.dowChipText, selectedDays.includes(idx) && styles.dowChipTextActive]}>
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}
        </View>
      ) : null}

      <IsoDateField
        label="Ngày bắt đầu"
        value={startDate}
        onChangeText={setStartDate}
        editable={!stopped}
        optionalHint="Định dạng YYYY-MM-DD."
      />

      <IsoDateField
        label="Ngày kết thúc (tùy chọn)"
        value={endDate}
        onChangeText={setEndDate}
        editable={!stopped}
        optionalHint="Để trống nếu không có ngày kết thúc (VD: đợt điều trị ngắn)."
      />

      <View style={styles.field}>
        <Text style={styles.label}>Ghi chú (tùy chọn)</Text>
        <TextInput
          style={[styles.input, styles.textArea, stopped && styles.inputDisabled]}
          value={notes}
          onChangeText={setNotes}
          editable={!stopped}
          multiline
          numberOfLines={3}
        />
      </View>

      {!stopped ? (
        <Pressable
          onPress={() => void handleSave()}
          disabled={saving}
          style={[styles.submitBtn, saving && styles.disabled]}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Lưu thay đổi</Text>}
        </Pressable>
      ) : null}

      {!stopped ? (
        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => void togglePause()}
            style={[styles.secondaryBtn, styles.flex]}
            disabled={saving || stopping}
          >
            <Text style={styles.secondaryBtnText}>{paused ? "Tiếp tục" : "Tạm dừng"}</Text>
          </Pressable>
          <Pressable
            onPress={confirmStop}
            style={[styles.dangerBtn, styles.flex]}
            disabled={saving || stopping}
          >
            {stopping ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.dangerBtnText}>Ngừng thuốc</Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20, paddingBottom: 48 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 12 },
  muted: { color: "#6b7280", fontSize: 14 },
  errorText: { color: "#dc2626", fontSize: 16 },
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 12 },
  infoBox: {
    backgroundColor: "#f0f4f2",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#dce6e1",
  },
  infoTitle: { fontSize: 13, fontWeight: "700", color: "#374942" },
  infoBody: { fontSize: 12, color: "#5c6f66", marginTop: 6, lineHeight: 18 },
  banner: {
    backgroundColor: "#fef3c7",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fcd34d",
  },
  bannerText: { fontSize: 13, color: "#92400e" },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  hint: { fontSize: 12, color: "#6b7280", marginBottom: 8 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: "#111827",
  },
  inputDisabled: { opacity: 0.55 },
  textArea: { height: 80, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 12 },
  chipRow: { flexDirection: "row" },
  chip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 6,
    backgroundColor: "#fff",
  },
  chipActive: { borderColor: "#4a6670", backgroundColor: "#e8eeeb" },
  chipDisabled: { opacity: 0.5 },
  chipText: { fontSize: 13, color: "#374151" },
  chipTextActive: { color: "#3d5248", fontWeight: "600" },
  freqGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  freqChip: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
    minWidth: 90,
    alignItems: "center",
    gap: 2,
  },
  freqChipActive: { borderColor: "#4a6670", backgroundColor: "#e8eeeb" },
  freqChipDisabled: { opacity: 0.5 },
  freqCode: { fontSize: 14, fontWeight: "700", color: "#374151" },
  freqCodeActive: { color: "#3d5248" },
  freqLabel: { fontSize: 10, color: "#9ca3af" },
  freqLabelActive: { color: "#4a6670" },
  disclosureBtn: { marginBottom: 12 },
  disclosureBtnText: { fontSize: 14, fontWeight: "700", color: "#4a6670" },
  detailCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 8,
  },
  detailMuted: { fontSize: 12, color: "#6b7280", lineHeight: 17, marginTop: 6 },
  dowRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  dowChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  dowChipActive: { borderColor: "#4a6670", backgroundColor: "#e8eeeb" },
  dowChipText: { fontSize: 12, fontWeight: "600", color: "#374151" },
  dowChipTextActive: { color: "#1c2a24" },
  submitBtn: {
    backgroundColor: "#4a6670",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
  },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  disabled: { opacity: 0.6 },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  flex: { flex: 1 },
  secondaryBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  secondaryBtnText: { color: "#374151", fontWeight: "600", fontSize: 15 },
  dangerBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#dc2626",
  },
  dangerBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
