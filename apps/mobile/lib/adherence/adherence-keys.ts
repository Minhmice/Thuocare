/**
 * React Query key factories for the adherence domain.
 * Single source of truth for queryKey construction and cache invalidation
 * across all adherence hooks (timeline, history, summary).
 *
 * Pattern mirrors refillQueryKeys in lib/refill/refill-keys.ts.
 */
export const adherenceQueryKeys = {
  // ── Today's timeline ──────────────────────────────────────────────────────

  /** Full key: today's dose timeline for a patient on a specific date. */
  timeline: (patientId: string | null, date: string) =>
    ["adherence", "timeline", patientId, date] as const,

  // ── Multi-day timeline range ───────────────────────────────────────────────

  /**
   * Partial key: invalidates ALL timeline-range queries for a patient
   * (any date range). Use this in onSuccess to clear history after mutations.
   */
  timelineRangeByPatient: (patientId: string | null) =>
    ["adherence", "timeline-range", patientId] as const,

  /** Full key: multi-day adherence timeline for a specific date range. */
  timelineRange: (patientId: string | null, startDate: string, endDate: string) =>
    ["adherence", "timeline-range", patientId, startDate, endDate] as const,

  // ── Aggregated adherence summary ───────────────────────────────────────────

  /**
   * Partial key: invalidates ALL summary-range queries for a patient
   * (any date range). Use this in onSuccess to clear summary after mutations.
   */
  summaryRangeByPatient: (patientId: string | null) =>
    ["adherence", "summary-range", patientId] as const,

  /** Full key: aggregated adherence summary for a specific date range. */
  summaryRange: (patientId: string | null, startDate: string, endDate: string) =>
    ["adherence", "summary-range", patientId, startDate, endDate] as const,
};
