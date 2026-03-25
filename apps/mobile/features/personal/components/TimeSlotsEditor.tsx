import React from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";

import { normalizeTimeToken } from "@/features/personal/lib/build-personal-schedule";

interface TimeSlotsEditorProps {
  times: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

function ensureSlots(times: string[]): string[] {
  return times.length > 0 ? [...times] : [""];
}

/** Add/remove rows; normalize each slot to HH:MM on blur. */
export function TimeSlotsEditor({ times, onChange, disabled }: TimeSlotsEditorProps) {
  const slots = ensureSlots(times);

  const setSlot = (index: number, raw: string) => {
    const next = ensureSlots(times);
    next[index] = raw;
    onChange(next);
  };

  const onBlurSlot = (index: number) => {
    const next = ensureSlots(times);
    const raw = next[index]?.trim() ?? "";
    if (!raw) {
      next.splice(index, 1);
      onChange(next.length > 0 ? next : []);
      return;
    }
    const n = normalizeTimeToken(raw);
    if (n) next[index] = n;
    onChange(next);
  };

  const addRow = () => {
    const base = ensureSlots(times).filter((t) => t.trim() !== "");
    onChange([...base, "08:00"]);
  };

  const removeRow = (index: number) => {
    const next = ensureSlots(times);
    next.splice(index, 1);
    onChange(next.length > 0 ? next : []);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Giờ uống trong ngày</Text>
      <Text style={styles.hint}>Định dạng 24h (VD: 08:00). Xóa hết ô để dùng giờ gợi ý theo tần suất.</Text>
      {slots.map((t, index) => (
        <View key={`slot-${index}`} style={styles.row}>
          <TextInput
            style={[styles.input, disabled && styles.inputDisabled]}
            value={t}
            onChangeText={(v) => setSlot(index, v)}
            onBlur={() => onBlurSlot(index)}
            placeholder="08:00"
            placeholderTextColor="#9ca3af"
            keyboardType="numbers-and-punctuation"
            maxLength={5}
            editable={!disabled}
          />
          {!disabled && slots.length > 1 ? (
            <Pressable onPress={() => removeRow(index)} style={styles.removeBtn} hitSlop={8}>
              <Text style={styles.removeText}>✕</Text>
            </Pressable>
          ) : (
            <View style={styles.removePlaceholder} />
          )}
        </View>
      ))}
      {!disabled ? (
        <Pressable onPress={addRow} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Thêm giờ</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151" },
  hint: { fontSize: 12, color: "#6b7280", lineHeight: 17 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  inputDisabled: { opacity: 0.55 },
  removeBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
  },
  removeText: { fontSize: 16, color: "#b91c1c", fontWeight: "700" },
  removePlaceholder: { width: 40 },
  addBtn: { alignSelf: "flex-start", paddingVertical: 6 },
  addBtnText: { fontSize: 14, fontWeight: "700", color: "#4a6670" },
});
