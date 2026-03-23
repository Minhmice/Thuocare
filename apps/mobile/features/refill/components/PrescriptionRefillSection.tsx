import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRefillData } from '../hooks/useRefillData';
import { RefillStatusCard } from './RefillStatusCard';
import { RefillBlockedNotice } from './RefillBlockedNotice';
import { RefillRequestAction } from './RefillRequestAction';
import { RefillSuccessNotice } from './RefillSuccessNotice';

interface Props {
  prescriptionId: string;
  treatmentEpisodeId?: string;
  prescriptionStatus?: string | null;
}

export function PrescriptionRefillSection({ prescriptionId, treatmentEpisodeId, prescriptionStatus }: Props) {
  const { activeRequest, isLoading, isSubmitting, requestRefill } = useRefillData(prescriptionId, treatmentEpisodeId);
  const [success, setSuccess] = useState(false);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }

  if (success) {
    return (
      <View style={styles.container}>
        <RefillSuccessNotice />
      </View>
    );
  }

  if (activeRequest) {
    const status = activeRequest.status;
    return (
      <View style={styles.container}>
        <RefillStatusCard
          status={status}
          submittedAt={activeRequest.submittedAt ?? undefined}
          reason={
            activeRequest.decisionNote ??
            activeRequest.patientComment ??
            undefined
          }
        />
      </View>
    );
  }

  if (prescriptionStatus && prescriptionStatus !== 'active') {
    return (
      <View style={styles.container}>
        <RefillBlockedNotice reason="Đơn thuốc này không còn hiệu lực." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RefillRequestAction 
        isSubmitting={isSubmitting}
        onSubmit={async (note) => {
          try {
            await requestRefill(note);
            setSuccess(true);
          } catch (e) {
            // Toast/Alert handled gracefully in the hook
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 16,
  }
});
