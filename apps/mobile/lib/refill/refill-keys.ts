/** React Query key factories for the refill domain — single source of truth for cache + invalidation. */
export const refillQueryKeys = {
  /** Partial key: invalidates every `requests(patientId)` list (e.g. pull-to-refresh without patientId in scope). */
  requestsPrefix: ["refill", "requests"] as const,
  requests: (patientId: string) => ["refill", "requests", patientId] as const,
  nearDepletion: (patientId: string, thresholdDays: number) =>
    ["refill", "near-depletion", patientId, thresholdDays] as const,
  /** Partial key: invalidates all near-depletion queries for this patient (any threshold). */
  nearDepletionByPatient: (patientId: string) => ["refill", "near-depletion", patientId] as const,
};
