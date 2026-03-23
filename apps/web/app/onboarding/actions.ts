"use server";

import {
  claimPatientAccount,
  claimStaffAccount,
  registerMyDoctorAccount,
} from "@thuocare/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

  redirect(`/onboarding?intent=doctor&error=${encodeURIComponent(result.error)}`);
}

export async function claimPatientWorkspaceAction(formData: FormData) {
  const raw = formData.get("organizationCode");
  const organizationCode =
    typeof raw === "string" && raw.trim() !== "" ? raw.trim() : null;

  const supabase = await createSupabaseServerClient();
  const result = await claimPatientAccount(supabase, organizationCode);

  if (result.success) {
    await supabase.auth.refreshSession();
    revalidatePath("/", "layout");
    redirect("/patient");
  }

  redirect(`/onboarding?intent=patient&error=${encodeURIComponent(result.error)}`);
}
