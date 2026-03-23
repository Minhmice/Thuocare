import { useQuery } from "@tanstack/react-query";
import type { RefillRequestVM } from "@thuocare/refill";

import { useMobileAuth } from "@/lib/auth/mobile-auth";
import { mobileSupabase } from "@/lib/supabase/mobile-client";

import { refillApi } from "./refill-api";
import { refillQueryKeys } from "./refill-keys";

function resolvePatientIdForQuery(
  actorPatientId: string | null,
  requestedPatientId?: string,
): { patientId: string | null; patientIdMismatch: boolean } {
  if (!actorPatientId) {
    return { patientId: null, patientIdMismatch: false };
  }
  if (requestedPatientId === undefined) {
    return { patientId: actorPatientId, patientIdMismatch: false };
  }
  if (requestedPatientId !== actorPatientId) {
    return { patientId: null, patientIdMismatch: true };
  }
  return { patientId: actorPatientId, patientIdMismatch: false };
}

/**
 * Lists refill requests for the signed-in patient via `getPatientRefillRequests`.
 * When `patientId` is passed, it must match the resolved patient actor or the query stays disabled.
 */
export function usePatientRefillRequests(patientId?: string) {
  const { bootstrapStatus, actorStatus, session, actor, actorError } = useMobileAuth();

  const authLoading =
    bootstrapStatus === "loading" || (session != null && actorStatus === "loading");
  const authReady =
    bootstrapStatus === "ready" && session != null && actorStatus === "ready" && actor != null;

  const patientActorRequired = authReady && actor.kind !== "patient";

  const actorPatientId = actor?.kind === "patient" ? actor.patientId : null;
  const { patientId: effectivePatientId, patientIdMismatch } = resolvePatientIdForQuery(
    actorPatientId,
    patientId,
  );

  const enabled =
    bootstrapStatus === "ready" &&
    session != null &&
    actorStatus === "ready" &&
    actor != null &&
    actor.kind === "patient" &&
    effectivePatientId != null &&
    !patientIdMismatch;

  const query = useQuery<RefillRequestVM[]>({
    queryKey: refillQueryKeys.requests(effectivePatientId ?? "__no_patient__"),
    queryFn: () => refillApi.getPatientRefillRequests(mobileSupabase, actor!, effectivePatientId!),
    enabled,
  });

  const listReady = enabled && !query.isPending && !query.isError;
  const isEmpty = listReady && (query.data?.length ?? 0) === 0;

  return {
    data: query.data,
    requests: query.data ?? [],
    isLoading: authLoading || query.isPending,
    isFetching: query.isFetching,
    isError: actorStatus === "error" || patientIdMismatch || query.isError,
    error:
      (patientIdMismatch
        ? new Error("patientId does not match signed-in patient")
        : actorError
          ? new Error(actorError)
          : query.error) ?? null,
    isEmpty,
    patientActorRequired,
    patientIdMismatch,
    refetch: query.refetch,
  };
}
