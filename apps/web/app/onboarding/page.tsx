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
  claimPatientWorkspaceAction,
  claimStaffWorkspaceAction,
  registerDoctorWorkspaceAction,
} from "./actions";

function contextualHint(onboarding: OnboardingState | null): string {
  const code = onboarding?.latestIssue?.issueCode;
  if (code === "missing_organization_code") {
    return "An organization code is required for this step. Enter the code your organization gave you (e.g. DEMO after running seed).";
  }
  if (code === "registration_full_name_required") {
    return "Your full name is required to finish doctor registration. Enter it in the form below.";
  }
  if (!onboarding) return "";
  switch (onboarding.status) {
    case "org_not_found":
      return "Organization code was not found. Check spelling (e.g. DEMO for local seed).";
    case "no_matching_profile":
      return 'No staff profile matches your email. For doctors who self-register, use "Complete doctor registration" below. Otherwise ask your clinic to create a record with the same email.';
    case "claim_conflict":
      return "Multiple profiles matched your email, or this profile is already linked to another login. Contact an admin.";
    default:
      return "";
  }
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
  const signupActor = typeof meta?.actor_type === "string" ? meta.actor_type : "";

  const patientFlow =
    intent === "patient" || signupActor === "patient";
  const doctorFlow =
    intent === "doctor" || signupActor === "doctor";

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
        <OnboardingShell title="Wrong role for this portal">
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            Your account is linked as <strong>{actor.role}</strong>. The doctor workspace requires the{" "}
            <strong>doctor</strong> role and an active doctor profile. Ask your clinic administrator to
            update your role or use the appropriate app for your role.
          </p>
          <FooterActions />
        </OnboardingShell>
      );
    }
    if (actor.doctorProfileId === null) {
      return (
        <OnboardingShell title="Doctor profile missing">
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            You have the doctor role, but there is no active <strong>doctor_profile</strong> on your
            account yet. Ask an admin to complete your profile, or run seed data locally if you are
            developing.
          </p>
          <FooterActions />
        </OnboardingShell>
      );
    }
  }

  if (actor.kind === "patient") {
    return (
      <OnboardingShell title="Patient account">
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          You are signed in as a <strong>patient</strong>. Open the patient portal to continue.
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

  if (actor.kind === "unresolved" && patientFlow) {
    return (
      <OnboardingShell title="Link your patient account">
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Enter your <strong>organization code</strong> if your care team gave you one (optional). Your login
          email must match the patient record on file.
        </p>

        {onboarding?.latestIssue && (
          <p className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
            Last issue: <code className="font-mono">{onboarding.latestIssue.issueCode}</code>
            {onboarding.latestIssue.organizationCode
              ? ` · org code tried: ${onboarding.latestIssue.organizationCode}`
              : null}
          </p>
        )}

        {(hint || error) && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800 space-y-1">
            {error ? <p>{error}</p> : null}
            {hint ? <p>{hint}</p> : null}
          </div>
        )}

        <form action={claimPatientWorkspaceAction} className="mt-6 space-y-4">
          <div>
            <label htmlFor="organizationCodePatient" className="block text-sm font-medium text-gray-700 mb-1.5">
              Organization code <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="organizationCodePatient"
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
            Link my patient account
          </button>
        </form>

        <div className="mt-6">
          <FooterActions />
        </div>
      </OnboardingShell>
    );
  }

  if (actor.kind === "unresolved" && doctorFlow) {
    const defaultName =
      typeof meta?.full_name === "string" ? meta.full_name : "";

    return (
      <OnboardingShell title="Complete doctor registration">
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Confirm your <strong>organization code</strong> and <strong>full name</strong>. If your clinic already
          created a staff record with your email, we will link it; otherwise we create your doctor profile
          (no clinic assignment required).
        </p>

        {onboarding?.latestIssue && (
          <p className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
            Last issue: <code className="font-mono">{onboarding.latestIssue.issueCode}</code>
            {onboarding.latestIssue.organizationCode
              ? ` · org code tried: ${onboarding.latestIssue.organizationCode}`
              : null}
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
            Complete registration
          </button>
        </form>

        <div className="mt-6">
          <FooterActions />
        </div>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell title="Finish workspace setup">
      <p className="mt-2 text-sm text-gray-600 leading-relaxed">
        Link your login to an existing <strong>staff</strong> record (same email as in your clinic&apos;s
        Thuocare data). If your clinic gave you an <strong>organization code</strong>, enter it below —
        this helps when your email exists in more than one organization.
      </p>
      <p className="mt-2 text-xs text-gray-500">
        New doctors who are not in the system yet should{" "}
        <Link href="/signup" className="text-blue-600 hover:text-blue-700">
          sign up as a doctor
        </Link>{" "}
        with an organization code, or use{" "}
        <Link href="/onboarding?intent=doctor" className="text-blue-600 hover:text-blue-700">
          Complete doctor registration
        </Link>
        .
      </p>

      {onboarding?.latestIssue && (
        <p className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
          Last issue: <code className="font-mono">{onboarding.latestIssue.issueCode}</code>
          {onboarding.latestIssue.organizationCode
            ? ` · org code tried: ${onboarding.latestIssue.organizationCode}`
            : null}
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
          <p className="mt-1.5 text-xs text-gray-500">
            Demo seed uses code <code className="rounded bg-gray-100 px-1">DEMO</code> and a pre-created{" "}
            <code className="rounded bg-gray-100 px-1">user_account</code> (e.g.{" "}
            <code className="rounded bg-gray-100 px-1">doctor@demo.com</code>).
          </p>
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Link my staff account
        </button>
      </form>

      <p className="mt-6 text-xs text-gray-500 leading-relaxed">
        If you were provisioned by an admin, your <strong>user_account</strong> row must already exist with
        your email.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href="/dashboard"
          className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          I already linked — open dashboard
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
