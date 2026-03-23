import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildRequestActorContext, isDoctorActor } from "@thuocare/auth";
import {
  getPriorityPatientQueue,
  getPatientsNearDepletion,
  getOverdueFollowUps,
} from "@thuocare/doctor-workspace";
import type {
  PriorityQueueItemVM,
  DepletionAlertVM,
  OverdueFollowUpVM,
} from "@thuocare/doctor-workspace";
import Link from "next/link";
import { createAdminSupabaseForDoctorFallback, resolveDoctorActorByAuthId } from "@/lib/auth/doctor-fallback";

function pct(rate: number | null) {
  if (rate === null) return "—";
  return `${Math.round(rate * 100)}%`;
}

function severityColor(s: string) {
  if (s === "high") return "bg-red-100 text-red-700";
  if (s === "medium") return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-600";
}

export default async function MonitoringPage() {
  const supabase = await createSupabaseServerClient();
  const actorCtx = await buildRequestActorContext(supabase);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const fallbackActor =
    !isDoctorActor(actorCtx) && user?.id != null
      ? await resolveDoctorActorByAuthId(user.id)
      : null;
  const monitoringActor = fallbackActor ?? actorCtx;
  const monitoringClient = fallbackActor ? createAdminSupabaseForDoctorFallback() : supabase;

  let queue: PriorityQueueItemVM[] = [];
  let depletion: DepletionAlertVM[] = [];
  let overdue: OverdueFollowUpVM[] = [];
  let error: string | null = null;

  try {
    [queue, depletion, overdue] = await Promise.all([
      getPriorityPatientQueue(monitoringClient, monitoringActor),
      getPatientsNearDepletion(monitoringClient, monitoringActor),
      getOverdueFollowUps(monitoringClient, monitoringActor),
    ]);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load monitoring data";
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <h1 className="text-xl font-semibold text-gray-900">Monitoring</h1>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Priority queue */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
          Priority Patient Queue ({queue.length})
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {queue.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400">
              No at-risk patients.
            </p>
          ) : (
            queue.map((item) => (
              <Link
                key={item.patientId}
                href={`/patients/${item.patientId}`}
                className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {item.patientName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.issueTypes.join(", ")} · Adherence:{" "}
                    {pct(item.adherenceRate)}
                    {item.minDaysRemaining !== null
                      ? ` · ${item.minDaysRemaining}d supply`
                      : ""}
                    {item.overdueFollowUpCount > 0
                      ? ` · ${item.overdueFollowUpCount} overdue`
                      : ""}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-xs font-medium capitalize px-2 py-0.5 rounded-full ${severityColor(item.severity)}`}
                >
                  {item.severity}
                </span>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Depletion alerts */}
      {depletion.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Near Depletion ({depletion.length})
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {depletion.map((item) => (
              <Link
                key={item.prescriptionItemId}
                href={`/patients/${item.patientId}`}
                className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {item.patientName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.medicationName}
                    {item.strengthText ? ` ${item.strengthText}` : ""} ·{" "}
                    {item.daysRemaining} days remaining
                    {item.isRefillable ? " · Refillable" : ""}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                    item.daysRemaining <= 3
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {item.daysRemaining}d
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Overdue follow-ups */}
      {overdue.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Overdue Follow-ups ({overdue.length})
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {overdue.map((item) => (
              <Link
                key={item.planId}
                href={`/patients/${item.patientId}`}
                className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {item.patientName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.followUpType} · {item.daysOverdue} days overdue
                    {item.requiredBeforeRefill ? " · Required before refill" : ""}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                  {item.daysOverdue}d
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
