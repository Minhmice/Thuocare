# Thuocare Project (Code-Inferred)

This document is inferred strictly from non-Markdown source/config/SQL files in this repository.

## Product Overview

Thuocare is an Expo + React Native mobile application for medication adherence, with Supabase as backend for authentication, profile data, medications, reminders persistence, and feedback collection.

From route behavior and repositories, the core user journey is:
- Authenticate (`/sign-in` or `/sign-up`)
- Complete onboarding survey (`/onboarding` -> `/survey`)
- Land in tabbed app (`/(tabs)/home`, `/(tabs)/meds`, `/(tabs)/me`)
- Manage medications and schedule
- Confirm/snooze/skip doses through reminder UI
- Submit app feedback with optional screenshot upload

## Tech Stack

### Mobile / App Runtime

- Expo SDK 55 (`expo`)
- React 19 + React Native 0.83
- Expo Router (file-based routing)
- React Native Paper (UI system)
- React Native Reanimated + Gesture Handler
- Safe area + screens integrations
- Expo modules used in code/config: secure-store, image-picker, haptics, blur, linear-gradient, glass-effect, status-bar, linking, navigation-bar

Key files:
- `package.json`
- `index.js`
- `app.json`
- `src/app/_layout.tsx`

### Backend / Data

- Supabase (`@supabase/supabase-js`)
- Postgres schema managed with SQL migrations in `supabase/migrations/`
- RLS policies across domain tables
- Supabase Storage bucket for feedback screenshots

Key files:
- `src/lib/supabase/client.ts`
- `src/lib/supabase/profileRepository.ts`
- `supabase/migrations/20260329160000_thuocare_core.sql`
- `supabase/migrations/20260426004100_reminder_persistence.sql`
- `supabase/migrations/20260426010000_reminder_persistence_hardening.sql`

### Tooling / Build

- TypeScript strict mode (`tsconfig.json`)
- ESLint flat config (`eslint.config.js`)
- Prettier (`.prettierrc`)
- Babel preset Expo + Reanimated plugin (`babel.config.js`)
- EAS build profiles (`eas.json`)

## App Architecture

### Entrypoints and Provider Composition

- `index.js` imports `react-native-gesture-handler`, `react-native-reanimated`, then `expo-router/entry`.
- `src/app/_layout.tsx` exports `RootLayout` and composes providers:
  - `SafeAreaProvider`
  - `LanguageProvider`
  - `AuthProvider`
  - `PaperProvider`
  - `MedicationsProvider`
  - `Stack` navigator
- `src/app/index.tsx` exports `IndexScreen` that gates navigation by auth status.

### Routing Structure (Expo Router)

Primary route groups/files:
- `src/app/index.tsx` -> `/`
- `src/app/(tabs)/_layout.tsx` -> tabs shell
- `src/app/(tabs)/home.tsx` -> home tab
- `src/app/(tabs)/meds.tsx` -> medications tab
- `src/app/(tabs)/me.tsx` -> account/settings tab
- `src/app/(auth)/_layout.tsx` -> auth stack
- `src/app/(auth)/sign-in.tsx` -> `/sign-in`
- `src/app/(auth)/sign-up.tsx` -> `/sign-up`
- `src/app/(auth)/onboarding.tsx` -> `/onboarding`
- `src/app/(auth)/survey.tsx` -> `/survey`
- `src/app/(auth)/forgot-password.tsx` -> `/forgot-password`
- `src/app/meds/add.tsx` -> `/meds/add`
- `src/app/feedback.tsx` -> `/feedback`
- `src/app/reminder/[doseId].tsx` -> `/reminder/[doseId]` (registered as `fullScreenModal`)

### State, Domain, and Data Layer

Layering is feature-first:
- UI routes under `src/app/`
- Repositories under `src/features/*/repository.ts`
- Shared domain/state under `src/lib/*`
- Type contracts under `src/types/*`

Notable state/data providers and hooks:
- `AuthProvider`, `useAuth` in `src/lib/auth/AuthProvider.tsx`
- `LanguageProvider`, `useLanguage` in `src/lib/i18n/LanguageProvider.tsx`
- `MedicationsProvider`, `useMedicationsData` in `src/lib/meds/MedicationsProvider.tsx`
- `UIProvider`, `useUIState` in `src/lib/ui-context.tsx`

Data access boundary:
- Screens do not directly call Supabase client.
- Repository functions encapsulate remote/local access patterns.

### Auth + Onboarding Flow

Key symbols and files:
- `useAuth`, `signIn`, `signUp`, `signOut`, `completeOnboarding` in `src/lib/auth/AuthProvider.tsx`
- `readOnboardingSurveyDraft`, `writeOnboardingSurveyDraft`, `clearOnboardingSurveyDraft` in `src/lib/auth/onboardingSurveyDraft.ts`
- `mapQ5ToReminderPreference`, `mapQ6ToRoutineStage`, `deriveRoutineSegment` in `src/lib/auth/mapOnboardingSurvey.ts`

Flow behavior:
- Startup route checks auth status in `IndexScreen`.
- New signed-in users are routed to onboarding.
- Survey completion writes onboarding fields to `profiles` and updates auth record state.

### Reminder Architecture

Key symbols and files:
- `formatDoseId`, `parseDoseId` in `src/lib/reminder/doseId.ts`
- `getDoseWindowStatus` in `src/lib/reminder/domain.ts`
- `getReminderDoseVM`, `markDoseTaken`, `snoozeDose10m`, `snoozeDose`, `skipDose` in `src/features/reminder/repository.ts`
- `ReminderExperience` in `src/features/components/composed/reminder-experience/index.tsx`
- `ReminderDoseScreen` in `src/app/reminder/[doseId].tsx`

Behavior:
- Dose state is derived from schedule + time window + local/remote reminder status.
- User actions update local stores and attempt Supabase persistence.

## Key Features and Modules

### 1) Authentication and Profile

Entrypoints:
- `src/app/(auth)/sign-in.tsx`
- `src/app/(auth)/sign-up.tsx`

Core files:
- `src/lib/auth/AuthProvider.tsx`
- `src/lib/supabase/profileRepository.ts`
- `src/lib/auth/storage.ts`

Important symbols:
- `profileRowToStoredRecord`
- `fetchProfileRowWithRetry`
- `StoredAuthRecord`

### 2) Home Dashboard + Daily Summary

Entrypoint:
- `src/app/(tabs)/home.tsx`

Core files:
- `src/features/home/repository.ts` (`getHomeData`)
- `src/lib/meds/computeDailySummary.ts` (`computeDailySummary`)
- `src/lib/reminder/domain.ts`

### 3) Medication Management

Entrypoints:
- `src/app/(tabs)/meds.tsx`
- `src/app/meds/add.tsx`

Core files:
- `src/features/meds/repository.ts`
- `src/lib/meds/localMedsStore.ts`
- `src/lib/meds/MedicationsProvider.tsx`
- `src/types/medication.ts`

Important symbols:
- `getMedications`
- `getMedicationsMerged`
- `upsertMedicationRemote`
- `deleteMedicationRemote`
- `upsertLocalMedication`

### 4) Reminder Execution

Entrypoints:
- `src/app/reminder/[doseId].tsx`
- `src/app/(tabs)/home.tsx` (embedded reminder experience)

Core files:
- `src/features/reminder/repository.ts`
- `src/lib/reminder/localReminderStore.ts`
- `src/lib/reminder/vm.ts`
- `src/lib/reminder/useMinuteTicker.ts`

### 5) Account and Preferences

Entrypoint:
- `src/app/(tabs)/me.tsx`

Core files:
- `src/features/me/repository.ts` (`getProfile`)
- `src/lib/i18n/LanguageProvider.tsx`
- `src/lib/i18n/storage.ts`

### 6) Feedback

Entrypoint:
- `src/app/feedback.tsx`

Core file:
- `src/features/feedback/repository.ts` (`submitAppFeedback`)

Backend relation:
- Persists metadata in `public.app_feedback`
- Upload path tied to storage bucket `feedback-screenshots`

## Runtime Environment and Configuration

Required runtime keys (validated by `getEnvConfig` in `src/lib/env.ts`):
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Other runtime-relevant config:
- `app.json`:
  - iOS bundle identifier: `com.minhmice.thuocare`
  - Android package: `com.minhmice.thuocare`
  - Plugins: `expo-router`, `expo-secure-store`, `expo-navigation-bar`, `expo-font`, `expo-image-picker`
  - `extra.eas.projectId` present
- `eas.json`:
  - `development` (internal + development client)
  - `preview` (internal)
  - `production` (autoIncrement enabled)

## Supabase Database Schema Overview (from SQL migrations)

Migration files:
- `supabase/migrations/20260329160000_thuocare_core.sql`
- `supabase/migrations/20260329170500_handle_new_user_phone_metadata.sql`
- `supabase/migrations/20260329180000_support_requests.sql`
- `supabase/migrations/20260329182000_app_feedback_and_storage.sql`
- `supabase/migrations/20260426004100_reminder_persistence.sql`
- `supabase/migrations/20260426010000_reminder_persistence_hardening.sql`

### Core Tables

- `public.profiles`
  - PK/FK: `user_id` -> `auth.users(id)`
  - User metadata + onboarding fields (`onboarding_survey`, `reminder_preference`, `routine_stage`, `routine_segment`)
- `public.medications`
  - User-scoped medications and schedule fields
  - FK `user_id` -> `public.profiles(user_id)`
- `public.app_feedback`
  - User feedback submission records with rating/category/problem text/screenshot path/source

### Reminder Persistence Tables

- `public.user_meal_settings`
  - Per-user meal anchor times + timezone
- `public.dose_occurrences`
  - Per-user scheduled dose instance with status lifecycle (`pending/taken/snoozed/skipped/missed`)
  - Includes `window_start_at`, `window_end_at`, and hardening-added `updated_at`
  - Uniqueness on `(user_id, scheduled_date, scheduled_at)`
- `public.dose_events`
  - Event log linked to `dose_occurrences` via composite FK `(occurrence_id, user_id)`
  - Event types include `taken/snoozed/skipped/missed`
  - Partial unique indexes enforce idempotency for `taken` and `skipped` per occurrence

### Functions and Triggers

- Functions:
  - `public.handle_new_user()`
  - `public.set_updated_at()`
- Triggers:
  - `on_auth_user_created` on `auth.users` -> `public.handle_new_user()`
  - `user_meal_settings_set_updated_at` on `public.user_meal_settings`
  - `dose_occurrences_set_updated_at` on `public.dose_occurrences`

### RLS and Security Posture

RLS enabled on major application tables:
- `profiles`
- `medications`
- `app_feedback`
- `user_meal_settings`
- `dose_occurrences`
- `dose_events`

Policy pattern is user-owned data (`auth.uid() = user_id`) for select/insert/update/delete depending on table.

Storage integration:
- Bucket `feedback-screenshots` exists
- Policies on `storage.objects` for authenticated user-owned upload/read paths

## Build and Run Commands (from scripts)

- `pnpm start` -> `expo start`
- `pnpm start:clear` -> `expo start --clear`
- `pnpm android` -> `expo run:android`
- `pnpm ios` -> `expo run:ios`
- `pnpm typecheck` -> `tsc --noEmit`
- `pnpm lint` -> `eslint . --ext .js,.ts,.tsx`
- `pnpm format` -> `prettier --write .`

## Risks and Unknowns

- No test script or test config exists in `package.json`; automated regression safety is unclear.
- `ios/` and `android/` are gitignored in `.gitignore`; repository does not include committed native project code, so native customizations cannot be fully audited from git-tracked source.
- Reminder persistence paths in app code handle missing-table cases gracefully; this implies deployments may run with partial schema state, which can hide migration drift.
- Route `src/app/reminder/[doseId].tsx` is registered in root stack, but navigation wiring into this route is not obvious from route-level call sites (home uses embedded reminder component pattern).
- Home data logic exists both in screen-level composition and `src/features/home/repository.ts` (`getHomeData`), creating potential duplication/drift risk.
- Since analysis explicitly ignored in-file comments and all Markdown docs, intent-level context and product decisions outside executable/config/SQL code are intentionally excluded.
