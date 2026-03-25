import React, { useMemo, useState } from "react";
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
import { useAddPersonalMedication } from "@/lib/personal/use-add-personal-medication";
import { localIsoDate } from "@/lib/adherence/history-window";
import type { FrequencyCode, DoseScheduleJson } from "@thuocare/personal";
import { FREQUENCY_LABELS, FREQUENCY_CODE_VALUES } from "@thuocare/personal";

const DOSE_UNITS = ["viên", "mg", "ml", "giọt", "gói", "miếng", "lần"];

const DOW_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"] as const;

export function AddMedicationScreen() {
  const router = useRouter();
  const { mutateAsync: addMed, isPending } = useAddPersonalMedication();

  const [displayName, setDisplayName] = useState("");
  const [strengthText, setStrengthText] = useState("");
  const [doseAmount, setDoseAmount] = useState("1");
  const [doseUnit, setDoseUnit] = useState("viên");
  const [frequencyCode, setFrequencyCode] = useState<FrequencyCode>("QD");
  const [startDate, setStartDate] = useState(localIsoDate());
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [showRoutineDetail, setShowRoutineDetail] = useState(false);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [intervalHoursStr, setIntervalHoursStr] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

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

  const handleSubmit = async () => {
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
      await addMed({
        displayName: displayName.trim(),
        strengthText: strengthText.trim() || undefined,
        doseAmount: amount,
        doseUnit,
        frequencyCode,
        doseSchedule: schedule,
        startDate,
        endDate: endDate.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      router.back();
    } catch {
      Alert.alert("Lỗi", "Không thể thêm thuốc. Vui lòng thử lại.");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.pageTitle}>Thêm thuốc</Text>
      <Text style={styles.catalogNote}>
        Nhập tên thuốc trực tiếp. Phiên bản này không tìm danh mục hay quản kho.
      </Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Tạm dừng và ngừng thuốc</Text>
        <Text style={styles.infoBody}>
          Sau khi thêm, bạn có thể tạm dừng (ẩn nhắc tạm thời) hoặc ngừng hẳn từ màn chi tiết / chỉnh sửa. Ngừng
          thường dùng khi không còn dùng thuốc đó nữa.
        </Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Tên thuốc *</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="VD: Paracetamol, Vitamin C..."
          placeholderTextColor="#9ca3af"
          autoCapitalize="words"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Hàm lượng (tùy chọn)</Text>
        <TextInput
          style={styles.input}
          value={strengthText}
          onChangeText={setStrengthText}
          placeholder="VD: 500mg, 10mg/5ml..."
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Liều mỗi lần</Text>
          <TextInput
            style={styles.input}
            value={doseAmount}
            onChangeText={setDoseAmount}
            keyboardType="decimal-pad"
            placeholder="1"
            placeholderTextColor="#9ca3af"
          />
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Đơn vị</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {DOSE_UNITS.map((u) => (
              <Pressable
                key={u}
                onPress={() => setDoseUnit(u)}
                style={[styles.chip, doseUnit === u && styles.chipActive]}
              >
                <Text style={[styles.chipText, doseUnit === u && styles.chipTextActive]}>{u}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Tần suất (gợi ý)</Text>
        <Text style={styles.hint}>Chọn mức gần đúng; tinh chỉnh giờ và ngày bên dưới.</Text>
        <View style={styles.freqGrid}>
          {(FREQUENCY_CODE_VALUES as readonly FrequencyCode[]).map((code) => (
            <Pressable
              key={code}
              onPress={() => setFrequencyCode(code)}
              style={[styles.freqChip, frequencyCode === code && styles.freqChipActive]}
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

      <Pressable onPress={() => setShowRoutineDetail((v) => !v)} style={styles.disclosureBtn}>
        <Text style={styles.disclosureBtnText}>
          {showRoutineDetail ? "Ẩn tùy chỉnh lịch" : "Tùy chỉnh lịch chi tiết"}
        </Text>
      </Pressable>

      {showRoutineDetail ? (
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
        optionalHint="Định dạng YYYY-MM-DD."
      />

      <IsoDateField
        label="Ngày kết thúc (tùy chọn)"
        value={endDate}
        onChangeText={setEndDate}
        optionalHint="Để trống nếu không có ngày kết thúc (VD: đợt điều trị ngắn)."
      />

      <View style={styles.field}>
        <Text style={styles.label}>Ghi chú (tùy chọn)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="VD: Uống sau bữa ăn..."
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={3}
        />
      </View>

      <Pressable
        onPress={() => void handleSubmit()}
        disabled={isPending}
        style={[styles.submitBtn, isPending && styles.disabled]}
      >
        {isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Thêm thuốc</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20, paddingBottom: 48 },
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 8 },
  catalogNote: { fontSize: 12, color: "#6b7280", lineHeight: 18, marginBottom: 14 },
  infoBox: {
    backgroundColor: "#f0f4f2",
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#dce6e1",
  },
  infoTitle: { fontSize: 13, fontWeight: "700", color: "#374942" },
  infoBody: { fontSize: 12, color: "#5c6f66", marginTop: 6, lineHeight: 18 },
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
});
