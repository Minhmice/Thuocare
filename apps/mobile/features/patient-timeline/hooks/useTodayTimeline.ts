import { useQuery } from '@tanstack/react-query';
import { mobileSupabase } from '@/lib/supabase/mobile-client';
import { getPatientTimeline, DailyTimelineVM } from '@thuocare/adherence';

export function useTodayTimeline(patientId: string, organizationId: string, todayIso: string) {
  return useQuery<DailyTimelineVM>({
    queryKey: ['timeline', patientId, todayIso],
    queryFn: async () => {
      // Create a dummy context for the shared package
      const actorCtx = {
        kind: 'patient',
        patientId,
        organizationId,
      } as any;

      const data = await getPatientTimeline(mobileSupabase, actorCtx, {
        patientId,
        date: todayIso,
      });
      return data;
    },
    enabled: !!patientId && !!todayIso,
  });
}
