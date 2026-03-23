import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'follow_up_required' | string;
  submittedAt?: string;
  reason?: string;
}

export function RefillStatusCard({ status, submittedAt, reason }: Props) {
  let title = "Trạng thái không xác định";
  let color = "#6b7280";
  let bgColor = "#f3f4f6";

  if (status === 'pending') {
    title = "Yêu cầu của bạn đang chờ duyệt";
    color = "#d97706";
    bgColor = "#fef3c7";
  } else if (status === 'approved') {
    title = "Đã được duyệt";
    color = "#059669";
    bgColor = "#d1fae5";
  } else if (status === 'rejected') {
    title = "Yêu cầu bị từ chối";
    color = "#dc2626";
    bgColor = "#fee2e2";
  } else if (status === 'cancelled') {
    title = "Đã hủy";
    color = "#4b5563";
    bgColor = "#f3f4f6";
  } else if (status === 'follow_up_required') {
    title = "Cần tái khám trước khi cấp thuốc";
    color = "#2563eb";
    bgColor = "#dbeafe";
  }

  const formattedDate = submittedAt ? new Date(submittedAt).toLocaleDateString('vi-VN') : null;

  return (
    <View style={[styles.card, { backgroundColor: bgColor, borderColor: color }]}>
      <Text style={[styles.title, { color }]}>{title}</Text>
      {formattedDate && <Text style={styles.meta}>Gửi ngày: {formattedDate}</Text>}
      {reason ? <Text style={styles.reason}>Lý do: {reason}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 8,
  },
  reason: {
    fontSize: 14,
    color: '#1f2937',
    marginTop: 4,
    fontStyle: 'italic',
  }
});
