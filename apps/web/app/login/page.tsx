import Link from "next/link";
import { signInAction } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-blue-600 px-12 py-10">
        <div>
          <span className="text-xl font-semibold text-white tracking-tight">Thuocare</span>
        </div>
        <div>
          <h2 className="text-4xl font-semibold text-white leading-snug">
            Your medication,
            <br />
            your way.
          </h2>
          <p className="mt-4 text-blue-100 text-sm leading-relaxed max-w-sm">
            Personal, family, or hospital — Thuocare starts from your intent and
            keeps everything in one safe place.
          </p>
        </div>
        <p className="text-xs text-blue-200">(c) 2026 Thuocare</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <span className="text-2xl font-semibold text-blue-600">Thuocare</span>
          </div>

          <h1 className="text-2xl font-semibold text-gray-900">Sign in</h1>
          <p className="mt-1 text-sm text-gray-500">Thuocare</p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error === "auth_callback_failed"
                ? "Authentication failed. Please try again."
                : error}
            </div>
          )}

          {message && (
            <div className="mt-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          )}

          <form action={signInAction} className="mt-8 space-y-5">
            <fieldset className="space-y-2">
              <legend className="block text-sm font-medium text-gray-700 mb-2">
                Sign in as
              </legend>
              <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:border-blue-300 transition has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                <input
                  type="radio"
                  name="careIntent"
                  value="personal"
                  defaultChecked
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">Personal</span>
                  <span className="block text-xs text-gray-500 mt-0.5">Your own medication, no clinic needed</span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:border-blue-300 transition has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                <input
                  type="radio"
                  name="careIntent"
                  value="family"
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">Family</span>
                  <span className="block text-xs text-gray-500 mt-0.5">Coordinate care for your household</span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:border-blue-300 transition has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                <input
                  type="radio"
                  name="careIntent"
                  value="hospital"
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">Hospital / Clinic</span>
                  <span className="block text-xs text-gray-500 mt-0.5">Doctor or staff — clinical workflows</span>
                </span>
              </label>
            </fieldset>

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
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="********"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium py-2.5 transition"
            >
              Sign in
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-700 transition">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
