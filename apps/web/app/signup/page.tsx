import Link from "next/link";
import { signUpAction } from "@/app/login/actions";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-blue-600 px-12 py-10">
        <div>
          <span className="text-xl font-semibold text-white tracking-tight">Thuocare</span>
        </div>
        <div>
          <h2 className="text-4xl font-semibold text-white leading-snug">
            Join Thuocare
          </h2>
          <p className="mt-4 text-blue-100 text-sm leading-relaxed max-w-sm">
            Register as a doctor (organization code required) or as a patient to link to your care record.
          </p>
        </div>
        <p className="text-xs text-blue-200">© 2026 Thuocare</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <span className="text-2xl font-semibold text-blue-600">Thuocare</span>
          </div>

          <h1 className="text-2xl font-semibold text-gray-900">Create account</h1>
          <p className="mt-1 text-sm text-gray-500">Thuocare</p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form action={signUpAction} className="mt-8 space-y-5">
            <fieldset className="space-y-2">
              <legend className="block text-sm font-medium text-gray-700 mb-2">Account type</legend>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="accountType"
                  value="doctor"
                  defaultChecked
                  className="text-blue-600 focus:ring-blue-500"
                />
                Doctor (requires organization code)
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="accountType"
                  value="patient"
                  className="text-blue-600 focus:ring-blue-500"
                />
                Patient
              </label>
            </fieldset>

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1.5">
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                placeholder="Your full name"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="At least 8 characters"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>

            <div>
              <label
                htmlFor="organizationCode"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Organization code{" "}
                <span className="text-gray-400 font-normal">(required for doctors)</span>
              </label>
              <input
                id="organizationCode"
                name="organizationCode"
                type="text"
                autoComplete="off"
                placeholder="e.g. DEMO"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
              />
              <p className="mt-1 text-xs text-gray-500">
                Patients may leave this blank unless their care team provided a code.
              </p>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium py-2.5 transition"
            >
              Create account
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700 transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
