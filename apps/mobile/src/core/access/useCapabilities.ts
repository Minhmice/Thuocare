import { useMemo } from "react";

import { useMobileAuth } from "@/core/auth/mobile-auth";

import {
  resolveVisibleTabs,
  type AppCapabilities,
  type ExperienceMode,
} from "./resolve-visible-tabs";
import { resolveDefaultEntry } from "./resolve-default-entry";

function deriveCapabilities(actorKind: string | null): AppCapabilities {
  const experience: ExperienceMode =
    actorKind === "staff" ? "clinical" : actorKind === "patient" ? "personal" : "unknown";

  return {
    canAccessPeople: false,
    canManageOthers: false,
    canAccessClinicalWorkflows: actorKind === "staff",
    experience,
  };
}

export function useCapabilities() {
  const { actor, actorStatus, bootstrapStatus } = useMobileAuth();
  const actorKind = actor?.kind ?? null;
  const capabilities = useMemo(() => deriveCapabilities(actorKind), [actorKind]);

  const isLoading = bootstrapStatus !== "ready" || actorStatus === "loading";

  return {
    capabilities,
    visibleTabs: resolveVisibleTabs(capabilities),
    defaultEntry: resolveDefaultEntry(capabilities),
    isLoading,
  };
}
