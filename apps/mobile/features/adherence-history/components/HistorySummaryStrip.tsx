import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DailyTimelineVM } from '@thuocare/adherence';

interface Props {
  days: DailyTimelineVM[];
}

export function HistorySummaryStrip({ days }: Props) {
  const totals = days.reduce(
    (acc, day) => {
      acc.taken += day.takenCount;
      acc.missed += day.missedCount;
      acc.skipped += day.skippedCount;
      return acc;
    },
    { taken: 0, missed: 0, skipped: 0 }
  );

  const totalResolved = totals.taken + totals.missed + totals.skipped;
  const adherenceRate = totalResolved > 0 ? Math.round((totals.taken / totalResolved) * 100) : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tổng quan lịch sử</Text>
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: '#10b981' }]}>{totals.taken}</Text>
          <Text style={styles.statLabel}>Đã uống</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>{totals.skipped}</Text>
          <Text style={styles.statLabel}>Bỏ qua</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>{totals.missed}</Text>
          <Text style={styles.statLabel}>Quên</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: '#3b82f6' }]}>{adherenceRate}%</Text>
          <Text style={styles.statLabel}>Tỷ lệ</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
});
