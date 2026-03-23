import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildRequestActorContext, isDoctorActor } from "@thuocare/auth";
import { getDoctorPatientList } from "@thuocare/doctor-workspace";
import type { PatientSummaryVM } from "@thuocare/doctor-workspace";
import Link from "next/link";
import { createAdminSupabaseForDoctorFallback, resolveDoctorActorByAuthId } from "@/lib/auth/doctor-fallback";

function RiskBadge({ tier }: { tier: string | null }) {
  if (!tier) return null;
  const colors: Record<string, string> = {
    high: "bg-red-100 text-red-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-green-100 text-green-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${colors[tier] ?? "bg-gray-100 text-gray-600"}`}
    >
      {tier}
    </span>
  );
}

function PatientRow({ patient }: { patient: PatientSummaryVM }) {
  return (
    <Link
      href={`/patients/${patient.patientId}`}
      className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-100 last:border-0"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {patient.fullName}
        </p>
        <p className="text-xs text-gray-500">
          {patient.age !== null ? `Age ${patient.age}` : "—"} ·{" "}
          {patient.sex ?? "—"} · {patient.activeEpisodeCount} episode
          {patient.activeEpisodeCount !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <RiskBadge tier={patient.riskTier} />
        <span
          className={`text-xs capitalize ${
            patient.status === "active"
              ? "text-green-600"
              : "text-gray-400"
          }`}
        >
          {patient.status}
        </span>
      </div>
    </Link>
  );
}

export default async function PatientsPage() {
  const supabase = await createSupabaseServerClient();
  const actorCtx = await buildRequestActorContext(supabase);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const fallbackActor =
    !isDoctorActor(actorCtx) && user?.id != null
      ? await resolveDoctorActorByAuthId(user.id)
      : null;
  const patientActor = fallbackActor ?? actorCtx;
  const patientClient = fallbackActor ? createAdminSupabaseForDoctorFallback() : supabase;

  let patients: PatientSummaryVM[] = [];
  let error: string | null = null;

  try {
    patients = await getDoctorPatientList(patientClient, patientActor);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load patients";
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Patients</h1>
        <span className="text-sm text-gray-500">{patients.length} patients</span>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {patients.length === 0 && !error ? (
          <p className="px-4 py-8 text-center text-sm text-gray-400">
            No patients found.
          </p>
        ) : (
          patients.map((p) => <PatientRow key={p.patientId} patient={p} />)
        )}
      </div>
    </div>
  );
}
