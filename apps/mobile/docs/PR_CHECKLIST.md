# Mobile PR checklist

Use this as a reviewer/author checklist for changes under `apps/mobile/`.

## Architecture & boundaries

- [ ] Routes under `src/app/**` stay thin (no API calls, no business logic).
- [ ] Feature work is contained to `src/features/<domain>/**` (no new code in legacy `apps/mobile/features/**`).
- [ ] No cross-feature imports unless intentionally promoted to `src/components/`, `src/infrastructure/`, or a shared `@thuocare/*` package.
- [ ] `lib/` stays pure (no React, no device APIs, no network).

## Data & React Query

- [ ] Query keys are namespaced and created via the feature’s `*-keys.ts` helper (no ad-hoc arrays).
- [ ] Mutations invalidate/refetch using the correct key prefix helpers.
- [ ] API modules live in `src/features/<domain>/data/*-api.ts` and are not called directly from UI components.

## Naming & structure

- [ ] Files follow naming conventions (components PascalCase, hooks `useX`, pure helpers kebab-case).
- [ ] New modules are placed in the correct folder (`components/`, `screens/`, `hooks/`, `data/`, `lib/`).

## UX & safety

- [ ] Loading, empty, and error states are handled for user-visible screens.
- [ ] No secrets are added to mobile env files; only `EXPO_PUBLIC_*` values in `.env.local`.
- [ ] Any new external dependency is justified and added at the correct layer (prefer workspace packages where appropriate).

## Verification (pick what applies)

- [ ] `pnpm --filter @thuocare/mobile typecheck`
- [ ] iOS: `pnpm mobile:ios:run` (if native config/plugins changed) or `pnpm dev:mobile` (typical)
- [ ] Android: `pnpm --filter @thuocare/mobile android` (if touched)

