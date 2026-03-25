import { useQuery } from "@tanstack/react-query";
import type { PersonalProfileVM } from "@thuocare/personal";

import { useMobileAuth } from "@/lib/auth/mobile-auth";
import { mobileSupabase } from "@/lib/supabase/mobile-client";

import { personalApi } from "./personal-api";
import { personalQueryKeys } from "./personal-keys";

export function usePersonalProfile() {
  const { bootstrapStatus, actorStatus, session, actor } = useMobileAuth();

  const patientId = actor?.kind === "patient" ? actor.patientId : null;

  const enabled =
    bootstrapStatus === "ready" &&
    session != null &&
    actorStatus === "ready" &&
    actor != null &&
    actor.kind === "patient";

  return useQuery<PersonalProfileVM | null>({
    queryKey: personalQueryKeys.profile(patientId),
    queryFn: () => personalApi.getPersonalProfile(mobileSupabase, actor!),
    enabled,
  });
}
