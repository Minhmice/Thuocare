import { useQuery } from "@tanstack/react-query";
import type { PersonalMedicationVM } from "@thuocare/personal";

import { useMobileAuth } from "@/lib/auth/mobile-auth";
import { mobileSupabase } from "@/lib/supabase/mobile-client";

import { personalApi } from "./personal-api";
import { personalQueryKeys } from "./personal-keys";

export function usePersonalMedicationDetail(medicationId: string | undefined) {
  const { bootstrapStatus, actorStatus, session, actor } = useMobileAuth();

  const patientId = actor?.kind === "patient" ? actor.patientId : null;

  const enabled =
    Boolean(medicationId) &&
    bootstrapStatus === "ready" &&
    session != null &&
    actorStatus === "ready" &&
    actor != null &&
    actor.kind === "patient";

  return useQuery<PersonalMedicationVM | null>({
    queryKey: [...personalQueryKeys.medications(patientId), "detail", medicationId] as const,
    queryFn: () =>
      personalApi.getPersonalMedicationByIdForPatient(mobileSupabase, actor!, medicationId!),
    enabled,
  });
}
