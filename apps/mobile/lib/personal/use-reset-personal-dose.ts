import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PersonalDoseVM } from "@thuocare/personal";

import { useMobileAuth } from "@/lib/auth/mobile-auth";
import { mobileSupabase } from "@/lib/supabase/mobile-client";

import { personalApi } from "./personal-api";
import { personalQueryKeys } from "./personal-keys";

/**
 * Undo a mistaken taken/skipped mark or remove a PRN log (correction).
 */
export function useResetPersonalDose(todayIso: string) {
  const queryClient = useQueryClient();
  const { actor } = useMobileAuth();

  const patientId = actor?.kind === "patient" ? actor.patientId : null;

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: personalQueryKeys.timeline(patientId, todayIso),
    });
    void queryClient.invalidateQueries({
      queryKey: personalQueryKeys.timelineByPatient(patientId),
    });
    void queryClient.invalidateQueries({
      queryKey: personalQueryKeys.timelineRangeByPatient(patientId),
    });
    void queryClient.invalidateQueries({
      predicate: (q) =>
        Array.isArray(q.queryKey) &&
        q.queryKey[0] === "personal" &&
        q.queryKey[1] === "med-adherence",
    });
  };

  return useMutation({
    mutationFn: async (dose: PersonalDoseVM) => {
      if (!actor || actor.kind !== "patient") throw new Error("Patient actor required");
      await personalApi.resetPersonalDoseLog(mobileSupabase, actor, {
        patientId: actor.patientId,
        personalMedicationId: dose.personalMedicationId,
        scheduledTime: dose.scheduledTime,
        prnFlag: dose.prnFlag,
        logId: dose.logId,
      });
    },
    onSuccess: invalidate,
  });
}
