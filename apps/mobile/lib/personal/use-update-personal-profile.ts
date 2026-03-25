import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PersonalProfileVM, UpdatePersonalProfileSettingsInput } from "@thuocare/personal";

import { useMobileAuth } from "@/lib/auth/mobile-auth";
import { mobileSupabase } from "@/lib/supabase/mobile-client";

import { personalApi } from "./personal-api";
import { personalQueryKeys } from "./personal-keys";

export function useUpdatePersonalProfile() {
  const queryClient = useQueryClient();
  const { actor } = useMobileAuth();
  const patientId = actor?.kind === "patient" ? actor.patientId : null;

  return useMutation({
    mutationFn: async (updates: UpdatePersonalProfileSettingsInput): Promise<PersonalProfileVM> => {
      if (!actor || actor.kind !== "patient") throw new Error("Patient actor required");
      return personalApi.updatePersonalProfileSettings(mobileSupabase, actor, updates);
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: personalQueryKeys.profile(patientId),
      });
      queryClient.setQueryData(personalQueryKeys.profile(patientId), data);
    },
  });
}
