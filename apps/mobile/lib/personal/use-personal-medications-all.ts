import { useQuery } from "@tanstack/react-query";
import type { PersonalMedicationVM } from "@thuocare/personal";

import { useMobileAuth } from "@/lib/auth/mobile-auth";
import { mobileSupabase } from "@/lib/supabase/mobile-client";

import { personalApi } from "./personal-api";
import { personalQueryKeys } from "./personal-keys";

/** Every personal medication status — for Thuốc tab grouping. */
export function usePersonalMedicationsAll() {
  const { bootstrapStatus, actorStatus, session, actor, actorError } = useMobileAuth();

  const patientId = actor?.kind === "patient" ? actor.patientId : null;

  const enabled =
    bootstrapStatus === "ready" &&
    session != null &&
    actorStatus === "ready" &&
    actor != null &&
    actor.kind === "patient";

  const query = useQuery<PersonalMedicationVM[]>({
    queryKey: personalQueryKeys.medicationsAll(patientId),
    queryFn: () => personalApi.getPersonalMedicationsAllForPatient(mobileSupabase, actor!),
    enabled,
  });

  return {
    medications: query.data ?? [],
    isLoading: query.isPending,
    isFetching: query.isFetching,
    isError: actorStatus === "error" || query.isError,
    error: (actorError ? new Error(actorError) : query.error) ?? null,
    refetch: query.refetch,
  };
}
