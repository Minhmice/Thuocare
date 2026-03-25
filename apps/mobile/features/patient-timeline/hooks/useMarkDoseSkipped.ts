import { useMutation, useQueryClient } from "@tanstack/react-query";

import { markDoseSkipped } from "@thuocare/adherence";

import { useMobileAuth } from "@/lib/auth/mobile-auth";
import { mobileSupabase } from "@/lib/supabase/mobile-client";
import { adherenceQueryKeys } from "@/lib/adherence/adherence-keys";

type MarkSkippedInput = {
  prescriptionItemId: string;
  scheduledTime: string;
};

/**
 * Marks a dose as skipped for the signed-in patient.
 *
 * Actor identity (patientId, organizationId) is resolved from {@link useMobileAuth}.
 * The caller only needs to supply which dose slot is being acted on.
 *
 * @param todayIso - Used to scope cache invalidation to today's timeline key.
 */
export function useMarkDoseSkipped(todayIso: string) {
  const queryClient = useQueryClient();
  const { actor } = useMobileAuth();

  const patientId = actor?.kind === "patient" ? actor.patientId : null;

  return useMutation({
    mutationFn: async ({ prescriptionItemId, scheduledTime }: MarkSkippedInput) => {
      if (!actor || actor.kind !== "patient" || actor.organizationId === null) {
        throw new Error("Hospital-linked patient actor required to mark prescription doses");
      }
      return markDoseSkipped(mobileSupabase, actor, {
        patientId: actor.patientId,
        organizationId: actor.organizationId,
        prescriptionItemId,
        scheduledTime,
        source: "patient",
      });
    },
    onSuccess: () => {
      // Invalidate today's timeline
      void queryClient.invalidateQueries({
        queryKey: adherenceQueryKeys.timeline(patientId, todayIso),
      });
      // Invalidate all history ranges so the history tab updates immediately
      void queryClient.invalidateQueries({
        queryKey: adherenceQueryKeys.timelineRangeByPatient(patientId),
      });
      // Invalidate summary stats
      void queryClient.invalidateQueries({
        queryKey: adherenceQueryKeys.summaryRangeByPatient(patientId),
      });
    },
  });
}
