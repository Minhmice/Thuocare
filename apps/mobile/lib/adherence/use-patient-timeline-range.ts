import { useQuery } from "@tanstack/react-query";
import type { DailyTimelineVM } from "@thuocare/adherence";

import { useMobileAuth } from "@/lib/auth/mobile-auth";
import { mobileSupabase } from "@/lib/supabase/mobile-client";

import { adherenceApi } from "./adherence-api";
import { adherenceQueryKeys } from "./adherence-keys";
import { defaultHistoryRange, normalizeHistoryRange } from "./history-window";

export type UsePatientTimelineRangeOptions = {
  /** Inclusive day count ending today (local). Default 14. */
  daysInclusive?: number;
  /** Override window (local YYYY-MM-DD). If both set, normalized so start <= end. */
  startDate?: string;
  endDate?: string;
};

/**
 * Patient adherence history as {@link getPatientTimelineRange} — one {@link DailyTimelineVM} per day,
 * ascending by date, empty days included, doses sorted by `scheduledTime` per backend guarantee.
 */
export function usePatientTimelineRange(options: UsePatientTimelineRangeOptions = {}) {
  const { daysInclusive = 14, startDate: startOverride, endDate: endOverride } = options;
  const { bootstrapStatus, actorStatus, session, actor, actorError } = useMobileAuth();

  const window =
    startOverride !== undefined && endOverride !== undefined
      ? normalizeHistoryRange(startOverride, endOverride)
      : defaultHistoryRange(daysInclusive);

  const { startDate, endDate } = window;

  const authLoading =
    bootstrapStatus === "loading" || (session != null && actorStatus === "loading");
  const enabled =
    bootstrapStatus === "ready" &&
    session != null &&
    actorStatus === "ready" &&
    actor != null &&
    actor.kind === "patient" &&
    Boolean(actor.patientId) &&
    Boolean(startDate) &&
    Boolean(endDate);

  const patientId = actor?.kind === "patient" ? actor.patientId : null;

  const query = useQuery<DailyTimelineVM[]>({
    queryKey: adherenceQueryKeys.timelineRange(patientId, startDate, endDate),
    queryFn: () =>
      adherenceApi.getPatientTimelineRange(mobileSupabase, actor!, {
        patientId: patientId!,
        startDate,
        endDate,
      }),
    enabled,
  });

  const days = query.data ?? [];

  return {
    startDate,
    endDate,
    days,
    isLoading: authLoading || query.isPending,
    isFetching: query.isFetching,
    isError: actorStatus === "error" || query.isError,
    error: (actorError ? new Error(actorError) : query.error) ?? null,
    isEmpty: enabled && !query.isPending && !query.isError && days.length > 0 && days.every((d) => d.doses.length === 0),
    patientActorRequired:
      bootstrapStatus === "ready" &&
      session != null &&
      actorStatus === "ready" &&
      actor != null &&
      actor.kind !== "patient",
    refetch: query.refetch,
  };
}
