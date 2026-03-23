import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useActor } from '@/features/auth/useActor';
import { useTodayTimeline } from '@/features/patient-timeline/hooks/useTodayTimeline';
import { useMarkDoseTaken } from '@/features/patient-timeline/hooks/useMarkDoseTaken';
import { useMarkDoseSkipped } from '@/features/patient-timeline/hooks/useMarkDoseSkipped';
import { TimelineList } from '@/features/patient-timeline/components/TimelineList';

// Helper: Ensure local YYYY-MM-DD
const getLocalIsoDate = () => {
  const tzOffset = (new Date()).getTimezoneOffset() * 60000;
  return (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];
};

export default function TodayScreen() {
  const { actor } = useActor();
  
  if (!actor || actor.kind !== 'patient' || !actor.patientId || !actor.organizationId) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Lỗi định danh tài khoản. Vui lòng đăng nhập lại.</Text>
      </View>
    );
  }

  const todayIso = getLocalIsoDate();

  // Queries & Mutations
  const { data, isLoading, isError, refetch, isRefetching } = useTodayTimeline(actor.patientId, actor.organizationId, todayIso);
  const { mutate: takeDose, isPending: isTaking } = useMarkDoseTaken(actor.patientId, todayIso);
  const { mutate: skipDose, isPending: isSkipping } = useMarkDoseSkipped(actor.patientId, todayIso);

  const isPendingMutations = isTaking || isSkipping;

  const handleTake = (dose: any) => {
    takeDose({ 
      prescriptionItemId: dose.prescriptionItemId, 
      scheduledTime: dose.scheduledTime,
      organizationId: actor.organizationId!
    });
  };

  const handleSkip = (dose: any) => {
    skipDose({ 
      prescriptionItemId: dose.prescriptionItemId, 
      scheduledTime: dose.scheduledTime,
      organizationId: actor.organizationId!
    });
  };

  if (isLoading) {
    return <ActivityIndicator size="large" color="#2563eb" style={styles.center} />;
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Không thể tải lịch uống thuốc.</Text>
        <Text onPress={() => refetch()} style={styles.retryText}>Chạm để thử lại</Text>
      </View>
    );
  }

  // Find next dose by finding the first scheduled dose
  const nextDose = data?.doses.find(d => d.status === 'scheduled') || null;

  return (
    <View style={styles.container}>
      {/* 
        We pass data?.doses from the DailyTimelineVM as expected by TimelineList.
        If TimelineList expects 'items', you might need to adjust this depending 
        on its internal implementation, but typically mapping TimelineDoseVM works.
      */}
      <TimelineList 
        doses={data?.doses || []} 
        nextDose={nextDose}
        isRefetching={isRefetching}
        onRefresh={refetch}
        onTake={handleTake}
        onSkip={handleSkip}
        isPendingMutations={isPendingMutations}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: '#dc2626', textAlign: 'center', fontSize: 16 },
  retryText: { color: '#2563eb', marginTop: 12, fontSize: 16, fontWeight: 'bold' }
});
