import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useAdherenceHistory } from '@/features/adherence-history/hooks/useAdherenceHistory';
import { HistoryDayGroup } from '@/features/adherence-history/components/HistoryDayGroup';
import { HistorySummaryStrip } from '@/features/adherence-history/components/HistorySummaryStrip';

export default function HistoryScreen() {
  const { data, isLoading, isError, refetch, isRefetching } = useAdherenceHistory(14);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading && !data) {
    return (
      <View style={styles.centerMode}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerMode}>
        <Text style={styles.errorText}>Đã xảy ra lỗi khi tải lịch sử.</Text>
        <Text onPress={() => refetch()} style={styles.retryButton}>Thử lại ngay</Text>
      </View>
    );
  }

  const daysWithData = data?.filter(day => day.doses && day.doses.length > 0) || [];

  if (daysWithData.length === 0) {
    return (
      <View style={styles.centerMode}>
        <Text style={styles.emptyTitle}>Chưa có lịch sử</Text>
        <Text style={styles.emptyDesc}>Không có dữ liệu uống thuốc trong thời gian gần đây.</Text>
        <Text onPress={() => refetch()} style={styles.retryButton}>Làm mới</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={daysWithData}
        keyExtractor={(item) => item.date}
        ListHeaderComponent={<HistorySummaryStrip days={daysWithData} />}
        renderItem={({ item }) => <HistoryDayGroup dayInfo={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing || isRefetching} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  listContent: {
    paddingBottom: 40,
  },
  centerMode: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: 'bold',
    padding: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
});
