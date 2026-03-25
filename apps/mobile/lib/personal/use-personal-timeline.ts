import { useQuery } from "@tanstack/react-query";
import type { PersonalDailyTimelineVM } from "@thuocare/personal";

import { useMobileAuth } from "@/lib/auth/mobile-auth";
import { mobileSupabase } from "@/lib/supabase/mobile-client";
import { localIsoDate } from "@/lib/adherence/history-window";

import { personalApi } from "./personal-api";
import { personalQueryKeys } from "./personal-keys";

/**
 * Today's personal medication timeline for the signed-in patient.
 */
export function usePersonalTimeline(todayIso: string = localIsoDate()) {
  const { bootstrapStatus, actorStatus, session, actor } = useMobileAuth();

  const patientId = actor?.kind === "patient" ? actor.patientId : null;

  const enabled =
    bootstrapStatus === "ready" &&
    session != null &&
    actorStatus === "ready" &&
    actor != null &&
    actor.kind === "patient" &&
    Boolean(todayIso);

  return useQuery<PersonalDailyTimelineVM>({
    queryKey: personalQueryKeys.timeline(patientId, todayIso),
    queryFn: () =>
      personalApi.getPersonalTimeline(mobileSupabase, actor!, {
        patientId: patientId!,
        date: todayIso,
      }),
    enabled,
  });
}
