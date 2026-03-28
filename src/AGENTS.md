# SRC KNOWLEDGE BASE

## OVERVIEW

`src/` is the Expo app surface: Router entrypoints, screen state handling, UI wrappers, feature repositories, and runtime client wiring.

## STRUCTURE

```text
src/
├── app/                  # Expo Router routes/layouts
│   └── (tabs)/           # home / meds / me tab screens
├── components/
│   ├── state/            # LoadingState / ErrorState / EmptyState
│   └── ui/               # AppScreen / AppCard / AppText / AppButton wrappers
├── features/             # Feature repositories (home, meds, me)
├── lib/                  # env.ts + supabase/client.ts
├── mocks/                # Mock data fixtures for repositories
├── theme/                # React Native Paper MD3 theme
└── types/                # Shared domain model types
```

## WHERE TO LOOK

| Task                              | Location                                 | Notes                                                           |
| --------------------------------- | ---------------------------------------- | --------------------------------------------------------------- |
| Add/modify tab content            | `app/(tabs)/*.tsx`                       | Follow existing `useCallback(load)` + `useEffect` fetch pattern |
| Change tab registration           | `app/(tabs)/_layout.tsx`                 | Keep tab names stable (`home`, `meds`, `me`)                    |
| Change app providers/theme        | `app/_layout.tsx`, `theme/paperTheme.ts` | Root should keep SafeArea + Paper provider composition          |
| Add reusable visual primitive     | `components/ui/*`                        | Build wrappers first, then consume in screens                   |
| Add loading/error/empty UX states | `components/state/*`                     | Reuse existing state cards/buttons                              |
| Replace mock data source          | `features/*/repository.ts`               | Keep function signatures compatible with current screen calls   |
| Add environment config            | `lib/env.ts`                             | Required vars must throw early with clear message               |
| Use backend runtime client        | `lib/supabase/client.ts`                 | Read config via `getEnvConfig()` only                           |

## CONVENTIONS

- Screen flow pattern is strict: load async data, branch by `loading`, `error`, then render data state.
- `load` functions are memoized with `useCallback` and retried through `ErrorState`.
- Tab screens use shared wrappers (`AppScreen`, `AppCard`, `AppText`, `AppButton`) instead of raw Paper components.
- Repositories return typed promises and remain UI-agnostic.
- Shared domain types stay centralized in `types/medication.ts`.

## ANTI-PATTERNS

- Do not call `supabase` from screens/components; repositories own data access.
- Do not read `process.env.*` directly outside `lib/env.ts`.
- Do not bypass state components (`LoadingState`, `ErrorState`, `EmptyState`) with ad-hoc inline placeholders.
- Do not duplicate domain type declarations inside feature modules.

## QUICK CHECKLIST (WHEN EDITING SRC)

- Does the screen still handle `loading -> error -> data` cleanly?
- Did repository API remain stable for callers?
- Are shared wrappers reused instead of introducing new one-off UI primitives?
- If backend wiring changed, did env validation remain the single source of truth?
