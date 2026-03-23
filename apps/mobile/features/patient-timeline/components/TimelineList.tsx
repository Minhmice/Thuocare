import React from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

type TimelineDoseLike = {
  prescriptionItemId: string;
  scheduledTime: string;
  status: string;
  medicationName?: string | null;
  instructionText?: string | null;
};

interface TimelineListProps {
  doses: TimelineDoseLike[];
  nextDose: TimelineDoseLike | null;
  isRefetching: boolean;
  onRefresh: () => void;
  onTake: (dose: TimelineDoseLike) => void;
  onSkip: (dose: TimelineDoseLike) => void;
  isPendingMutations: boolean;
}

export function TimelineList({
  doses,
  nextDose,
  isRefetching,
  onRefresh,
  onTake,
  onSkip,
  isPendingMutations,
}: TimelineListProps) {
  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={doses}
      keyExtractor={(item) => `${item.prescriptionItemId}:${item.scheduledTime}`}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Next dose</Text>
          <Text style={styles.title}>
            {nextDose ? nextDose.medicationName ?? 'Medication' : 'No upcoming dose'}
          </Text>
          {nextDose ? <Text style={styles.meta}>{nextDose.scheduledTime}</Text> : null}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.card}>
          <Text style={styles.title}>No doses today</Text>
          <Text style={styles.meta}>Pull to refresh to check again.</Text>
        </View>
      }
      renderItem={({ item }) => {
        const actionable = item.status === 'scheduled';
        return (
          <View style={styles.card}>
            <Text style={styles.title}>{item.medicationName ?? 'Medication'}</Text>
            <Text style={styles.meta}>{item.scheduledTime}</Text>
            <Text style={styles.meta}>Status: {item.status}</Text>
            {item.instructionText ? <Text style={styles.meta}>{item.instructionText}</Text> : null}
            {actionable ? (
              <View style={styles.actions}>
                <Pressable
                  disabled={isPendingMutations}
                  onPress={() => onTake(item)}
                  style={[styles.primaryBtn, isPendingMutations ? styles.disabled : null]}
                >
                  <Text style={styles.primaryBtnText}>Take</Text>
                </Pressable>
                <Pressable
                  disabled={isPendingMutations}
                  onPress={() => onSkip(item)}
                  style={[styles.secondaryBtn, isPendingMutations ? styles.disabled : null]}
                >
                  <Text style={styles.secondaryBtnText}>Skip</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  sectionTitle: {
    color: '#6b7280',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    color: '#4b5563',
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  primaryBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  secondaryBtn: {
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryBtnText: {
    color: '#111827',
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
});
