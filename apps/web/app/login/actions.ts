"use server";

import { buildRequestActorContext, isDoctorActor, isPatientActor } from "@thuocare/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export async function signInAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const intentRaw = formData.get("portalIntent");
  const portalIntent = intentRaw === "patient" ? "patient" : "doctor";

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  const actor = await buildRequestActorContext(supabase);

  if (portalIntent === "doctor") {
    if (isDoctorActor(actor)) {
      redirect("/dashboard");
    }
    if (isPatientActor(actor)) {
      redirect(
        `/login?error=${encodeURIComponent(
          'This account is a patient. Choose "Patient" below and sign in again.',
        )}`,
      );
    }
    redirect("/onboarding?intent=doctor");
  }

  if (isPatientActor(actor)) {
    redirect("/patient");
  }
  if (isDoctorActor(actor)) {
    redirect(
      `/login?error=${encodeURIComponent(
        'This account is a doctor. Choose "Doctor" below and sign in again.',
      )}`,
    );
  }
  redirect("/onboarding?intent=patient");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function signUpAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = (formData.get("fullName") as string)?.trim() ?? "";
  const accountTypeRaw = formData.get("accountType");
  const isPatient = accountTypeRaw === "patient";
  const orgRaw = formData.get("organizationCode");
  const organizationCode =
    typeof orgRaw === "string" && orgRaw.trim() !== "" ? orgRaw.trim() : undefined;

  if (!isPatient) {
    if (!organizationCode) {
      redirect(
        `/signup?error=${encodeURIComponent("Organization code is required to register as a doctor.")}`,
      );
    }
    if (!fullName) {
      redirect(
        `/signup?error=${encodeURIComponent("Full name is required to register as a doctor.")}`,
      );
    }
  }

  const adminClient = createSupabaseAdminClient();

  const user_metadata: Record<string, string> = {
    full_name: fullName,
    actor_type: isPatient ? "patient" : "doctor",
  };
  if (organizationCode) {
    user_metadata.organization_code = organizationCode;
  }

  const { error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    user_metadata,
    email_confirm: true,
  });

  if (createError) {
    redirect(`/signup?error=${encodeURIComponent(createError.message)}`);
  }

  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

  if (signInError) {
    redirect(`/login?message=${encodeURIComponent("Account created. Please sign in.")}`);
  }

  redirect(isPatient ? "/onboarding?intent=patient" : "/onboarding");
}
