import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildRequestActorContext, isDoctorActor } from "@thuocare/auth";
import { getDoctorAppointments } from "@thuocare/appointments";
import type { AppointmentDetailVM } from "@thuocare/appointments";
import Link from "next/link";
import { createAdminSupabaseForDoctorFallback, resolveDoctorActorByAuthId } from "@/lib/auth/doctor-fallback";

function statusColor(status: string) {
  const map: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    confirmed: "bg-green-100 text-green-700",
    completed: "bg-gray-100 text-gray-600",
    cancelled: "bg-red-100 text-red-600",
    no_show: "bg-amber-100 text-amber-700",
    rescheduled: "bg-purple-100 text-purple-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function AppointmentRow({ appt }: { appt: AppointmentDetailVM }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">
          <Link
            href={`/patients/${appt.patientId}`}
            className="hover:underline text-blue-700"
          >
            Patient ···{appt.patientId.slice(-6)}
          </Link>
        </p>
        <p className="text-xs text-gray-500">
          {formatDateTime(appt.scheduledStartAt)} · {appt.appointmentType}
          {appt.reasonText ? ` · ${appt.reasonText}` : ""}
        </p>
      </div>
      <span
        className={`shrink-0 text-xs font-medium capitalize px-2 py-0.5 rounded-full ${statusColor(appt.status)}`}
      >
        {appt.status}
      </span>
    </div>
  );
}

export default async function AppointmentsPage() {
  const supabase = await createSupabaseServerClient();
  const actorCtx = await buildRequestActorContext(supabase);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const fallbackActor =
    !isDoctorActor(actorCtx) && user?.id != null
      ? await resolveDoctorActorByAuthId(user.id)
      : null;
  const appointmentActor = fallbackActor ?? actorCtx;
  const appointmentClient = fallbackActor ? createAdminSupabaseForDoctorFallback() : supabase;

  let appointments: AppointmentDetailVM[] = [];
  let error: string | null = null;

  try {
    appointments = await getDoctorAppointments(appointmentClient, appointmentActor);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load appointments";
  }

  const upcoming = appointments.filter(
    (a) =>
      (a.status === "scheduled" || a.status === "confirmed") &&
      new Date(a.scheduledStartAt) >= new Date(),
  );
  const past = appointments.filter((a) => !upcoming.includes(a));

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Appointments</h1>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Upcoming ({upcoming.length})
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {upcoming.map((appt) => (
              <AppointmentRow key={appt.appointmentId} appt={appt} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Past ({past.length})
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden opacity-75">
            {past.map((appt) => (
              <AppointmentRow key={appt.appointmentId} appt={appt} />
            ))}
          </div>
        </section>
      )}

      {appointments.length === 0 && !error && (
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-10 text-center">
          <p className="text-sm text-gray-400">No appointments found.</p>
        </div>
      )}
    </div>
  );
}
