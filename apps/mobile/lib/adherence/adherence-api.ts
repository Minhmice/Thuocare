import {
  getAdherenceSummary,
  getPatientTimeline,
  getPatientTimelineRange,
  markDoseSkipped,
  markDoseTaken,
} from "@thuocare/adherence";

/** Service-layer entrypoints for mobile — no raw Supabase reads for adherence. */
export const adherenceApi = {
  getPatientTimeline,
  getPatientTimelineRange,
  getAdherenceSummary,
  markDoseTaken,
  markDoseSkipped,
};
