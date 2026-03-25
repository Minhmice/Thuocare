import React, { useMemo } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";

interface IsoDateFieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  editable?: boolean;
  optionalHint?: string;
}

/** YYYY-MM-DD with light validation feedback (no native date picker dependency). */
export function IsoDateField({
  label,
  value,
  onChangeText,
  placeholder = "2026-03-25",
  editable = true,
  optionalHint,
}: IsoDateFieldProps) {
  const valid = useMemo(() => {
    if (!value.trim()) return null;
    return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
  }, [value]);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {optionalHint ? <Text style={styles.hint}>{optionalHint}</Text> : null}
      <TextInput
        style={[
          styles.input,
          !editable && styles.inputDisabled,
          valid === false && styles.inputInvalid,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        autoCapitalize="none"
        keyboardType="numbers-and-punctuation"
        maxLength={10}
        editable={editable}
      />
      {valid === false ? (
        <Text style={styles.error}>Dùng định dạng YYYY-MM-DD (VD: 2026-03-25)</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 4, gap: 6 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151" },
  hint: { fontSize: 12, color: "#6b7280", lineHeight: 17 },
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
  inputInvalid: { borderColor: "#f87171", backgroundColor: "#fef2f2" },
  error: { fontSize: 12, color: "#dc2626" },
});
