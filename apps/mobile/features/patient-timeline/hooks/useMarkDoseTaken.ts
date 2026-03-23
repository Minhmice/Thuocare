import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mobileSupabase } from '@/lib/supabase/mobile-client';
import { markDoseTaken } from '@thuocare/adherence';

export function useMarkDoseTaken(patientId: string, todayIso: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      prescriptionItemId,
      scheduledTime,
      organizationId,
    }: {
      prescriptionItemId: string;
      scheduledTime: string;
      organizationId: string;
    }) => {
      const actorCtx = {
        kind: 'patient',
        patientId,
        organizationId,
      } as any;

      return markDoseTaken(mobileSupabase, actorCtx, {
        patientId,
        organizationId,
        prescriptionItemId,
        scheduledTime,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', patientId, todayIso] });
      queryClient.invalidateQueries({ queryKey: ['adherence', 'timeline-range', patientId] });
      queryClient.invalidateQueries({ queryKey: ['adherence', 'summary-range', patientId] });
    },
  });
}
