# Codebase Structure

**Analysis Date:** 2026-04-26

## Directory Layout

```text
Thuocare/
├── src/                          # Expo Router app (TypeScript)
│   ├── app/                      # Route entrypoints + layouts (Expo Router)
│   │   ├── _layout.tsx            # Root providers + Stack (declares reminder modal)
│   │   ├── index.tsx              # Auth gate redirects
│   │   ├── (auth)/                # Auth routes (Stack)
│   │   ├── (tabs)/                # Main tabs (home/meds/me), tab bar hidden
│   │   ├── meds/                  # Nested meds routes (e.g. add/edit)
│   │   ├── reminder/[doseId].tsx  # Dose reminder modal route
│   │   └── feedback.tsx           # Feedback route (image picker + submit)
│   ├── components/                # Shared UI primitives
│   │   ├── state/                 # LoadingState / ErrorState / EmptyState
│   │   ├── ui/                    # App* wrappers around Paper/RN primitives
│   │   └── auth/                  # Auth-specific reusable UI
│   ├── features/                  # Feature boundaries
│   │   ├── */repository.ts        # Feature data access boundary (Supabase/local)
│   │   └── components/            # Composed feature UI (e.g. reminder experience)
│   ├── lib/                       # Cross-cutting runtime logic
│   │   ├── env.ts                 # Env validation (Supabase URL/anon key)
│   │   ├── auth/                  # Auth provider + helpers (Supabase Auth)
│   │   ├── i18n/                  # Language provider + SecureStore persistence
│   │   ├── meds/                  # Medications provider + local overrides + summary logic
│   │   ├── reminder/              # Reminder domain/time/vm + local reminder state
│   │   └── supabase/              # Supabase client + auth storage + profile helpers
│   ├── mocks/                     # Mock fixtures (fallbacks)
│   ├── theme/                     # React Native Paper theme
│   └── types/                     # Shared domain types
├── supabase/                      # Supabase SQL workspace
│   └── migrations/                # Timestamped schema/RLS/trigger migrations
├── app.json                       # Expo config (plugins, typed routes, ids)
├── eas.json                       # EAS build profiles
├── tsconfig.json                  # TS strict config
├── eslint.config.js               # ESLint flat config
├── .prettierrc                    # Formatting rules
├── babel.config.js                # Expo preset + reanimated plugin
├── index.js                       # Expo Router entry
└── package.json                   # Dependencies + scripts
```

## Directory Purposes

**`src/app/`:**
- Purpose: Router-visible screens/layouts.
- Key entrypoints:
  - `src/app/_layout.tsx` (providers + Stack screen config)
  - `src/app/index.tsx` (auth gate redirects)
  - `src/app/(tabs)/_layout.tsx` (tabs declared, tab bar hidden)
  - `src/app/reminder/[doseId].tsx` (dose reminder modal)

**`src/features/`:**
- Purpose: Feature boundary layer; repositories define the screen-facing API.
- Repository pattern: `src/features/<feature>/repository.ts`
  - Examples: `src/features/meds/repository.ts`, `src/features/reminder/repository.ts`, `src/features/feedback/repository.ts`, `src/features/me/repository.ts`

**`src/lib/`:**
- Purpose: Cross-feature building blocks (providers, domain logic, storage adapters, runtime clients).
- Supabase client wiring: `src/lib/supabase/client.ts`
- Env validation: `src/lib/env.ts`

**`supabase/migrations/`:**
- Purpose: Authoritative DB schema/RLS used by `@supabase/supabase-js`.
- Key migrations:
  - Core profiles+medications+trigger: `supabase/migrations/20260329160000_thuocare_core.sql`
  - Feedback + Storage bucket: `supabase/migrations/20260329182000_app_feedback_and_storage.sql`
  - Reminder persistence: `supabase/migrations/20260426004100_reminder_persistence.sql`, `supabase/migrations/20260426010000_reminder_persistence_hardening.sql`

## Naming Conventions

**Routes:**
- Layout files: `_layout.tsx` (e.g. `src/app/_layout.tsx`, `src/app/(tabs)/_layout.tsx`)
- Dynamic routes: `[param].tsx` (e.g. `src/app/reminder/[doseId].tsx`)
- Route groups: `(tabs)`, `(auth)` folders.

**Data access:**
- Repositories: `src/features/<feature>/repository.ts`
- Supabase adapters/helpers: `src/lib/supabase/*.ts`

## Where to Add New Code

**New screen/route:**
- Add a route file under `src/app/` (or a group like `src/app/(tabs)/`), then wire navigation via Expo Router conventions.

**New feature API (data/mutations):**
- Add to `src/features/<feature>/repository.ts`; keep Supabase calls inside repositories or `src/lib/supabase/*`, not in screens.

**New shared domain logic:**
- Add under `src/lib/<domain>/` (e.g. reminder time/status logic under `src/lib/reminder/`).

**New shared UI primitive:**
- Add wrapper components to `src/components/ui/` and state components to `src/components/state/`.

**New database changes:**
- Add a timestamped SQL migration under `supabase/migrations/`.

## Special Directories

**`ios/` (present in repo):**
- Purpose: Native iOS project for `expo run:ios`.
- Notes: Treated as generated/native output; app source of truth remains `src/`.

---

*Structure analysis: 2026-04-26*
