import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AddPersonalMedicationInput } from "@thuocare/personal";

import { useMobileAuth } from "@/lib/auth/mobile-auth";
import { mobileSupabase } from "@/lib/supabase/mobile-client";

import { personalApi } from "./personal-api";
import { personalQueryKeys } from "./personal-keys";

type AddInput = Omit<AddPersonalMedicationInput, "patientId" | "personalProfileId">;

/**
 * Adds a new personal medication. patientId and personalProfileId
 * are resolved from the actor context automatically.
 */
export function useAddPersonalMedication() {
  const queryClient = useQueryClient();
  const { actor } = useMobileAuth();

  const patientId = actor?.kind === "patient" ? actor.patientId : null;

  return useMutation({
    mutationFn: (input: AddInput) => {
      if (!actor || actor.kind !== "patient") {
        throw new Error("Patient actor required");
      }
      return personalApi.addPersonalMedication(mobileSupabase, actor, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: personalQueryKeys.medications(patientId),
      });
      void queryClient.invalidateQueries({
        queryKey: personalQueryKeys.medicationsAll(patientId),
      });
      void queryClient.invalidateQueries({
        queryKey: personalQueryKeys.timelineByPatient(patientId),
      });
    },
  });
}
