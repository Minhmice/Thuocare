import Link from "next/link";
import { redirect } from "next/navigation";
import {
  buildRequestActorContext,
  isDoctorActor,
  resolveOnboardingState,
} from "@thuocare/auth";
import type { OnboardingState } from "@thuocare/auth";

import { signOutAction } from "@/app/login/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  bootstrapSelfServeAccountAction,
  claimPatientWorkspaceAction,
  claimStaffWorkspaceAction,
  registerDoctorWorkspaceAction,
} from "./actions";
import {
  careIntentFromUserMetadata,
  parseCareIntent,
  type CareIntent,
} from "@/lib/workflow/care-intent";

function contextualHint(onboarding: OnboardingState | null): string {
  const code = onboarding?.latestIssue?.issueCode;
  if (code === "missing_organization_code") {
    return "An organization code is required for this step. Enter the code your organization gave you.";
  }
  if (code === "registration_full_name_required") {
    return "Your full name is required to finish doctor registration. Enter it below.";
  }
  if (!onboarding) return "";
  switch (onboarding.status) {
    case "org_not_found":
      return "Organization code was not found. Check spelling and try again.";
    case "no_matching_profile":
      return "No staff profile matches your email. Use doctor registration below, or ask your clinic to create a matching record.";
    case "claim_conflict":
      return "Multiple profiles matched your email, or this profile is already linked to another login. Contact an admin.";
    default:
      return "";
  }
}

function titleForPatientIntent(intent: CareIntent) {
  if (intent === "family") return "Family lane account";
  if (intent === "hospital") return "Hospital-linked patient account";
  return "Personal lane account";
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; intent?: string }>;
}) {
  const { error, intent } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const actor = await buildRequestActorContext(supabase);

  const { data: userData } = await supabase.auth.getUser();
  const meta = userData.user?.user_metadata as Record<string, unknown> | undefined;

  const requestedIntent = parseCareIntent(intent);
  const signupIntent = careIntentFromUserMetadata(meta);
  const careIntent = requestedIntent ?? signupIntent ?? "hospital";
  const signupActor = typeof meta?.actor_type === "string" ? meta.actor_type : "";
  const doctorRegistrationFlow = signupActor === "doctor";

  if (isDoctorActor(actor)) {
    redirect("/dashboard");
  }

  const onboarding =
    actor.kind === "unresolved"
      ? await resolveOnboardingState(supabase, actor)
      : null;

  const hint = contextualHint(onboarding);

  if (actor.kind === "staff") {
    if (actor.role !== "doctor") {
      return (
        <OnboardingShell title="Wrong role for hospital workspace">
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            Your account is linked as <strong>{actor.role}</strong>. The hospital lane in this
            web app currently expects a <strong>doctor</strong> role plus an active doctor profile.
          </p>
          <FooterActions />
        </OnboardingShell>
      );
    }

    if (actor.doctorProfileId === null) {
      return (
        <OnboardingShell title="Doctor profile missing">
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            You have the doctor role, but there is no active <strong>doctor_profile</strong> on
            your account yet. Ask an admin to finish the setup.
          </p>
          <FooterActions />
        </OnboardingShell>
      );
    }
  }

  if (actor.kind === "patient") {
    if (careIntent === "family") {
      return (
        <OnboardingShell title={titleForPatientIntent(careIntent)}>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            Your login is linked to a patient identity and will open the <strong>family lane</strong>{" "}
            workspace. Household-specific coordination screens are scaffolded next.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/family"
              className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Open family workspace
            </Link>
            <FooterActions />
          </div>
        </OnboardingShell>
      );
    }

    return (
      <OnboardingShell title={titleForPatientIntent(careIntent)}>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          You are signed in as a <strong>patient</strong>. Thuocare will take you into the{" "}
          <strong>{careIntent === "hospital" ? "hospital-linked patient" : "personal"}</strong>{" "}
          workflow.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/patient"
            className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Open patient portal
          </Link>
          <FooterActions />
        </div>
      </OnboardingShell>
    );
  }

  if (actor.kind === "unresolved" && careIntent !== "hospital") {
    const isFamily = careIntent === "family";

    return (
      <OnboardingShell
        title={isFamily ? "Set up your family care account" : "Set up your personal account"}
      >
        {/* Lane description — no clinic language */}
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          {isFamily
            ? "Coordinate medication for your household. You can add family member profiles after your account is ready."
            : "Track your own medications, schedules, and doses — no doctor, clinic, or prescription required."}
        </p>

        {/* Lane capability chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {isFamily ? (
            <>
              <LanePill>Multiple household members</LanePill>
              <LanePill>Role-based access</LanePill>
              <LanePill>Shared reminders</LanePill>
            </>
          ) : (
            <>
              <LanePill>Medication schedule</LanePill>
              <LanePill>Dose tracking</LanePill>
              <LanePill>Safety checks</LanePill>
            </>
          )}
        </div>

        {/* Onboarding issue hint (debug/admin) */}
        {onboarding?.latestIssue && (
          <p className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
            Issue: <code className="font-mono">{onboarding.latestIssue.issueCode}</code>
          </p>
        )}

        {/* Error feedback */}
        {(hint || error) && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800 space-y-1">
            {error ? <p>{error}</p> : null}
            {hint ? <p>{hint}</p> : null}
          </div>
        )}

        {/* Bootstrap form — no organization code for personal lane */}
        <form action={bootstrapSelfServeAccountAction} className="mt-6 space-y-4">
          <input type="hidden" name="careIntent" value={careIntent} />
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            {isFamily ? "Create family account" : "Create personal account"}
          </button>
        </form>

        {/* Clinic-linked patient: optional org code narrows the match */}
        <details className="mt-6 rounded-lg border border-gray-200 bg-gray-50/80 px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium text-gray-700">
            Already registered at a clinic?
          </summary>
          <p className="mt-2 text-xs text-gray-500 leading-relaxed">
            Enter the organization code from your clinic if you have one. Leave it empty to match on email only.
          </p>
          <form action={claimPatientWorkspaceAction} className="mt-3 space-y-3">
            <input type="hidden" name="careIntent" value={careIntent} />
            <div>
              <label htmlFor="patientOrgCode" className="block text-xs font-medium text-gray-600 mb-1">
                Organization code <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="patientOrgCode"
                name="organizationCode"
                type="text"
                autoComplete="off"
                placeholder="e.g. DEMO"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
            >
              Link clinic patient record
            </button>
          </form>
        </details>

        <div className="mt-6">
          <FooterActions />
        </div>
      </OnboardingShell>
    );
  }

  if (actor.kind === "unresolved" && doctorRegistrationFlow) {
    const defaultName = typeof meta?.full_name === "string" ? meta.full_name : "";

    return (
      <OnboardingShell title="Finish hospital lane doctor setup">
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Confirm your <strong>organization code</strong> and <strong>full name</strong>. If your
          clinic already created a staff record with your email, Thuocare will link it. Otherwise
          it will register your doctor profile directly.
        </p>

        {onboarding?.latestIssue && (
          <p className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
            Last issue: <code className="font-mono">{onboarding.latestIssue.issueCode}</code>
          </p>
        )}

        {(hint || error) && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800 space-y-1">
            {error ? <p>{error}</p> : null}
            {hint ? <p>{hint}</p> : null}
          </div>
        )}

        <form action={registerDoctorWorkspaceAction} className="mt-6 space-y-4">
          <div>
            <label htmlFor="organizationCodeDoctor" className="block text-sm font-medium text-gray-700 mb-1.5">
              Organization code <span className="text-red-500">*</span>
            </label>
            <input
              id="organizationCodeDoctor"
              name="organizationCode"
              type="text"
              autoComplete="off"
              required
              placeholder="e.g. DEMO"
              defaultValue={
                typeof meta?.organization_code === "string" ? meta.organization_code : undefined
              }
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label htmlFor="fullNameDoctor" className="block text-sm font-medium text-gray-700 mb-1.5">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              id="fullNameDoctor"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              defaultValue={defaultName}
              placeholder="Dr. Nguyen Van A"
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Complete hospital setup
          </button>
        </form>

        <div className="mt-6">
          <FooterActions />
        </div>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell title="Finish hospital workspace setup">
      <p className="mt-2 text-sm text-gray-600 leading-relaxed">
        Link your login to an existing <strong>staff</strong> record in the hospital lane. If your
        clinic gave you an <strong>organization code</strong>, enter it below to narrow the match.
      </p>
      <p className="mt-2 text-xs text-gray-500">
        Self-registering doctors should sign up with the <strong>hospital</strong> lane intent, or
        reopen this page from a hospital-intent login.
      </p>

      {onboarding?.latestIssue && (
        <p className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
          Last issue: <code className="font-mono">{onboarding.latestIssue.issueCode}</code>
        </p>
      )}

      {(hint || error) && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800 space-y-1">
          {error ? <p>{error}</p> : null}
          {hint ? <p>{hint}</p> : null}
        </div>
      )}

      <form action={claimStaffWorkspaceAction} className="mt-6 space-y-4">
        <div>
          <label htmlFor="organizationCode" className="block text-sm font-medium text-gray-700 mb-1.5">
            Organization code <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="organizationCode"
            name="organizationCode"
            type="text"
            autoComplete="off"
            placeholder="e.g. DEMO"
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Link hospital workspace
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href="/dashboard"
          className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          I already linked - open dashboard
        </Link>
        <form action={signOutAction} className="inline-flex">
          <button
            type="submit"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Sign out
          </button>
        </form>
      </div>
    </OnboardingShell>
  );
}

function OnboardingShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 py-10">
      <div className="max-w-md w-full rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        {children}
      </div>
    </div>
  );
}

function FooterActions() {
  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
      <form action={signOutAction} className="inline-flex flex-1">
        <button
          type="submit"
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}

function LanePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
      {children}
    </span>
  );
}
