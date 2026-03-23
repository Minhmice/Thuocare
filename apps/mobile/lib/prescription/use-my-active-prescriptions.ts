import { useQuery } from "@tanstack/react-query";
import type { PrescriptionPatientView } from "@thuocare/prescription";

import { useMobileAuth } from "@/lib/auth/mobile-auth";
import { mobileSupabase } from "@/lib/supabase/mobile-client";

import { prescriptionApi } from "./prescription-api";

/**
 * Patient-scoped active prescriptions via `getMyActivePrescriptions` (issued | active | paused).
 * Requires a resolved **patient** actor from {@link useMobileAuth}; staff sessions skip fetch and set `patientActorRequired`.
 */
export function useMyActivePrescriptions() {
  const { bootstrapStatus, actorStatus, session, actor, actorError } = useMobileAuth();

  const authLoading =
    bootstrapStatus === "loading" || (session != null && actorStatus === "loading");
  const authReady =
    bootstrapStatus === "ready" && session != null && actorStatus === "ready" && actor != null;

  const patientActorRequired = authReady && actor.kind !== "patient";

  const enabled =
    bootstrapStatus === "ready" &&
    session != null &&
    actorStatus === "ready" &&
    actor != null &&
    actor.kind === "patient";

  const query = useQuery<PrescriptionPatientView[]>({
    queryKey: ["prescriptions", "my-active", actor?.kind === "patient" ? actor.patientId : null],
    queryFn: () => prescriptionApi.getMyActivePrescriptions(mobileSupabase, actor!),
    enabled,
  });

  const listReady = enabled && !query.isPending && !query.isError;
  const isEmpty = listReady && (query.data?.length ?? 0) === 0;

  return {
    data: query.data,
    prescriptions: query.data ?? [],
    isLoading: authLoading || query.isPending,
    isFetching: query.isFetching,
    isError: actorStatus === "error" || query.isError,
    error: (actorError ? new Error(actorError) : query.error) ?? null,
    isEmpty,
    patientActorRequired,
    refetch: query.refetch,
  };
}
