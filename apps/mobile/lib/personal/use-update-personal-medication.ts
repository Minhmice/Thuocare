import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdatePersonalMedicationInput } from "@thuocare/personal";

import { useMobileAuth } from "@/lib/auth/mobile-auth";
import { mobileSupabase } from "@/lib/supabase/mobile-client";

import { personalApi } from "./personal-api";
import { personalQueryKeys } from "./personal-keys";

export function useUpdatePersonalMedication(medicationId: string) {
  const queryClient = useQueryClient();
  const { actor } = useMobileAuth();

  const patientId = actor?.kind === "patient" ? actor.patientId : null;

  return useMutation({
    mutationFn: (updates: UpdatePersonalMedicationInput) => {
      if (!actor || actor.kind !== "patient") {
        throw new Error("Patient actor required");
      }
      return personalApi.updatePersonalMedicationById(mobileSupabase, actor, medicationId, updates);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: personalQueryKeys.medications(patientId),
      });
      void queryClient.invalidateQueries({
        queryKey: personalQueryKeys.medicationsAll(patientId),
      });
      void queryClient.invalidateQueries({
        queryKey: [...personalQueryKeys.medications(patientId), "detail", medicationId],
      });
      void queryClient.invalidateQueries({
        queryKey: personalQueryKeys.timelineByPatient(patientId),
      });
      void queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === "personal" &&
          q.queryKey[1] === "med-adherence",
      });
    },
  });
}
