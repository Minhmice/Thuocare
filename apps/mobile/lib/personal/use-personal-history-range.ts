import { useQuery } from "@tanstack/react-query";
import type { PersonalDailyTimelineVM } from "@thuocare/personal";

import { useMobileAuth } from "@/lib/auth/mobile-auth";
import { mobileSupabase } from "@/lib/supabase/mobile-client";
import { defaultHistoryRange } from "@/lib/adherence/history-window";

import { personalApi } from "./personal-api";
import { personalQueryKeys } from "./personal-keys";

/**
 * Personal-lane dose history over a rolling window (personal adherence only).
 */
export function usePersonalHistoryRange(daysInclusive = 14) {
  const { bootstrapStatus, actorStatus, session, actor, actorError } = useMobileAuth();

  const { startDate, endDate } = defaultHistoryRange(daysInclusive);
  const patientId = actor?.kind === "patient" ? actor.patientId : null;

  const enabled =
    bootstrapStatus === "ready" &&
    session != null &&
    actorStatus === "ready" &&
    actor != null &&
    actor.kind === "patient";

  return useQuery<PersonalDailyTimelineVM[]>({
    queryKey: personalQueryKeys.timelineRange(patientId, startDate, endDate),
    queryFn: async () => {
      const data = await personalApi.getPersonalTimelineRange(
        mobileSupabase,
        actor!,
        patientId!,
        startDate,
        endDate,
      );
      return data.sort((a, b) => b.date.localeCompare(a.date));
    },
    enabled,
    meta: { actorError },
  });
}
