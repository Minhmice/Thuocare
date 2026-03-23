import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';

import { useMobileAuth } from '@/lib/auth/mobile-auth';
import { mobileSupabase } from '@/lib/supabase/mobile-client';
import { isRefillError } from '@thuocare/refill';
import type { RefillRequestVM } from '@thuocare/refill';

import { refillApi } from '@/lib/refill/refill-api';
import { refillQueryKeys } from '@/lib/refill/refill-keys';
import { usePatientRefillRequests } from '@/lib/refill/use-patient-refill-requests';

function invalidateRefillQueries(queryClient: ReturnType<typeof useQueryClient>, patientId: string) {
  void queryClient.invalidateQueries({ queryKey: refillQueryKeys.requests(patientId) });
  void queryClient.invalidateQueries({ queryKey: refillQueryKeys.nearDepletionByPatient(patientId) });
}

export function useRefillData(prescriptionId: string, treatmentEpisodeId?: string) {
  const queryClient = useQueryClient();
  const { actor } = useMobileAuth();

  const { requests, isLoading, refetch } = usePatientRefillRequests();

  const patientId = actor?.kind === 'patient' ? actor.patientId : undefined;

  const activeRequest = requests
    .filter((req: RefillRequestVM) => req.sourcePrescription?.prescriptionId === prescriptionId)
    .sort(
      (a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime(),
    )[0];

  const { mutateAsync: requestRefill, isPending: isSubmitting } = useMutation({
    mutationFn: async (note?: string) => {
      if (!actor || actor.kind !== 'patient' || !actor.patientId || !actor.organizationId) {
        throw new Error('No patient actor');
      }
      if (!treatmentEpisodeId) {
        throw new Error('treatmentEpisodeId is required to request a refill');
      }

      return refillApi.createRefillRequest(mobileSupabase, actor, {
        patientId: actor.patientId,
        organizationId: actor.organizationId,
        treatmentEpisodeId,
        sourcePrescriptionId: prescriptionId,
        scope: 'full_prescription',
        triggerSource: 'manual_request',
        patientComment: note ?? null,
      });
    },
    onSuccess: () => {
      if (patientId) {
        invalidateRefillQueries(queryClient, patientId);
      }
    },
    onError: (error: unknown) => {
      if (isRefillError(error) && error.code === 'duplicate_pending_request') {
        Alert.alert(
          'Không thể gửi',
          'Bạn đã có một yêu cầu đang chờ duyệt cho đơn thuốc này.',
        );
        return;
      }
      Alert.alert('Lỗi', 'Không thể gửi yêu cầu cấp lại thuốc. Vui lòng thử lại sau.');
    },
  });

  return {
    activeRequest,
    isLoading,
    isSubmitting,
    requestRefill,
    refetch,
  };
}
