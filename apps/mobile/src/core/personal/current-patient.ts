import { useMemo } from "react";

import { useMobileAuth } from "@/core/auth/mobile-auth";

export function useCurrentPatientId(): string | null {
  const { actor } = useMobileAuth();

  return useMemo(() => {
    if (!actor || actor.kind !== "patient") return null;
    return actor.patientId;
  }, [actor]);
}

