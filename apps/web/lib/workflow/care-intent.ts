export const CARE_INTENT_VALUES = ["personal", "family", "hospital"] as const;

export type CareIntent = (typeof CARE_INTENT_VALUES)[number];

export function parseCareIntent(raw: unknown): CareIntent | null {
  if (typeof raw !== "string") return null;

  switch (raw.trim().toLowerCase()) {
    case "personal":
    case "patient":
      return "personal";
    case "family":
      return "family";
    case "hospital":
    case "doctor":
    case "staff":
      return "hospital";
    default:
      return null;
  }
}

export function normalizeCareIntent(
  raw: unknown,
  fallback: CareIntent = "personal",
): CareIntent {
  return parseCareIntent(raw) ?? fallback;
}

export function actorTypeForCareIntent(intent: CareIntent): "patient" | "doctor" {
  return intent === "hospital" ? "doctor" : "patient";
}

export function careIntentFromUserMetadata(
  meta?: Record<string, unknown>,
): CareIntent | null {
  return parseCareIntent(meta?.care_intent) ?? parseCareIntent(meta?.actor_type);
}

export function landingRouteForCareIntent(intent: CareIntent): "/patient" | "/family" | "/dashboard" {
  if (intent === "hospital") return "/dashboard";
  if (intent === "family") return "/family";
  return "/patient";
}

export function onboardingRouteForCareIntent(intent: CareIntent): string {
  return `/onboarding?intent=${intent}`;
}
