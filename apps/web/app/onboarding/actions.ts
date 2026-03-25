"use server";

import {
  claimPatientAccount,
  claimStaffAccount,
  patientClaimFailureAllowsSelfServeBootstrap,
  registerMyDoctorAccount,
} from "@thuocare/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeCareIntent } from "@/lib/workflow/care-intent";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Self-serve account bootstrap for personal and family lane sign-ups.
 *
 * Flow:
 *   1. Try claim_my_patient_account() first — fast path for users whose
 *      patient row was pre-created by a clinic or DB trigger.
 *   2. Fall back to bootstrap_self_serve_account(p_care_lane) SQL RPC which
 *      creates patient + personal/family profile in one transaction.
 *
 * BACKEND REQUIRED (Phase 12):
 *   Function: public.bootstrap_self_serve_account(p_care_lane text) returns uuid
 *   Must:
 *     a. INSERT INTO public.patient (auth_user_id, status) — no organization_id needed
 *     b. INSERT INTO public.personal_profile or public.family_profile (patient_id, auth_user_id)
 *     c. RETURN the new patient.id
 *   Until this migration is applied, personal/family sign-ups will see the
 *   "setup not yet available" message below.
 */
export async function bootstrapSelfServeAccountAction(formData: FormData) {
  const careIntent = normalizeCareIntent(formData.get("careIntent"), "personal");

  const supabase = await createSupabaseServerClient();

  // Fast path: the DB trigger may have already linked a patient row on sign-up.
  const claimResult = await claimPatientAccount(supabase, null);
  if (claimResult.success) {
    await supabase.auth.refreshSession();
    revalidatePath("/", "layout");
    redirect(careIntent === "family" ? "/family" : "/patient");
  }

  if (!patientClaimFailureAllowsSelfServeBootstrap(claimResult)) {
    redirect(
      `/onboarding?intent=${careIntent}&error=${encodeURIComponent(claimResult.error)}`,
    );
  }

  // Self-serve bootstrap via SQL RPC (requires Phase 12 migration).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: rpcError } = await (supabase as any).rpc(
    "bootstrap_self_serve_account",
    { p_care_lane: careIntent },
  );

  if (!rpcError && data) {
    await supabase.auth.refreshSession();
    revalidatePath("/", "layout");
    redirect(careIntent === "family" ? "/family" : "/patient");
  }

  // PGRST202 = PostgREST "function not found" — migration not yet applied.
  const rpcNotDeployed =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (rpcError as any)?.code === "PGRST202" ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    String((rpcError as any)?.message ?? "").includes("Could not find the function");

  if (rpcNotDeployed) {
    redirect(
      `/onboarding?intent=${careIntent}&error=${encodeURIComponent(
        "Account setup is not yet fully deployed on this instance. A database migration is pending (bootstrap_self_serve_account). Please contact support or try again later.",
      )}`,
    );
  }

  redirect(
    `/onboarding?intent=${careIntent}&error=${encodeURIComponent(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      String((rpcError as any)?.message ?? "Account setup failed. Please try again."),
    )}`,
  );
}

export async function claimStaffWorkspaceAction(formData: FormData) {
  const raw = formData.get("organizationCode");
  const organizationCode =
    typeof raw === "string" && raw.trim() !== "" ? raw.trim() : null;

  const supabase = await createSupabaseServerClient();
  const result = await claimStaffAccount(supabase, organizationCode);

  if (result.success) {
    await supabase.auth.refreshSession();
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  redirect(`/onboarding?error=${encodeURIComponent(result.error)}`);
}

export async function registerDoctorWorkspaceAction(formData: FormData) {
  const orgRaw = formData.get("organizationCode");
  const nameRaw = formData.get("fullName");
  const organizationCode = typeof orgRaw === "string" ? orgRaw : "";
  const fullName = typeof nameRaw === "string" ? nameRaw : "";

  const supabase = await createSupabaseServerClient();
  const result = await registerMyDoctorAccount(supabase, organizationCode, fullName);

  if (result.success) {
    await supabase.auth.refreshSession();
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  redirect(`/onboarding?intent=hospital&error=${encodeURIComponent(result.error)}`);
}

export async function claimPatientWorkspaceAction(formData: FormData) {
  const raw = formData.get("organizationCode");
  const careIntent = normalizeCareIntent(formData.get("careIntent"), "personal");
  const organizationCode =
    typeof raw === "string" && raw.trim() !== "" ? raw.trim() : null;

  const supabase = await createSupabaseServerClient();
  const result = await claimPatientAccount(supabase, organizationCode);

  if (result.success) {
    await supabase.auth.refreshSession();
    revalidatePath("/", "layout");
    redirect(careIntent === "family" ? "/family" : "/patient");
  }

  redirect(`/onboarding?intent=${careIntent}&error=${encodeURIComponent(result.error)}`);
}
