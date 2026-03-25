import { useQuery } from "@tanstack/react-query";
import type { DailyTimelineVM } from "@thuocare/adherence";

import { useMobileAuth } from "@/lib/auth/mobile-auth";
import { mobileSupabase } from "@/lib/supabase/mobile-client";
import { adherenceApi } from "@/lib/adherence/adherence-api";
import { adherenceQueryKeys } from "@/lib/adherence/adherence-keys";
import { defaultHistoryRange } from "@/lib/adherence/history-window";

/**
 * Adherence history for the signed-in patient over a rolling N-day window.
 *
 * Actor identity is resolved from {@link useMobileAuth} — no need to pass
 * patientId or organizationId from the caller.
 *
 * @param daysInclusive - Total calendar days to include, ending today (default 14).
 *   e.g. daysInclusive=14 → today + the 13 prior days = 14 days total.
 *
 * Results are sorted descending (newest day first) for history display.
 *
 * The queryKey is shared with {@link usePatientTimelineRange} so mutations that
 * invalidate via `adherenceQueryKeys.timelineRangeByPatient` will refresh this
 * hook automatically.
 */
export function useAdherenceHistory(daysInclusive = 14) {
  const { bootstrapStatus, actorStatus, session, actor, actorError } = useMobileAuth();

  const { startDate, endDate } = defaultHistoryRange(daysInclusive);
  const patientId = actor?.kind === "patient" ? actor.patientId : null;

  const enabled =
    bootstrapStatus === "ready" &&
    session != null &&
    actorStatus === "ready" &&
    actor != null &&
    actor.kind === "patient";

  return useQuery<DailyTimelineVM[]>({
    queryKey: adherenceQueryKeys.timelineRange(patientId, startDate, endDate),
    queryFn: async () => {
      const data = await adherenceApi.getPatientTimelineRange(mobileSupabase, actor!, {
        patientId: patientId!,
        startDate,
        endDate,
      });
      // Sort descending so the history screen shows newest day first
      return data.sort((a, b) => b.date.localeCompare(a.date));
    },
    enabled,
    meta: { actorError },
  });
}
