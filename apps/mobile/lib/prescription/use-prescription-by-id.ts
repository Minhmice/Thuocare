import { useQuery } from "@tanstack/react-query";

import { useMobileAuth } from "@/lib/auth/mobile-auth";
import { mobileSupabase } from "@/lib/supabase/mobile-client";

import { prescriptionApi } from "./prescription-api";

/** Resolved prescription header+items row bundle from the package read path (null = not found). */
export type PrescriptionDetailData = NonNullable<
  Awaited<ReturnType<typeof prescriptionApi.getPrescriptionById>>
>;

/**
 * Full prescription detail via `getPrescriptionById`.
 *
 * Uses a resolved mobile actor context and lets the service layer enforce authorization.
 */
export function usePrescriptionById(prescriptionId: string | undefined) {
  const { bootstrapStatus, actorStatus, session, actor, actorError } = useMobileAuth();

  const authLoading =
    bootstrapStatus === "loading" || (session != null && actorStatus === "loading");
  const authReady =
    bootstrapStatus === "ready" && session != null && actorStatus === "ready" && actor != null;

  const hasId = Boolean(prescriptionId);

  const enabled =
    bootstrapStatus === "ready" &&
    session != null &&
    actorStatus === "ready" &&
    actor != null &&
    hasId;

  const query = useQuery<PrescriptionDetailData | null>({
    queryKey: ["prescriptions", "detail", prescriptionId],
    queryFn: () => prescriptionApi.getPrescriptionById(mobileSupabase, actor!, prescriptionId!),
    enabled,
  });

  const detailReady = enabled && !query.isPending && !query.isError;
  const isEmpty = detailReady && query.data === null;

  return {
    data: query.data,
    isLoading: authLoading || query.isPending,
    isFetching: query.isFetching,
    isError: actorStatus === "error" || query.isError,
    error: (actorError ? new Error(actorError) : query.error) ?? null,
    isEmpty,
    refetch: query.refetch,
  };
}
