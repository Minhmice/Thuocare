import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildRequestActorContext, isDoctorActor } from "@thuocare/auth";
import {
  getPatientDetailForDoctor,
  getPatientMonitoringDetail,
} from "@thuocare/doctor-workspace";
import type { PatientDetailVM, PatientMonitoringDetailVM } from "@thuocare/doctor-workspace";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminSupabaseForDoctorFallback, resolveDoctorActorByAuthId } from "@/lib/auth/doctor-fallback";

function pct(rate: number | null) {
  if (rate === null) return "—";
  return `${Math.round(rate * 100)}%`;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">{title}</h2>
      {children}
    </div>
  );
}

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  let patient: PatientDetailVM | null = null;
  let monitoring: PatientMonitoringDetailVM | null = null;

  try {
    patient = await getPatientDetailForDoctor(patientClient, patientActor, id);
  } catch {
    notFound();
  }

  if (!patient) notFound();

  try {
    monitoring = await getPatientMonitoringDetail(patientClient, patientActor, { patientId: id });
  } catch {
    // best-effort
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/patients"
            className="text-xs text-gray-400 hover:text-gray-600 mb-1 block"
          >
            ← Patients
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">{patient.fullName}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {patient.age !== null ? `Age ${patient.age}` : "—"} ·{" "}
            {patient.sex} ·{" "}
            {patient.dateOfBirth ?? "DOB unknown"}
          </p>
        </div>
        <span
          className={`text-xs font-medium capitalize px-2.5 py-1 rounded-full ${
            patient.status === "active"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {patient.status}
        </span>
      </div>

      {/* Adherence summary */}
      {monitoring && (
        <Section title="Adherence (last 30 days)">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Adherence Rate", value: pct(monitoring.adherence.adherenceRate) },
              { label: "Taken", value: monitoring.adherence.taken },
              { label: "Missed", value: monitoring.adherence.missed },
              { label: "Skipped", value: monitoring.adherence.skipped },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Active episodes */}
      {patient.activeEpisodes.length > 0 && (
        <Section title={`Active Episodes (${patient.activeEpisodes.length})`}>
          <div className="space-y-2">
            {patient.activeEpisodes.map((ep) => (
              <div
                key={ep.episodeId}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{ep.title}</p>
                  <p className="text-xs text-gray-500">
                    {ep.episodeType} · Started {ep.startDate}
                  </p>
                </div>
                <span className="text-xs text-gray-500 capitalize">{ep.status}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Active prescriptions */}
      {patient.activePrescriptions.length > 0 && (
        <Section title={`Active Prescriptions (${patient.activePrescriptions.length})`}>
          <div className="space-y-2">
            {patient.activePrescriptions.map((rx) => (
              <div
                key={rx.prescriptionId}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <p className="text-sm text-gray-900">{rx.prescriptionKind}</p>
                <span className="text-xs text-gray-400">{rx.status}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Near depletion */}
      {monitoring && monitoring.nearDepletionItems.length > 0 && (
        <Section title={`Near Depletion (${monitoring.nearDepletionItems.length})`}>
          <div className="space-y-2">
            {monitoring.nearDepletionItems.map((item) => (
              <div
                key={item.prescriptionItemId}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {item.medicationName}
                    {item.strengthText ? ` ${item.strengthText}` : ""}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.daysRemaining} days remaining
                    {item.isRefillable ? " · Refillable" : ""}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    item.daysRemaining <= 3
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {item.daysRemaining}d
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Contact info */}
      <Section title="Contact">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-500">Phone</p>
            <p className="text-gray-900">{patient.phone ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="text-gray-900">{patient.email ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Address</p>
            <p className="text-gray-900">{patient.addressText ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Language</p>
            <p className="text-gray-900">{patient.preferredLanguage ?? "—"}</p>
          </div>
        </div>
      </Section>
    </div>
  );
}
