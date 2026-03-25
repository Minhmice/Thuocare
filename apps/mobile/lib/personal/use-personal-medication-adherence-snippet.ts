import { useQuery } from "@tanstack/react-query";
import type { PersonalMedicationAdherenceSnippetVM } from "@thuocare/personal";

import { addCalendarDays, localIsoDate } from "@/lib/adherence/history-window";
import { useMobileAuth } from "@/lib/auth/mobile-auth";
import { mobileSupabase } from "@/lib/supabase/mobile-client";

import { personalApi } from "./personal-api";
import { personalQueryKeys } from "./personal-keys";

const SNIPPET_DAYS = 14;

/**
 * Recent adherence stats + log lines for one medication (medication detail).
 */
export function usePersonalMedicationAdherenceSnippet(medicationId: string | undefined) {
  const { bootstrapStatus, actorStatus, session, actor } = useMobileAuth();

  const patientId = actor?.kind === "patient" ? actor.patientId : null;
  const endDate = localIsoDate();
  const startDate = addCalendarDays(endDate, -(SNIPPET_DAYS - 1));

  const enabled =
    Boolean(medicationId) &&
    bootstrapStatus === "ready" &&
    session != null &&
    actorStatus === "ready" &&
    actor != null &&
    actor.kind === "patient";

  return useQuery<PersonalMedicationAdherenceSnippetVM>({
    queryKey: personalQueryKeys.medicationAdherenceSnippet(patientId, medicationId, startDate, endDate),
    queryFn: () => {
      if (!medicationId || actor?.kind !== "patient" || patientId == null) {
        throw new Error("usePersonalMedicationAdherenceSnippet: expected patient actor and medication id");
      }
      return personalApi.getPersonalMedicationAdherenceSnippet(mobileSupabase, actor, {
        patientId,
        personalMedicationId: medicationId,
        startDate,
        endDate,
      });
    },
    enabled,
  });
}
