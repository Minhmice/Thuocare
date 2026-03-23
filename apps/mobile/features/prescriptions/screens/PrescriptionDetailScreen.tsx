import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { usePrescriptionById } from '@/lib/prescription';
import { refillQueryKeys } from '@/lib/refill';

import { PrescriptionDetailItem } from '../components/PrescriptionDetailItem';
import { PrescriptionRefillSection } from '@/features/refill/components/PrescriptionRefillSection';

function safeSummary(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  return t.length > 0 ? t : null;
}

export function PrescriptionDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { prescriptionId: rawId } = useLocalSearchParams<{ prescriptionId: string | string[] }>();
  const prescriptionId = Array.isArray(rawId) ? rawId[0] : rawId;

  const { data, isLoading, isError, error, refetch, isFetching } = usePrescriptionById(
    prescriptionId?.trim() || undefined,
  );

  const handleRefresh = async () => {
    await Promise.all([
      refetch(),
      queryClient.invalidateQueries({ queryKey: refillQueryKeys.requestsPrefix }),
    ]);
  };

  if (!prescriptionId || prescriptionId.trim().length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Missing prescription</Text>
        <Text style={styles.errorBody}>This link is not valid.</Text>
        <Pressable onPress={() => router.back()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.hint}>Loading…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Could not load prescription</Text>
        <Text style={styles.errorBody}>{error instanceof Error ? error.message : 'Unknown error'}</Text>
        <Pressable onPress={() => void refetch()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (data === null || data === undefined) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Prescription not found</Text>
        <Text style={styles.errorBody}>
          It may have been removed or you may not have access. If this keeps happening, contact your care team.
        </Text>
        <Pressable onPress={() => router.back()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const { prescription, items } = data;
  const heading =
    safeSummary(prescription.patient_friendly_summary) ??
    `Prescription · ${safeSummary(prescription.status) ?? '—'}`;

  const metaParts = [
    prescription.status ? String(prescription.status) : null,
    prescription.issued_at ? `Issued ${prescription.issued_at}` : null,
    prescription.effective_from ? `Effective ${prescription.effective_from}` : null,
    prescription.effective_to ? `Until ${prescription.effective_to}` : null,
  ].filter(Boolean);

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={isFetching} onRefresh={() => void handleRefresh()} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>{heading}</Text>
        {metaParts.length > 0 ? (
          <Text style={styles.meta} numberOfLines={4}>
            {metaParts.join('\n')}
          </Text>
        ) : null}
        {prescription.prescription_kind ? (
          <Text style={styles.meta}>Kind: {String(prescription.prescription_kind)}</Text>
        ) : null}
      </View>

      <Text style={styles.sectionLabel}>Items</Text>
      {items.length === 0 ? (
        <Text style={styles.emptyItems}>No line items on this prescription.</Text>
      ) : (
        <View style={styles.items}>
          {items.map((item) => (
            <PrescriptionDetailItem key={item.item.id} item={item} />
          ))}
        </View>
      )}

      <PrescriptionRefillSection 
        prescriptionId={String(prescription.id)} 
        treatmentEpisodeId={prescription.treatment_episode_id ? String(prescription.treatment_episode_id) : undefined}
        prescriptionStatus={prescription.status ? String(prescription.status) : undefined} 
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    flex: 1,
    gap: 10,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  scroll: {
    gap: 16,
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  meta: {
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  emptyItems: {
    color: '#6b7280',
    fontSize: 14,
  },
  items: {
    gap: 12,
  },
  hint: {
    color: '#6b7280',
    fontSize: 14,
  },
  errorTitle: {
    color: '#b91c1c',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorBody: {
    color: '#4b5563',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
});
