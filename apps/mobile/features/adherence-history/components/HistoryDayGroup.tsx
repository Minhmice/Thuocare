import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DailyTimelineVM } from '@thuocare/adherence';
import { HistoryEventRow } from './HistoryEventRow';

export function safeFormatDate(isoDate: string) {
  if (!isoDate) return 'Ngày không xác định';
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return 'Ngày không xác định';
    return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (e) {
    return 'Ngày không xác định';
  }
}

interface Props {
  dayInfo: DailyTimelineVM;
}

export function HistoryDayGroup({ dayInfo }: Props) {
  if (!dayInfo.doses || dayInfo.doses.length === 0) return null;

  const dateLabel = safeFormatDate(dayInfo.date);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.dateTitle}>{dateLabel}</Text>
        <Text style={styles.statsText}>
          {dayInfo.takenCount} uống · {dayInfo.missedCount} quên
        </Text>
      </View>
      <View style={styles.events}>
        {dayInfo.doses.map((dose, idx) => (
          <HistoryEventRow 
            key={dose.logId || `schedule-${dose.prescriptionItemId}-${dose.scheduledTime}-${idx}`} 
            dose={dose} 
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  dateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    textTransform: 'capitalize',
  },
  statsText: {
    fontSize: 12,
    color: '#6b7280',
  },
  events: {
    // Intentionally no left border for a cleaner layout on mobile
  },
});
