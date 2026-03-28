# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm start          # Start Expo dev server
pnpm ios            # Run on iOS simulator
pnpm android        # Run on Android emulator

# Quality
pnpm typecheck      # TypeScript check (tsc --noEmit)
pnpm lint           # ESLint (flat config, eslint-config-expo)
pnpm format         # Prettier
```

No test runner is configured yet.

## Stack

- **React Native + Expo SDK 55** with Expo Router (file-based routing)
- **React Native Paper** (Material Design 3) for all UI components
- **Supabase JS** client for backend (currently wired but unused — all data is mocked)
- **TypeScript strict mode** throughout

## Architecture

### Routing

`src/app/` uses Expo Router. The entry `index.tsx` redirects to `/(tabs)/home`. The root layout wraps everything in `SafeAreaProvider` + React Native Paper's `PaperProvider` with the custom theme from `src/theme/paperTheme.ts`.

### Feature Pattern

Each feature lives in `src/features/{feature}/repository.ts` and exports async functions returning mock data via `Promise.resolve()`. The intent is to swap these for Supabase queries in the next phase without touching the UI layer.

```
src/features/
  home/repository.ts    → getHomeDailySummary()
  meds/repository.ts    → getMedications()
  me/repository.ts      → getProfile()
```

Screen components call repository functions via `useCallback` + `useEffect`, managing three states: `loading → error (with retry) → data`. The state components are in `src/components/state/`.

### UI Components

Thin wrappers around React Native Paper live in `src/components/ui/`:
- `AppScreen` — ScrollView/View container
- `AppCard` — Card wrapper
- `AppText` — Text wrapper
- `AppButton` — Button wrapper

Use these rather than raw RN Paper components to keep styling consistent.

### Types

All shared types are in `src/types/medication.ts`: `Medication`, `DailySummary`, `UserProfile`.

### Environment Variables

Two Expo public vars are required (validated in `src/lib/env.ts`):
```
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
```

The Supabase client is initialized at `src/lib/supabase/client.ts` but not yet called from any repository.

## Code Style

Prettier config (`.prettierrc`): double quotes, semicolons, no trailing commas.

ESLint ignores: `node_modules`, `.expo`, `dist`, `.agents`, `.cursor`.
