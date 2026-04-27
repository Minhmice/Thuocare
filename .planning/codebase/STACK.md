# Technology Stack

**Analysis Date:** 2026-04-26

## Languages

**Primary:**
- TypeScript (strict) - app source in `src/**` (`tsconfig.json`)

**Secondary:**
- JavaScript - tooling/config (`babel.config.js`, `eslint.config.js`)
- SQL (Postgres) - Supabase migrations (`supabase/migrations/*.sql`)

## Runtime

**Environment:**
- Expo SDK 55 - runtime + bundling (`package.json`)
- React 19.2.0 + React Native 0.83.6 - UI runtime (`package.json`)

**Package Manager:**
- pnpm (workspace uses `pnpm start`; lockfile expected at `pnpm-lock.yaml`)

## Frameworks

**Core:**
- Expo Router `^55.0.13` - file-based routing (`src/app/_layout.tsx`, `src/app/(tabs)/_layout.tsx`, `src/app/index.tsx`)
- React Native Paper `^5.14.5` - MD3 component system + theming (`src/app/_layout.tsx`, `src/theme/paperTheme.ts`)

**Backend Client:**
- Supabase JS `^2.57.4` - Auth + PostgREST + Storage (`src/lib/supabase/client.ts`)

**Build/Dev:**
- Expo CLI - dev server (`package.json` scripts)
- Expo Dev Client `~55.0.28` - internal dev builds (`package.json`, `eas.json`)
- Babel preset: `babel-preset-expo` + Reanimated plugin (`babel.config.js`)
- EAS Build profiles (`eas.json`)

**Testing:**
- Not detected (no Jest/Vitest config present; no test scripts in `package.json`)

## Key Dependencies

**Critical:**
- `expo` `^55.0.17` - SDK/runtime (`package.json`)
- `expo-router` `^55.0.13` - routing (`src/app/**`)
- `react-native-paper` `^5.14.5` - UI system (`src/theme/paperTheme.ts`)
- `@supabase/supabase-js` `^2.57.4` - backend integration (`src/lib/supabase/client.ts`)

**Device capabilities (Expo modules):**
- `expo-secure-store` `~55.0.13` - secure persistence (Supabase auth + app state) (`src/lib/supabase/authStorage.ts`, `src/lib/i18n/storage.ts`, `src/lib/auth/onboardingSurveyDraft.ts`)
- `expo-image-picker` `^55.0.19` - feedback screenshot selection (`src/app/feedback.tsx`)
- `expo-linking` `~55.0.14` - deep links for password reset redirect (`src/components/auth/ForgotPasswordModal.tsx`)
- `react-native-gesture-handler` `~2.30.0` - root gesture wrapper (`src/app/_layout.tsx`)
- `react-native-reanimated` `4.2.1` - enabled via Babel plugin (`babel.config.js`)

## Configuration

**Environment:**
- Required Expo public env vars are validated in `src/lib/env.ts`:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**Build / App config:**
- Expo config: `app.json`
  - `experiments.typedRoutes: true`
  - Plugins: `expo-router`, `expo-secure-store`, `expo-navigation-bar`, `expo-font`, `expo-image-picker`
- TypeScript: `tsconfig.json` (extends `expo/tsconfig.base`, strict)
- ESLint flat config: `eslint.config.js`
- Prettier: `.prettierrc`

## Platform Requirements

**Development:**
- EAS CLI constraint `>= 18.4.0` (`eas.json`)
- Typecheck: `pnpm typecheck` (tsc no-emit) (`package.json`)

**Production:**
- iOS bundle identifier + Android package: `app.json`
- Supabase backend must match schema in `supabase/migrations/*.sql`

---

*Stack analysis: 2026-04-26*
