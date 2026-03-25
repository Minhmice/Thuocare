"use server";

import { buildRequestActorContext, isDoctorActor, isPatientActor } from "@thuocare/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import {
  actorTypeForCareIntent,
  normalizeCareIntent,
  onboardingRouteForCareIntent,
} from "@/lib/workflow/care-intent";

export async function signInAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const careIntent = normalizeCareIntent(formData.get("careIntent"), "personal");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  const actor = await buildRequestActorContext(supabase);

  if (careIntent === "hospital") {
    if (isDoctorActor(actor)) {
      redirect("/dashboard");
    }
    if (isPatientActor(actor)) {
      redirect(
        `/login?error=${encodeURIComponent(
          'This account is not a hospital workspace account. Choose Personal or Family instead.',
        )}`,
      );
    }
    redirect(onboardingRouteForCareIntent(careIntent));
  }

  if (isPatientActor(actor)) {
    redirect(careIntent === "family" ? "/family" : "/patient");
  }
  if (isDoctorActor(actor)) {
    redirect(
      `/login?error=${encodeURIComponent(
        'This account belongs to the hospital lane. Choose Hospital below and sign in again.',
      )}`,
    );
  }
  redirect(onboardingRouteForCareIntent(careIntent));
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
  const careIntent = normalizeCareIntent(formData.get("careIntent"), "personal");
  const actorType = actorTypeForCareIntent(careIntent);
  const isHospital = careIntent === "hospital";
  const orgRaw = formData.get("organizationCode");
  const organizationCode =
    typeof orgRaw === "string" && orgRaw.trim() !== "" ? orgRaw.trim() : undefined;

  if (isHospital) {
    if (!organizationCode) {
      redirect(
        `/signup?error=${encodeURIComponent("Organization code is required for the hospital lane.")}`,
      );
    }
    if (!fullName) {
      redirect(
        `/signup?error=${encodeURIComponent("Full name is required for the hospital lane.")}`,
      );
    }
  }

  const adminClient = createSupabaseAdminClient();

  const user_metadata: Record<string, string> = {
    full_name: fullName,
    actor_type: actorType,
    care_intent: careIntent,
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

  redirect(onboardingRouteForCareIntent(careIntent));
}
