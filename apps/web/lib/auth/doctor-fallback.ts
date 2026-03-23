import "server-only";

import { resolveFullCapabilities } from "@thuocare/auth";
import type { ResolvedStaffActorContext } from "@thuocare/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminSupabase = ReturnType<typeof createSupabaseAdminClient>;

function createAdminClient(): AdminSupabase {
  return createSupabaseAdminClient();
}

/**
 * Best-effort doctor actor resolution for cases where RPC binding is stale or
 * missing but the DB link already exists.
 */
export async function resolveDoctorActorByAuthId(
  authUserId: string,
): Promise<ResolvedStaffActorContext | null> {
  const admin = createAdminClient();

  const { data: ua, error: uaError } = await admin
    .from("user_account")
    .select("id, organization_id, role, clinic_id")
    .eq("auth_user_id", authUserId)
    .eq("status", "active")
    .maybeSingle();
  const uaRow = (ua ?? null) as Record<string, unknown> | null;
  if (uaError || !uaRow || uaRow.role !== "doctor") {
    return null;
  }

  const { data: dp, error: dpError } = await admin
    .from("doctor_profile")
    .select("id")
    .eq("user_account_id", String(uaRow.id))
    .eq("status", "active")
    .maybeSingle();
  const dpRow = (dp ?? null) as Record<string, unknown> | null;
  if (dpError || !dpRow || typeof dpRow.id !== "string") {
    return null;
  }

  return {
    kind: "staff",
    authUserId,
    organizationId: String(uaRow.organization_id),
    userAccountId: String(uaRow.id),
    role: "doctor",
    doctorProfileId: dpRow.id,
    clinicId: uaRow.clinic_id == null ? null : String(uaRow.clinic_id),
    capabilities: resolveFullCapabilities({ kind: "staff", role: "doctor" }),
  };
}

export function createAdminSupabaseForDoctorFallback(): AdminSupabase {
  return createAdminClient();
}
