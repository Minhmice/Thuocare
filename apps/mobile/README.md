# Thuocare Mobile

Expo Router mobile app for patient accounts.

## Required environment variables

Create `apps/mobile/.env.local` with:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Do not add server secrets (for example `SUPABASE_SERVICE_ROLE_KEY`) to mobile env files.

## Start the app

**Do not run `npx expo start` from the monorepo root** (`Thuocare/`): the root `package.json` is not the Expo app (wrong `main` / Metro project). Use `pnpm dev:mobile` / `pnpm expo:start`, or `cd apps/mobile && npx expo start`.  
(EAS / `expo install` are OK from the repo root: root `app.config.js` forwards `apps/mobile/app.json`.)

From repo root:

- `pnpm dev:mobile` or `pnpm expo:start`
- `pnpm --filter @thuocare/mobile start`
- `pnpm --filter @thuocare/mobile android`
- `pnpm --filter @thuocare/mobile ios`
- `pnpm --filter @thuocare/mobile web`

Or from `apps/mobile`:

- `pnpm start`

## iOS: Expo Go says “requires a newer version”

Store **Expo Go** can lag behind **SDK 55**. Use a **development build** (your own client) instead of Expo Go.

From **repo root** (after `pnpm dlx eas-cli login` if needed):

1. **First time only** — run **interactively** so EAS can create iOS credentials (non-interactive builds fail until this is done):

   ```bash
   pnpm eas:ios:dev
   ```

   Answer the prompts (Apple Developer / distribution certificate / provisioning).

2. Later you can use CI with `EXPO_TOKEN` once credentials exist on Expo.

`eas.json` lives at the monorepo root; `expo-dev-client` is installed in this package.

## Test auth and routing behavior

### 1) Sign in

1. Open app to `/(auth)/sign-in`.
2. Enter valid patient email/password and submit.
3. Verify redirect to `/(tabs)` and `Actor:` is not `unresolved` on tab one.

### 2) Sign out

1. Tap `Sign Out` from tab one (or auth fallback screens).
2. Verify session clears and app returns to `/(auth)/sign-in`.

### 3) Session restore

1. Sign in, then close app fully.
2. Reopen app.
3. Verify temporary "Restoring secure session..." state.
4. Verify route outcome:
   - Valid patient actor -> `/(tabs)`
   - Actor unresolved/error -> `/(auth)/resolve-account`
   - Staff actor -> `/(auth)/unsupported`
   - No session -> `/(auth)/sign-in`

## Troubleshooting

- Missing env vars:
  - Error like `Missing required env var EXPO_PUBLIC_SUPABASE_URL` or `...ANON_KEY`.
  - Fix `apps/mobile/.env.local`, then restart Expo.
- Broken session:
  - Symptoms: repeated redirect to sign-in, session not restoring.
  - Sign out, fully restart app, sign in again.
- Actor unresolved:
  - App lands on `/(auth)/resolve-account`.
  - Tap `Retry Actor Resolve` after completing onboarding/binding on web, or `Sign Out` and re-authenticate.

## Phase 5 refill — manual QA (cache + contracts)

React Query keys for refill lists are always `refillQueryKeys.requests(patientId)` (see `apps/mobile/lib/refill/refill-keys.ts`). Pull-to-refresh on prescription detail invalidates `refillQueryKeys.requestsPrefix`.

1. **Create request** — Open a prescription with valid `treatment_episode_id`, submit refill; list / section should update without stale `refill-requests` key.
2. **Duplicate pending** — Submit twice for same prescription while a pending request exists; expect `RefillError` code `duplicate_pending_request` and the Vietnamese duplicate alert (not generic error).
3. **Cancel** — If UI exposes cancel via `useCancelRefillRequest`, after cancel the same query keys should refetch (requests + near-depletion prefix for patient).
4. **Pull-to-refresh** — On prescription detail, pull refresh; prescription detail and refill section should stay coherent (shared invalidation prefix).
