import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  reason: string;
}

export function RefillBlockedNotice({ reason }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Hiện chưa thể yêu cầu cấp lại thuốc.</Text>
      <Text style={styles.reason}>{reason}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f3f4f6', // Light gray, non-destructive
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  reason: {
    fontSize: 14,
    color: '#4b5563',
  }
});
