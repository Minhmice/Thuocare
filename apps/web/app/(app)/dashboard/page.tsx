import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildRequestActorContext, isDoctorActor } from "@thuocare/auth";
import { getDoctorDashboard } from "@thuocare/doctor-workspace";
import type { DashboardSummaryVM } from "@thuocare/doctor-workspace";
import Link from "next/link";
import { createAdminSupabaseForDoctorFallback, resolveDoctorActorByAuthId } from "@/lib/auth/doctor-fallback";

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href?: string;
}) {
  const content = (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 hover:shadow-sm transition">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const actorCtx = await buildRequestActorContext(supabase);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const fallbackActor =
    !isDoctorActor(actorCtx) && user?.id != null
      ? await resolveDoctorActorByAuthId(user.id)
      : null;
  const dashboardActor = fallbackActor ?? actorCtx;
  const dashboardClient = fallbackActor ? createAdminSupabaseForDoctorFallback() : supabase;

  let summary: DashboardSummaryVM | null = null;
  let error: string | null = null;

  try {
    const result = await getDoctorDashboard(dashboardClient, dashboardActor);
    summary = result.summary;
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load dashboard";
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Dashboard</h1>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {summary && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Patients"
              value={summary.totalPatientsInOrg}
              href="/patients"
            />
            <StatCard
              label="Active Patients"
              value={summary.activePatientsCount}
              href="/patients"
            />
            <StatCard
              label="Active Episodes"
              value={summary.activeEpisodesCount}
            />
            <StatCard
              label="Active Prescriptions"
              value={summary.activePrescriptionsCount}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/monitoring">
              <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 hover:shadow-sm transition">
                <p className="text-xs text-red-600 font-medium uppercase tracking-wide">
                  At-Risk Patients
                </p>
                <p className="mt-1 text-3xl font-semibold text-red-700">
                  {summary.atRiskPatientsCount}
                </p>
              </div>
            </Link>

            <Link href="/monitoring">
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 hover:shadow-sm transition">
                <p className="text-xs text-amber-600 font-medium uppercase tracking-wide">
                  Overdue Follow-ups
                </p>
                <p className="mt-1 text-3xl font-semibold text-amber-700">
                  {summary.overdueFollowUpsCount}
                </p>
              </div>
            </Link>

            <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
              <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">
                Pending Refills
              </p>
              <p className="mt-1 text-3xl font-semibold text-blue-700">
                {summary.pendingRefillsCount}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
