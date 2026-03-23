import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TimelineDoseVM } from '@thuocare/adherence';

export function safeFormatTime(isoDateTime: string | null) {
  if (!isoDateTime) return 'Chưa rõ';
  try {
    const d = new Date(isoDateTime);
    if (isNaN(d.getTime())) return 'Chưa rõ';
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return 'Chưa rõ';
  }
}

interface Props {
  dose: TimelineDoseVM;
}

export function HistoryEventRow({ dose }: Props) {
  const isTaken = dose.status === 'taken';
  const isMissed = dose.status === 'missed';
  const isSkipped = dose.status === 'skipped';

  let statusColor = '#9ca3af'; 
  let statusText = 'Lịch uống';
  if (isTaken) { statusColor = '#10b981'; statusText = 'Đã uống'; }
  else if (isMissed) { statusColor = '#ef4444'; statusText = 'Bỏ lỡ'; }
  else if (isSkipped) { statusColor = '#f59e0b'; statusText = 'Bỏ qua'; }

  const timeLabel = safeFormatTime(dose.actualTakenTime || dose.scheduledTime);
  const instruction = dose.patientInstruction;

  return (
    <View style={styles.container}>
      <View style={styles.timeLine}>
        <Text style={styles.timeText} numberOfLines={1}>{timeLabel}</Text>
        <View style={[styles.dot, { backgroundColor: statusColor }]} />
      </View>
      <View style={styles.card}>
        <Text style={styles.title} numberOfLines={2}>{dose.medicationName || 'Chưa có tên thuốc'}</Text>
        <Text style={styles.doseInfo}>
          {(dose.doseAmount && dose.doseUnit) ? `${dose.doseAmount} ${dose.doseUnit}` : 'Chưa có liều lượng'}
        </Text>
        {!!instruction && <Text style={styles.instruction} numberOfLines={2}>{instruction}</Text>}
        <Text style={[styles.statusTag, { color: statusColor }]}>{statusText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  timeLine: {
    width: 60,
    alignItems: 'center',
    marginRight: 12,
  },
  timeText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  doseInfo: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  instruction: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  statusTag: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
});
