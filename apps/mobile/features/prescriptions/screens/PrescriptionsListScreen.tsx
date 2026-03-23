import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useMobileAuth } from '@/lib/auth/mobile-auth';
import { useMyActivePrescriptions } from '@/lib/prescription';
import { isPatientActor } from '@thuocare/auth';
import type { PrescriptionPatientView } from '@thuocare/prescription';

import { PrescriptionListRowView } from '../components/PrescriptionListRow';

export function PrescriptionsListScreen() {
  const router = useRouter();
  const { actor, actorError, actorStatus, refreshActor } = useMobileAuth();

  const patientId = actor !== null && isPatientActor(actor) ? actor.patientId : undefined;

  const { prescriptions, isLoading, isError, error, refetch, isFetching } = useMyActivePrescriptions();

  if (actorStatus === 'loading' || (actor === null && actorStatus === 'idle')) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.hint}>Loading account…</Text>
      </View>
    );
  }

  if (actorStatus === 'error' || actor === null || !isPatientActor(actor) || !patientId) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Cannot show prescriptions</Text>
        <Text style={styles.errorBody}>
          {actorStatus === 'error'
            ? actorError ?? 'Account could not be resolved.'
            : 'Sign in as a linked patient to view prescriptions.'}
        </Text>
        {actorStatus === 'error' ? (
          <Pressable onPress={() => void refreshActor()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.hint}>Loading prescriptions…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Could not load prescriptions</Text>
        <Text style={styles.errorBody}>{error instanceof Error ? error.message : 'Unknown error'}</Text>
        <Pressable onPress={() => void refetch()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const list = prescriptions ?? [];

  if (list.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No prescriptions yet</Text>
        <Text style={styles.emptyBody}>When your care team adds a prescription, it will appear here.</Text>
      </View>
    );
  }

  const onRowPress = (row: PrescriptionPatientView) => {
    router.push(`/(tabs)/prescriptions/${row.prescriptionId}`);
  };

  return (
    <FlatList
      data={list}
      keyExtractor={(row) => row.prescriptionId}
      refreshing={isFetching}
      onRefresh={() => void refetch()}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <PrescriptionListRowView item={item} onPress={() => onRowPress(item)} />
      )}
    />
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
  listContent: {
    paddingBottom: 24,
    paddingTop: 8,
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
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyBody: {
    color: '#6b7280',
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
