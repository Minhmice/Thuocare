import { useQuery } from "@tanstack/react-query";
import type { DailyTimelineVM } from "@thuocare/adherence";

import { useMobileAuth } from "@/lib/auth/mobile-auth";
import { mobileSupabase } from "@/lib/supabase/mobile-client";
import { adherenceApi } from "@/lib/adherence/adherence-api";
import { adherenceQueryKeys } from "@/lib/adherence/adherence-keys";

/**
 * Today's medication timeline for the signed-in patient.
 *
 * Reads actor identity from {@link useMobileAuth} — no need to pass
 * patientId or organizationId from the caller.
 *
 * @param todayIso - Calendar date to fetch (YYYY-MM-DD, local timezone).
 */
export function useTodayTimeline(todayIso: string) {
  const { bootstrapStatus, actorStatus, session, actor } = useMobileAuth();

  const patientId = actor?.kind === "patient" ? actor.patientId : null;

  const enabled =
    bootstrapStatus === "ready" &&
    session != null &&
    actorStatus === "ready" &&
    actor != null &&
    actor.kind === "patient" &&
    Boolean(todayIso);

  return useQuery<DailyTimelineVM>({
    queryKey: adherenceQueryKeys.timeline(patientId, todayIso),
    queryFn: () =>
      adherenceApi.getPatientTimeline(mobileSupabase, actor!, {
        patientId: patientId!,
        date: todayIso,
      }),
    enabled,
  });
}
