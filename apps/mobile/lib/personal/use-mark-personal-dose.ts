import { useMutation, useQueryClient } from "@tanstack/react-query";

import { markPersonalDoseTaken, markPersonalDoseSkipped } from "@thuocare/personal";

import { useMobileAuth } from "@/lib/auth/mobile-auth";
import { mobileSupabase } from "@/lib/supabase/mobile-client";

import { personalQueryKeys } from "./personal-keys";

type MarkInput = {
  personalMedicationId: string;
  scheduledTime: string;
  /** When set, stored as actual_taken_time (late / corrected logging). */
  actualTakenTime?: string;
};

/**
 * Marks a personal dose as taken or skipped.
 * Actor identity resolved from useMobileAuth.
 */
export function useMarkPersonalDose(todayIso: string) {
  const queryClient = useQueryClient();
  const { actor } = useMobileAuth();

  const patientId = actor?.kind === "patient" ? actor.patientId : null;

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: personalQueryKeys.timeline(patientId, todayIso),
    });
    void queryClient.invalidateQueries({
      queryKey: personalQueryKeys.timelineByPatient(patientId),
    });
    void queryClient.invalidateQueries({
      queryKey: personalQueryKeys.timelineRangeByPatient(patientId),
    });
    void queryClient.invalidateQueries({
      predicate: (q) =>
        Array.isArray(q.queryKey) &&
        q.queryKey[0] === "personal" &&
        q.queryKey[1] === "med-adherence",
    });
  };

  const takeMutation = useMutation({
    mutationFn: async (input: MarkInput) => {
      if (!actor || actor.kind !== "patient") throw new Error("Patient actor required");
      return markPersonalDoseTaken(mobileSupabase, actor, {
        patientId: actor.patientId,
        personalMedicationId: input.personalMedicationId,
        scheduledTime: input.scheduledTime,
        actualTakenTime: input.actualTakenTime,
      });
    },
    onSuccess: invalidate,
  });

  const skipMutation = useMutation({
    mutationFn: async (input: MarkInput) => {
      if (!actor || actor.kind !== "patient") throw new Error("Patient actor required");
      return markPersonalDoseSkipped(mobileSupabase, actor, {
        patientId: actor.patientId,
        personalMedicationId: input.personalMedicationId,
        scheduledTime: input.scheduledTime,
      });
    },
    onSuccess: invalidate,
  });

  return {
    takeDose: takeMutation.mutate,
    skipDose: skipMutation.mutate,
    isTaking: takeMutation.isPending,
    isSkipping: skipMutation.isPending,
    isPending: takeMutation.isPending || skipMutation.isPending,
  };
}
