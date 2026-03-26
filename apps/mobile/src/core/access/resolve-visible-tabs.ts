export type VisibleTabId = "home" | "meds" | "people" | "me";

export type ExperienceMode = "personal" | "family" | "clinical" | "unknown";

export interface AppCapabilities {
  canAccessPeople: boolean;
  canManageOthers: boolean;
  canAccessClinicalWorkflows: boolean;
  experience: ExperienceMode;
}

export function resolveVisibleTabs(capabilities: AppCapabilities): VisibleTabId[] {
  const baseTabs: VisibleTabId[] = ["home", "meds"];

  if (capabilities.canAccessPeople) {
    baseTabs.push("people");
  }

  baseTabs.push("me");

  return baseTabs;
}
