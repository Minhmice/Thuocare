import { useQuery } from '@tanstack/react-query';
import { mobileSupabase } from '@/lib/supabase/mobile-client';
import { getPatientTimelineRange, DailyTimelineVM } from '@thuocare/adherence';
import { useActor } from '@/features/auth/useActor';

const getLocalIsoDate = (d: Date) => {
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
};

export function useAdherenceHistory(daysBack = 13) {
  const { actor } = useActor();
  
  const today = new Date();
  const past = new Date();
  // If daysBack is 13, today - 13 days = 14 days full window exactly.
  past.setDate(today.getDate() - daysBack);
  
  const startDate = getLocalIsoDate(past);
  const endDate = getLocalIsoDate(today);

  const patientId = actor?.kind === 'patient' ? actor.patientId : undefined;
  const organizationId = actor?.kind === 'patient' ? actor.organizationId : undefined;

  return useQuery<DailyTimelineVM[]>({
    queryKey: ['adherence', 'timeline-range', patientId, startDate, endDate],
    queryFn: async () => {
      if (!patientId || !organizationId) throw new Error("No patient actor");
      
      const actorCtx = {
        kind: 'patient',
        patientId,
        organizationId,
      } as any;

      const data = await getPatientTimelineRange(mobileSupabase, actorCtx, {
        patientId,
        startDate,
        endDate,
      });

      // DailyTimelineVM[] is sorted by day ascending by the backend usually
      // History is better viewed descending (newest first)
      return data.sort((a, b) => b.date.localeCompare(a.date));
    },
    enabled: !!patientId && !!organizationId,
  });
}
