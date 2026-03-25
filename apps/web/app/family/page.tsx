import { buildRequestActorContext, isDoctorActor } from "@thuocare/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/login/actions";

export default async function FamilyPortalPage() {
  const supabase = await createSupabaseServerClient();
  const actor = await buildRequestActorContext(supabase);
  const { data: userData } = await supabase.auth.getUser();
  const meta = userData.user?.user_metadata as Record<string, unknown> | undefined;

  if (isDoctorActor(actor)) redirect("/dashboard");

  // Family lane users may not have organization_id — detect via family_profile.
  // NOTE: cast to any until DB types are regenerated after Phase 10 migration.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: familyProfile } = await (supabase as any)
    .from("family_profile")
    .select("id, full_name")
    .eq("auth_user_id", actor.authUserId)
    .eq("profile_status", "active")
    .maybeSingle() as { data: { id: string; full_name: string } | null };

  const isFamilyLane = familyProfile !== null;

  if (!isFamilyLane) {
    redirect("/onboarding?intent=family");
  }

  const displayName =
    familyProfile?.full_name ??
    (typeof meta?.full_name === "string" ? meta.full_name : null);

  return <FamilyLaneDashboard displayName={displayName} />;
}

// ─── Family lane launchpad ─────────────────────────────────────────────────────

function FamilyLaneDashboard({ displayName }: { displayName: string | null }) {
  const greeting = displayName ? `Welcome, ${displayName}` : "Welcome to your family lane";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
        <span className="text-base font-semibold text-gray-900">Thuocare</span>
        <form action={signOutAction}>
          <button
            type="submit"
            className="text-sm text-gray-500 hover:text-red-600 transition"
          >
            Sign out
          </button>
        </form>
      </header>

      <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">

        {/* Hero */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
          <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 uppercase tracking-wide">
            Family lane
          </span>
          <h1 className="mt-3 text-xl font-semibold text-gray-900">{greeting}</h1>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            Coordinate medication for everyone in your household. Add member profiles, assign
            care roles, and keep track of schedules together.
          </p>
        </div>

        {/* Household members placeholder */}
        <section className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Household members
            </h2>
          </div>
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center">
            <p className="text-sm text-gray-500">No members added yet.</p>
            <p className="mt-1 text-xs text-gray-400">
              Member profiles and role-based access are coming in the next phase.
            </p>
          </div>
        </section>

        {/* What you can do here */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <FeatureCard
            icon="👨‍👩‍👧"
            title="Member profiles"
            description="Add household members — children, elderly parents, or any dependent."
            soon
          />
          <FeatureCard
            icon="🔔"
            title="Shared reminders"
            description="Dose alerts go to the right caregiver at the right time."
            soon
          />
          <FeatureCard
            icon="🛡️"
            title="Role-based access"
            description="Assign caregiver, guardian, or viewer roles per household member."
            soon
          />
          <FeatureCard
            icon="💊"
            title="Household medication list"
            description="One place to see what everyone in the household is taking."
            soon
          />
        </div>

        {/* Next step */}
        <div className="mt-6 rounded-xl border border-amber-100 bg-amber-50 p-5">
          <p className="text-sm font-medium text-amber-900">Next step</p>
          <p className="mt-1 text-sm text-amber-700">
            Household member management is coming in the next phase. For now, your family
            account is set up and ready. Open the Thuocare mobile app to start
            coordinating medication.
          </p>
        </div>

      </main>
    </div>
  );
}

// ─── Components ────────────────────────────────────────────────────────────────

function FeatureCard({
  icon,
  title,
  description,
  soon = false,
}: {
  icon: string;
  title: string;
  description: string;
  soon?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 opacity-80">
      <div className="flex items-start gap-3">
        <span className="text-xl leading-none mt-0.5">{icon}</span>
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {title}
            {soon && (
              <span className="ml-2 text-xs font-normal text-gray-400">coming soon</span>
            )}
          </p>
          <p className="mt-1 text-xs text-gray-500 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}
