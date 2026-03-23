import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateRefillRequestInput } from "@thuocare/refill";

import { useMobileAuth } from "@/lib/auth/mobile-auth";
import { mobileSupabase } from "@/lib/supabase/mobile-client";

import { refillApi } from "./refill-api";
import { refillQueryKeys } from "./refill-keys";

type CreateRefillResult = Awaited<ReturnType<typeof refillApi.createRefillRequest>>;

function assertPatientActor(
  actor: ReturnType<typeof useMobileAuth>["actor"],
): asserts actor is NonNullable<typeof actor> & { kind: "patient"; patientId: string } {
  if (!actor || actor.kind !== "patient") {
    throw new Error("Patient actor required to create a refill request");
  }
}

/**
 * Submits a refill request via `createRefillRequest`. Call only when `patientActorRequired` is false.
 */
export function useCreateRefillRequest() {
  const queryClient = useQueryClient();
  const { actor, actorStatus, bootstrapStatus, session, actorError } = useMobileAuth();
  const authActorFailed = actorStatus === "error";

  const authReady =
    bootstrapStatus === "ready" && session != null && actorStatus === "ready" && actor != null;
  const patientActorRequired = authReady && actor.kind !== "patient";
  const canMutate =
    bootstrapStatus === "ready" &&
    session != null &&
    actorStatus === "ready" &&
    actor != null &&
    actor.kind === "patient";

  const mutation = useMutation<CreateRefillResult, Error, CreateRefillRequestInput>({
    mutationFn: async (input) => {
      assertPatientActor(actor);
      if (input.patientId !== actor.patientId) {
        throw new Error("Input patientId does not match signed-in patient");
      }
      return refillApi.createRefillRequest(mobileSupabase, actor, input);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: refillQueryKeys.requests(variables.patientId) });
      queryClient.invalidateQueries({
        queryKey: refillQueryKeys.nearDepletionByPatient(variables.patientId),
      });
    },
  });

  return {
    ...mutation,
    isError: authActorFailed || mutation.isError,
    error: (actorError ? new Error(actorError) : mutation.error) ?? null,
    patientActorRequired,
    canMutate,
    actorError,
  };
}
