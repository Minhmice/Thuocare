import { useQuery } from "@tanstack/react-query";

import { useMobileAuth } from "@/lib/auth/mobile-auth";
import { mobileSupabase } from "@/lib/supabase/mobile-client";
import type { CareLane } from "@thuocare/personal";

import { personalApi } from "./personal-api";
import { personalQueryKeys } from "./personal-keys";

/**
 * Detects which care lane the signed-in user belongs to.
 * Calls `current_three_lane_actor()` SQL function.
 *
 * Returns 'unknown' while loading or when actor is not patient.
 */
export function useLaneDetection() {
  const { bootstrapStatus, actorStatus, session, actor } = useMobileAuth();

  const enabled =
    bootstrapStatus === "ready" &&
    session != null &&
    actorStatus === "ready" &&
    actor != null;

  const query = useQuery<CareLane>({
    queryKey: personalQueryKeys.lane(),
    queryFn: () => personalApi.detectCurrentLane(mobileSupabase, actor!),
    enabled,
    // Lane is stable — refresh every 5 min
    staleTime: 5 * 60 * 1000,
  });

  return {
    lane: query.data ?? "unknown" as CareLane,
    isLoading: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
  };
}
