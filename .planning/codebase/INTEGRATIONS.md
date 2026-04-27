# External Integrations

**Analysis Date:** 2026-04-26

## APIs & External Services

**Backend-as-a-service:**
- Supabase - database + auth + storage
  - SDK/Client: `@supabase/supabase-js` (`package.json`)
  - Client wiring: `src/lib/supabase/client.ts`
  - Auth flows: `src/lib/auth/AuthProvider.tsx`
  - Env config: `src/lib/env.ts`

**Device/OS services (Expo modules):**
- Secure storage (key/value) - `expo-secure-store`
  - Used for Supabase auth persistence: `src/lib/supabase/authStorage.ts`
  - Used for language persistence: `src/lib/i18n/storage.ts`
- Media library access - `expo-image-picker`
  - Used for feedback screenshots: `src/app/feedback.tsx`
- Haptics - `expo-haptics`
  - Used in medication wizard: `src/app/meds/add.tsx`

## Data Storage

**Databases:**
- Postgres (via Supabase REST/PostgREST under `supabase-js`)
  - Client: `@supabase/supabase-js` (`src/lib/supabase/client.ts`)
  - Tables observed in migrations:
    - `public.profiles` + signup trigger `public.handle_new_user()` (`supabase/migrations/20260329160000_thuocare_core.sql`)
    - `public.medications` (`supabase/migrations/20260329160000_thuocare_core.sql`)
    - `public.app_feedback` (`supabase/migrations/20260329182000_app_feedback_and_storage.sql`)
    - `public.user_meal_settings`, `public.dose_occurrences`, `public.dose_events` (`supabase/migrations/20260426004100_reminder_persistence.sql`)
  - RLS: enabled and per-user policies for these tables (same migrations as above)

**File Storage:**
- Supabase Storage bucket `feedback-screenshots`
  - Bucket provisioning + RLS policies: `supabase/migrations/20260329182000_app_feedback_and_storage.sql`
  - Upload usage: `supabase.storage.from("feedback-screenshots").upload(...)` in `src/features/feedback/repository.ts`

**Caching:**
- In-memory module-level cache (non-persistent)
  - `cachedRemoteMedications` in `src/features/meds/repository.ts`

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (email/password sign-in & sign-up)
  - `supabase.auth.signInWithPassword(...)`: `src/lib/auth/AuthProvider.tsx`
  - `supabase.auth.signUp(...)`: `src/lib/auth/AuthProvider.tsx`
  - Session hydration + auth state subscription: `src/lib/auth/AuthProvider.tsx`

**Session persistence:**
- Custom storage adapter (web: `localStorage` with memory fallback; native: `expo-secure-store` with chunking)
  - Implementation: `src/lib/supabase/authStorage.ts`

## Monitoring & Observability

**Error Tracking:**
- Not detected (no Sentry/Bugsnag/etc usage found in scanned files)

**Logs:**
- Development-only console warning path present (`console.warn`) in `src/lib/auth/AuthProvider.tsx`

## CI/CD & Deployment

**Hosting:**
- Not detected from scanned files (mobile app uses EAS builds; no server hosting config found)

**CI Pipeline:**
- Not detected (no GitHub Actions / CI config reviewed in this scan)

**Build profiles:**
- EAS Build profiles: `eas.json`

## Environment Configuration

**Required env vars:**
- `EXPO_PUBLIC_SUPABASE_URL` (`src/lib/env.ts`)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` (`src/lib/env.ts`)

**Secrets location:**
- Not determined from scanned files (env values not inspected by constraint)

## Webhooks & Callbacks

**Incoming:**
- Not detected

**Outgoing:**
- Not detected

---

*Integration audit: 2026-04-26*
# External Integrations

**Analysis Date:** 2026-04-26

## APIs & External Services

**Backend (DB + Auth + Storage):**
- Supabase
  - SDK/Client: `@supabase/supabase-js` (`src/lib/supabase/client.ts`)
  - Auth: `supabase.auth.*` used in `src/lib/auth/AuthProvider.tsx` and `src/components/auth/ForgotPasswordModal.tsx`
  - PostgREST: repositories call `supabase.from("<table>")...` (e.g. `src/features/meds/repository.ts`, `src/features/me/repository.ts`, `src/lib/supabase/profileRepository.ts`)
  - Storage: feedback screenshots uploaded via `supabase.storage` (`src/features/feedback/repository.ts`)

## Data Storage

**Databases:**
- Supabase Postgres (schema owned by SQL migrations in `supabase/migrations/*.sql`)
  - Profiles + medications: `supabase/migrations/20260329160000_thuocare_core.sql`
  - Feedback + Storage bucket/policies: `supabase/migrations/20260329182000_app_feedback_and_storage.sql`
  - Reminder persistence tables (dose occurrences/events, meal settings): `supabase/migrations/20260426004100_reminder_persistence.sql` and `supabase/migrations/20260426010000_reminder_persistence_hardening.sql`
  - Connection/env: validated at runtime by `src/lib/env.ts`
    - `EXPO_PUBLIC_SUPABASE_URL`
    - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**File Storage:**
- Supabase Storage bucket `feedback-screenshots`
  - Bucket + RLS policies: `supabase/migrations/20260329182000_app_feedback_and_storage.sql`
  - Client usage: `src/features/feedback/repository.ts` (uploads then inserts `public.app_feedback`)

**Local device persistence:**
- Expo Secure Store (`expo-secure-store`)
  - Supabase auth session storage: `src/lib/supabase/authStorage.ts`
  - Language preference: `src/lib/i18n/storage.ts`
  - Onboarding survey draft: `src/lib/auth/onboardingSurveyDraft.ts`

**Caching:**
- In-memory remote snapshot cache for meds list:
  - `cachedRemoteMedications` in `src/features/meds/repository.ts`
  - Merge logic: `mergeMedications()` in `src/features/meds/repository.ts`

## Authentication & Identity

**Auth Provider:**
- Supabase Auth
  - Session hydration + auth state subscription: `src/lib/auth/AuthProvider.tsx`
  - “current user id” helper: `src/lib/supabase/queryUser.ts`
  - Sign-up trigger creates `public.profiles` row: `public.handle_new_user()` + trigger in `supabase/migrations/20260329160000_thuocare_core.sql`
  - Password reset email: `supabase.auth.resetPasswordForEmail()` in `src/components/auth/ForgotPasswordModal.tsx` with deep link `Linking.createURL("/sign-in")`

## Monitoring & Observability

**Error Tracking:**
- Not detected (no Sentry/Datadog/etc imports in `src/**`)

**Logs:**
- Ad-hoc: `console.warn` used in dev-only auth paths (`src/lib/auth/AuthProvider.tsx`)

## CI/CD & Deployment

**Mobile builds:**
- Expo Application Services (EAS)
  - Build config: `eas.json` (development client, preview, production profiles)
  - App config: `app.json` (bundle identifiers, plugins)

**CI Pipeline:**
- Not detected in this scan (no workflow files mapped here)

## Environment Configuration

**Required env vars:**
- `EXPO_PUBLIC_SUPABASE_URL` (`src/lib/env.ts`)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` (`src/lib/env.ts`)

**Secrets location:**
- `.env` file present at repo root (contents not inspected)

## Webhooks & Callbacks

**Incoming:**
- Not detected (no server routes/edge functions in repo)

**Outgoing:**
- Not detected (no third-party webhooks)

## Notifications / Reminder Scheduling

**Push/local notifications:**
- Not detected. No `expo-notifications` dependency in `package.json` and no notification scheduling code in `src/**`.

**Reminder persistence (server-side):**
- Supabase tables exist for dose occurrence/event persistence, but the client reminder UX is still in-app and time-driven:
  - Persistence schema: `supabase/migrations/20260426004100_reminder_persistence.sql`
  - Client reminder interactions + best-effort persistence: `src/features/reminder/repository.ts`

---

*Integration audit: 2026-04-26*
