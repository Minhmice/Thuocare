import { useQuery } from "@tanstack/react-query";
import type { DetectNearDepletionInput, NearDepletionItemVM } from "@thuocare/refill";

import { useMobileAuth } from "@/lib/auth/mobile-auth";
import { mobileSupabase } from "@/lib/supabase/mobile-client";

import { refillApi } from "./refill-api";
import { refillQueryKeys } from "./refill-keys";

const DEFAULT_THRESHOLD_DAYS = 3;

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

export interface UseNearDepletionOptions {
  /** Defaults to 3 (matches refill service default). */
  thresholdDays?: number;
  /** If set, must equal the signed-in patient id. */
  patientId?: string;
}

/**
 * Near-depletion items via `detectNearDepletion`. Requires a resolved patient actor.
 */
export function useNearDepletion(options?: UseNearDepletionOptions) {
  const thresholdDays = options?.thresholdDays ?? DEFAULT_THRESHOLD_DAYS;
  const requestedPatientId = options?.patientId;

  const { bootstrapStatus, actorStatus, session, actor, actorError } = useMobileAuth();

  const authLoading =
    bootstrapStatus === "loading" || (session != null && actorStatus === "loading");
  const authReady =
    bootstrapStatus === "ready" && session != null && actorStatus === "ready" && actor != null;

  const patientActorRequired = authReady && actor.kind !== "patient";

  const actorPatientId = actor?.kind === "patient" ? actor.patientId : null;
  const { patientId: effectivePatientId, patientIdMismatch } = resolvePatientIdForQuery(
    actorPatientId,
    requestedPatientId,
  );

  const enabled =
    bootstrapStatus === "ready" &&
    session != null &&
    actorStatus === "ready" &&
    actor != null &&
    actor.kind === "patient" &&
    actor.organizationId != null &&
    effectivePatientId != null &&
    !patientIdMismatch;

  const input: DetectNearDepletionInput = {
    patientId: effectivePatientId ?? "",
    thresholdDays,
  };

  const query = useQuery<NearDepletionItemVM[]>({
    queryKey: refillQueryKeys.nearDepletion(
      effectivePatientId ?? "__no_patient__",
      thresholdDays,
    ),
    queryFn: () => refillApi.detectNearDepletion(mobileSupabase, actor!, input),
    enabled: enabled && effectivePatientId != null,
  });

  const listReady = enabled && !query.isPending && !query.isError;
  const isEmpty = listReady && (query.data?.length ?? 0) === 0;

  return {
    data: query.data,
    items: query.data ?? [],
    thresholdDays,
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
