import { buildRequestActorContext, isDoctorActor, isPatientActor } from "@thuocare/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/login/actions";

export default async function PatientPortalPage() {
  const supabase = await createSupabaseServerClient();
  const actor = await buildRequestActorContext(supabase);

  if (isDoctorActor(actor)) {
    redirect("/dashboard");
  }

  if (!isPatientActor(actor)) {
    redirect("/onboarding?intent=patient");
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
        <span className="text-lg font-semibold text-gray-900">Thuocare</span>
        <form action={signOutAction}>
          <button
            type="submit"
            className="text-sm text-gray-500 hover:text-red-600 transition"
          >
            Sign out
          </button>
        </form>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-md w-full rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-xl font-semibold text-gray-900">Patient portal</h1>
          <p className="mt-3 text-sm text-gray-600 leading-relaxed">
            You are signed in as a patient. Full patient features will appear here as the product grows.
          </p>
        </div>
      </main>
    </div>
  );
}
