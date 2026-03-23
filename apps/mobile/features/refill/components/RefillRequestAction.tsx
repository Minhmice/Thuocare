import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';

interface Props {
  isSubmitting: boolean;
  onSubmit: (note?: string) => void;
}

export function RefillRequestAction({ isSubmitting, onSubmit }: Props) {
  const [isExpanding, setIsExpanding] = useState(false);
  const [note, setNote] = useState('');

  if (!isExpanding) {
    return (
      <Pressable style={styles.primaryButton} onPress={() => setIsExpanding(true)}>
        <Text style={styles.primaryButtonText}>Yêu cầu cấp lại thuốc</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.expandedContainer}>
      <Text style={styles.label}>Ghi chú cho bác sĩ (không bắt buộc)</Text>
      <TextInput 
        style={styles.input}
        placeholder="Nhập ghi chú..."
        value={note}
        onChangeText={setNote}
        multiline
        editable={!isSubmitting}
      />
      <View style={styles.actions}>
        <Pressable 
          style={styles.cancelButton} 
          onPress={() => setIsExpanding(false)}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelText}>Hủy</Text>
        </Pressable>
        <Pressable 
          style={styles.submitButton} 
          onPress={() => onSubmit(note)}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.submitText}>Gửi yêu cầu</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  expandedContainer: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  label: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelText: {
    color: '#4b5563',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    minWidth: 120,
    alignItems: 'center',
  },
  submitText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  }
});
