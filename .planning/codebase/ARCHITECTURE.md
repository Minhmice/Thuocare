# Architecture

**Analysis Date:** 2026-04-26

## Pattern Overview

**Overall:** Expo Router mobile app with provider-composed app shell and repository boundary. Screens/providers call `src/features/*/repository.ts` and `src/lib/*` modules; repositories use Supabase (`src/lib/supabase/*`) plus local override stores (`src/lib/**`) to keep UI responsive.

**Key Characteristics:**
- File-based routing under `src/app/**` (typed routes enabled via `app.json`).
- Root providers in `src/app/_layout.tsx`: auth, language/i18n, Paper theme, medications context.
- Reminder UX is a full-screen modal route `src/app/reminder/[doseId].tsx` with VM derived from reminder domain helpers (`src/lib/reminder/*`).

## Layers

**Router / Navigation:**
- Purpose: Route structure, layouts, redirects.
- Location: `src/app/`
- Key files:
  - Root stack + providers: `src/app/_layout.tsx`
  - Tabs layout (hidden tab bar): `src/app/(tabs)/_layout.tsx`
  - Auth stack: `src/app/(auth)/_layout.tsx`
  - Auth gate redirects: `src/app/index.tsx`

**Providers / App Shell:**
- Purpose: Global contexts and theming.
- Location: `src/app/_layout.tsx`
- Providers:
  - `src/lib/auth/AuthProvider.tsx` (Supabase session → app auth state)
  - `src/lib/i18n/LanguageProvider.tsx` (in-app translations)
  - `src/lib/meds/MedicationsProvider.tsx` (remote+local merged medications data)
  - Paper theme: `src/theme/paperTheme.ts`

**Screens (UI orchestration):**
- Purpose: Compose UI, manage view state machine, call repositories.
- Location: `src/app/(tabs)/*.tsx`, `src/app/(auth)/*.tsx`, `src/app/feedback.tsx`, `src/app/reminder/[doseId].tsx`
- Shared state primitives: `src/components/state/LoadingState.tsx`, `src/components/state/ErrorState.tsx`, `src/components/state/EmptyState.tsx`

**Feature repositories (data access boundary):**
- Purpose: Typed async reads/mutations; own mapping/merge and Supabase/local selection.
- Location: `src/features/*/repository.ts`
- Examples: `src/features/meds/repository.ts`, `src/features/me/repository.ts`, `src/features/reminder/repository.ts`, `src/features/feedback/repository.ts`

**Supabase adapters:**
- Purpose: Client setup + auth storage + shared queries/mappers.
- Location: `src/lib/supabase/*`
- Key files: `src/lib/supabase/client.ts`, `src/lib/supabase/authStorage.ts`, `src/lib/supabase/queryUser.ts`, `src/lib/supabase/profileRepository.ts`

**Database schema:**
- Purpose: Postgres tables/RLS/triggers used by the app.
- Location: `supabase/migrations/*.sql`
- Key migrations:
  - Core profiles + medications + signup trigger: `supabase/migrations/20260329160000_thuocare_core.sql`
  - Feedback + Storage bucket: `supabase/migrations/20260329182000_app_feedback_and_storage.sql`
  - Reminder persistence: `supabase/migrations/20260426004100_reminder_persistence.sql` and `supabase/migrations/20260426010000_reminder_persistence_hardening.sql`

## Data Flow

**Boot + auth gating:**
1. `src/app/_layout.tsx` mounts providers and root Stack.
2. `src/lib/auth/AuthProvider.tsx` hydrates session (`supabase.auth.getSession()`) and subscribes to auth changes (`supabase.auth.onAuthStateChange`).
3. `src/app/index.tsx` redirects to `/sign-in`, `/onboarding`, or `/(tabs)/home`.

**Medications data (remote + local merge):**
1. Provider calls `getMedications()` (`src/lib/meds/MedicationsProvider.tsx` → `src/features/meds/repository.ts`).
2. Repository fetches remote `public.medications` rows for current `user_id` (`src/features/meds/repository.ts` + `src/lib/supabase/queryUser.ts`).
3. Repository merges remote snapshot with local overrides (`src/lib/meds/localMedsStore.ts`) in `mergeMedications()` and caches the last remote list in-memory (`cachedRemoteMedications`).

**Reminder dose route (doseId modal):**
1. Root stack declares modal presentation for `reminder/[doseId]` (`src/app/_layout.tsx`).
2. Screen `src/app/reminder/[doseId].tsx` loads VM via `getReminderDoseVM()` (`src/features/reminder/repository.ts`) using:
   - `parseDoseId()` (`src/lib/reminder/doseId.ts`)
   - time helpers in `src/lib/reminder/time.ts`
   - status calculation `getDoseWindowStatus()` (`src/lib/reminder/domain.ts`)
   - label/tone mapping (`src/lib/reminder/vm.ts`)
3. User actions call repository mutations `markDoseTaken` / `snoozeDose` / `skipDose` (`src/features/reminder/repository.ts`), which update local stores and best-effort persist to Supabase reminder tables.

**Feedback submission:**
1. Screen collects form state in `src/app/feedback.tsx`.
2. Repository uploads screenshot to Supabase Storage bucket `feedback-screenshots` then inserts `public.app_feedback` (`src/features/feedback/repository.ts`).

## Error Handling

**Strategy:** Repository functions throw `Error`; screens/providers render `ErrorState` with retry.

**Patterns:**
- Reminder VM load uses a local state machine with retry: `src/app/reminder/[doseId].tsx`.
- Provider-level refresh/retry: `src/lib/meds/MedicationsProvider.tsx`.
- Supabase query errors commonly mapped as `throw new Error(error.message)` in repositories (`src/features/meds/repository.ts`, `src/lib/supabase/profileRepository.ts`).

## Cross-Cutting Concerns

**Logging:** Minimal; dev-only `console.warn` branch in `src/lib/auth/AuthProvider.tsx`.
**Validation:** Runtime env validation in `src/lib/env.ts`.
**Authentication:** Supabase Auth session + RLS policies in migrations (`src/lib/auth/AuthProvider.tsx`, `supabase/migrations/*.sql`).

---

*Architecture analysis: 2026-04-26*
