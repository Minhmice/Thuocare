import { useQuery } from "@tanstack/react-query";
import type { AdherenceSummaryVM } from "@thuocare/adherence";

import { useMobileAuth } from "@/lib/auth/mobile-auth";
import { mobileSupabase } from "@/lib/supabase/mobile-client";

import { adherenceApi } from "./adherence-api";
import { defaultHistoryRange, normalizeHistoryRange } from "./history-window";

export type UseAdherenceSummaryRangeOptions = {
  daysInclusive?: number;
  startDate?: string;
  endDate?: string;
};

/**
 * Aggregated adherence for a date window via {@link getAdherenceSummary}.
 * Excludes unresolved `scheduled` doses from counts (package behavior).
 */
export function useAdherenceSummaryRange(options: UseAdherenceSummaryRangeOptions = {}) {
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

  const query = useQuery<AdherenceSummaryVM>({
    queryKey: ["adherence", "summary-range", patientId, startDate, endDate],
    queryFn: () =>
      adherenceApi.getAdherenceSummary(mobileSupabase, actor!, patientId!, startDate, endDate),
    enabled,
  });

  return {
    startDate,
    endDate,
    summary: query.data ?? null,
    isLoading: authLoading || query.isPending,
    isFetching: query.isFetching,
    isError: actorStatus === "error" || query.isError,
    error: (actorError ? new Error(actorError) : query.error) ?? null,
    patientActorRequired:
      bootstrapStatus === "ready" &&
      session != null &&
      actorStatus === "ready" &&
      actor != null &&
      actor.kind !== "patient",
    refetch: query.refetch,
  };
}
