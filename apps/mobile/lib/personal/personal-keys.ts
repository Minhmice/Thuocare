/** React Query key factories for the personal lane domain. */
export const personalQueryKeys = {
  /** Lane detection result — rarely changes, cache long. */
  lane: () => ["personal", "lane"] as const,

  /** Personal profile for a patient. */
  profile: (patientId: string | null) => ["personal", "profile", patientId] as const,

  /** Active personal medication list. */
  medications: (patientId: string | null) => ["personal", "medications", patientId] as const,

  /** All statuses — Thuốc tab / quản lý. */
  medicationsAll: (patientId: string | null) => ["personal", "medications-all", patientId] as const,

  /** Today's personal timeline. */
  timeline: (patientId: string | null, date: string) =>
    ["personal", "timeline", patientId, date] as const,

  /** Multi-day personal timeline range. */
  timelineRange: (patientId: string | null, startDate: string, endDate: string) =>
    ["personal", "timeline-range", patientId, startDate, endDate] as const,

  /** Invalidate every cached personal history range for this patient. */
  timelineRangeByPatient: (patientId: string | null) =>
    ["personal", "timeline-range", patientId] as const,

  /** Partial key: invalidate all personal timelines for a patient. */
  timelineByPatient: (patientId: string | null) =>
    ["personal", "timeline", patientId] as const,

  /** Medication detail adherence snippet (date range in key). */
  medicationAdherenceSnippet: (
    patientId: string | null,
    medicationId: string | undefined,
    startDate: string,
    endDate: string,
  ) => ["personal", "med-adherence", patientId, medicationId, startDate, endDate] as const,
};
