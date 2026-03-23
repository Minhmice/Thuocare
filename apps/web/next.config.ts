import path from "node:path";
import dotenv from "dotenv";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// Monorepo: Next only auto-loads `.env*` from `apps/web`. We also load the repo
// root (e.g. root `.env.local`) and overlay `apps/web` so either location works.
//
// Note: `@next/env` caches after the first `loadEnvConfig` call, so a second call
// for `apps/web` was a no-op. Use `dotenv` for the app overlay.
//
// Use `process.cwd()` (the app package dir when running `pnpm dev:web`) so paths
// stay correct; `import.meta.url` for this file can resolve incorrectly when Next
// evaluates the config.
const appDir = process.cwd();
const monorepoRoot = path.resolve(appDir, "..", "..");
const isDev = process.env.NODE_ENV !== "production";

loadEnvConfig(monorepoRoot, isDev);

const appEnvOverlay = isDev
  ? [".env", ".env.development", ".env.local", ".env.development.local"]
  : [".env", ".env.production", ".env.local", ".env.production.local"];
for (const name of appEnvOverlay) {
  dotenv.config({
    path: path.join(appDir, name),
    override: true,
    quiet: true,
  });
}

// Ensure Proxy (Edge) and Turbopack see public env after the merge above.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const nextConfig: NextConfig = {
  ...(supabaseUrl || supabaseAnonKey
    ? {
        env: {
          ...(supabaseUrl ? { NEXT_PUBLIC_SUPABASE_URL: supabaseUrl } : {}),
          ...(supabaseAnonKey
            ? { NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey }
            : {}),
        },
      }
    : {}),
  transpilePackages: [
    // These are source-only packages with no .js extension issues
    "@thuocare/ui-web",
    "@thuocare/utils",
    "@thuocare/types",
    "@thuocare/validation",
    "@thuocare/supabase",
  ],
};

export default nextConfig;
