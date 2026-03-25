/**
 * @deprecated Use {@link useMobileAuth} from `@/lib/auth/mobile-auth` instead.
 *
 * This hook resolves a lightweight actor state via a direct RPC call.
 * It does NOT integrate with the full MobileAuthProvider context (which handles
 * session restoration, token refresh, stale-result prevention, and provides the
 * complete `AnyActorContext` from `@thuocare/auth`).
 *
 * Routing logic has been removed — navigation is handled centrally by
 * `AuthBootGate` in `app/_layout.tsx`.
 *
 * Kept only for backward compatibility while migration to `useMobileAuth` completes.
 */
import { useEffect, useState } from "react";
import { mobileSupabase } from "@/lib/supabase/mobile-client";

export type UserKind = "staff" | "patient" | "unresolved" | "none";

export interface ActorState {
  kind: UserKind;
  patientId?: string;
  organizationId?: string;
}

type AuthBindingStatus = {
  patient_id: string | null;
  organization_id: string | null;
  staff_user_account_id: string | null;
};

export function useActor() {
  const [actor, setActor] = useState<ActorState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await mobileSupabase.auth.getSession();

      if (!session) {
        setActor({ kind: "none" });
        setLoading(false);
        return;
      }

      const { data, error } = await mobileSupabase.rpc("my_auth_binding_status");
      const binding = data as AuthBindingStatus | null;

      if (error || !binding) {
        setActor({ kind: "unresolved" });
      } else if (binding.patient_id && binding.organization_id) {
        setActor({
          kind: "patient",
          patientId: binding.patient_id,
          organizationId: binding.organization_id,
        });
      } else if (binding.staff_user_account_id) {
        setActor({ kind: "staff" });
      } else {
        setActor({ kind: "unresolved" });
      }

      setLoading(false);
    };

    void checkUser();
  }, []);

  return { actor, loading };
}
