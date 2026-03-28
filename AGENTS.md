# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-27T02:53:32Z  
**Commit:** 7325292  
**Branch:** main

## OVERVIEW

Thuocare is a single Expo mobile app at repository root (`src/`) with a parallel Supabase SQL workspace (`supabase/`). UI currently reads mock repositories; Supabase client is wired but not yet used by feature repositories.

## EXECUTION SOURCE OF TRUTH

Before substantial planning or implementation work, read:

- `README.md`
- `docs/PROJECT_PLAN.md`
- `docs/WORKFLOW.md`

`docs/PROJECT_PLAN.md` is the active source of truth for:

- phased execution
- model routing (`Claude` / `Gemini`)
- prompt intake questions
- working memory and next actions

`docs/WORKFLOW.md` is the execution contract for:

- when to ask at least 5 questions
- when to write specs into `docs/`
- when prompts must be returned directly in chat
- how prompts should be formatted with model + code block

## STRUCTURE

```text
./
├── src/                  # Mobile app (Expo Router + RN Paper + TS strict)
│   ├── app/              # Route entrypoints and tab screens
│   ├── components/       # Shared UI wrappers + loading/error/empty states
│   ├── features/         # Repository adapters (currently mock-backed)
│   ├── lib/              # Env validation + Supabase client
│   ├── mocks/            # Static mock data used by repositories
│   ├── theme/            # React Native Paper theme
│   └── types/            # Shared domain types
├── supabase/             # SQL schema docs, migrations, seeds
│   └── migrations/       # Timestamped ordered SQL migrations
├── ios/                  # Native iOS project (contains generated Pods)
├── CLAUDE.md             # Canonical coding conventions for this repo
├── GEMINI.md             # Supplemental project context
└── package.json          # Scripts + dependency surface
```

## WHERE TO LOOK

| Task                         | Location                                                                 | Notes                                                           |
| ---------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------- |
| Add/modify mobile screen     | `src/app/(tabs)/*.tsx`                                                   | `home`, `meds`, `me` tabs share same loading/error/data pattern |
| Change routing/shell         | `src/app/_layout.tsx`, `src/app/(tabs)/_layout.tsx`, `src/app/index.tsx` | Root wraps with SafeArea + PaperProvider                        |
| Update shared UI primitives  | `src/components/ui/*`                                                    | Prefer wrappers over raw `react-native-paper` in screens        |
| Update data loading behavior | `src/features/*/repository.ts`                                           | Async repository contract returns typed data                    |
| Switch mock to Supabase      | `src/features/*/repository.ts` + `src/lib/supabase/client.ts`            | Keep screen API unchanged                                       |
| Adjust required env vars     | `src/lib/env.ts`                                                         | Throws early on missing Expo public vars                        |
| Update database model/RLS    | `supabase/migrations/*.sql`                                              | Strict ordering by timestamp filename                           |
| Seed local database data     | `supabase/seed.sql`                                                      | Demo patient flow data                                          |

## CODE MAP

| Symbol                | Type          | Location                          | Refs            | Role                                            |
| --------------------- | ------------- | --------------------------------- | --------------- | ----------------------------------------------- |
| `RootLayout`          | component     | `src/app/_layout.tsx`             | router root     | Provides `SafeAreaProvider` + `PaperProvider`   |
| `TabsLayout`          | component     | `src/app/(tabs)/_layout.tsx`      | tab root        | Declares `home` / `meds` / `me` tabs            |
| `IndexScreen`         | component     | `src/app/index.tsx`               | startup route   | Redirects to `/(tabs)/home`                     |
| `HomeScreen`          | component     | `src/app/(tabs)/home.tsx`         | tab screen      | Daily summary screen with retryable load        |
| `MedsScreen`          | component     | `src/app/(tabs)/meds.tsx`         | tab screen      | Medication list with empty/error/loading states |
| `MeScreen`            | component     | `src/app/(tabs)/me.tsx`           | tab screen      | Profile view + backend-mode note                |
| `getHomeDailySummary` | repository fn | `src/features/home/repository.ts` | home tab        | Returns mocked `DailySummary`                   |
| `getMedications`      | repository fn | `src/features/meds/repository.ts` | meds tab        | Returns mocked `Medication[]`                   |
| `getProfile`          | repository fn | `src/features/me/repository.ts`   | me tab          | Returns mocked `UserProfile`                    |
| `getEnvConfig`        | config fn     | `src/lib/env.ts`                  | supabase client | Validates required env vars                     |

## CONVENTIONS

- Keep feature UI and data access separated: screens call repositories, repositories own source selection.
- Screen state machine style is consistent: `loading -> error(with retry) -> data`.
- Use shared wrappers from `src/components/ui/` (`AppScreen`, `AppCard`, `AppText`, `AppButton`) for visual consistency.
- Type definitions are centralized in `src/types/medication.ts`.
- Formatting baseline: double quotes, semicolons, no trailing commas.

## ANTI-PATTERNS (THIS PROJECT)

- Do not call Supabase directly from tab screens; route through feature repositories.
- Do not bypass `getEnvConfig()` when reading env vars for runtime clients.
- Do not introduce raw `react-native-paper` usage in screens when wrapper components exist.
- Do not treat `ios/Pods` and similar generated trees as source-of-truth code during refactors/search.

## UNIQUE STYLES

- “Repository swap” architecture: UI is intentionally decoupled so mock -> Supabase migration is a data-layer-only change.
- Error UI favors explicit retry affordance (`ErrorState` with optional `onRetry`).
- Theme tuning is centralized in `src/theme/paperTheme.ts` (MD3 light variant with project colors).

## COMMANDS

```bash
pnpm start
pnpm ios
pnpm android
pnpm typecheck
pnpm lint
pnpm format
```

## NOTES

- No test runner is configured yet.
- Repository currently contains a large set of non-source files (notably `ios/Pods` and AI tool scaffolding); scope searches to `src/` and `supabase/` for feature work.
- Additional localized guidance lives in `src/AGENTS.md` and `supabase/AGENTS.md`.
