import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildRequestActorContext, requireDoctorActor } from "@thuocare/auth";
import {
  getDoctorWorkspaceContextVM,
} from "@thuocare/doctor-workspace";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/login/actions";
import { resolveDoctorActorByAuthId } from "@/lib/auth/doctor-fallback";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/patients", label: "Patients" },
  { href: "/appointments", label: "Appointments" },
  { href: "/monitoring", label: "Monitoring" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const actorCtx = await buildRequestActorContext(supabase);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let actor;
  try {
    actor = requireDoctorActor(actorCtx);
  } catch {
    const fallbackActor =
      user?.id != null ? await resolveDoctorActorByAuthId(user.id) : null;
    if (fallbackActor !== null) {
      actor = fallbackActor;
    } else {
      // Must not send to /login: proxy redirects authenticated users from /login → /dashboard (infinite 307 loop).
      redirect("/onboarding");
    }
  }

  let displayName = "Doctor";
  try {
    const ctx = await getDoctorWorkspaceContextVM(supabase, actorCtx);
    displayName = ctx.displayName;
  } catch {
    // best-effort
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 flex flex-col bg-white border-r border-gray-200">
        <div className="px-5 h-14 flex items-center border-b border-gray-100">
          <span className="text-base font-semibold text-gray-900">Thuocare</span>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-700 truncate">{displayName}</p>
          <p className="text-xs text-gray-400 mb-2">
            {actor.clinicId ? "Clinic staff" : "Doctor"}
          </p>
          <form action={signOutAction}>
            <button
              type="submit"
              className="text-xs text-gray-400 hover:text-red-500 transition"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {children}
      </main>
    </div>
  );
}
