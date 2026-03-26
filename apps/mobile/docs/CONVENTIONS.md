# Mobile app conventions

This document defines naming, folder layout, and dependency boundaries for `apps/mobile`.

## Goals

- keep Expo Router route files dumb
- organize mobile around functions, not lane-specific top-level UI silos
- centralize navigation gating in one place
- make screen ownership obvious so features are easy to find and fix

## Source model

### `src/app/`

Purpose: Expo Router routes and layouts only.

Allowed:

- feature page entrypoints
- `src/core/**` providers and navigation contracts
- `src/shared/**` helpers and reusable UI

Not allowed:

- direct Supabase calls
- raw `useQuery` or `useMutation`
- business logic beyond light route param handling

### `src/core/`

Purpose: app-wide wiring and navigation contracts.

Use it for:

- auth/session restore
- query provider setup
- Supabase client setup
- capability resolution
- active care context resolution

Rules:

- `src/app/**` should decide tab visibility and default entry only through `src/core/access`
- lane detection is an adapter input, not a route-layer dependency

### `src/shared/`

Purpose: cross-feature reusable modules.

Subfolders:

- `ui/` - reusable UI primitives
- `form/` - reusable field controls
- `feedback/` - loading, empty, placeholder, error-style shells
- `lib/` - pure helpers
- `theme/`, `constants/`, `types/` - app-wide support modules

### `src/features/<feature>/`

Function-first vertical slices:

- `home/`
- `meds/`
- `people/`
- `me/`

Compatibility slices may still exist during migration, but new route ownership should live in the function-first features above.

## Page structure

Use this structure for route-level UI:

```text
features/<feature>/
  pages/
    <page>/
      screen.tsx
      sections/
      hooks/
```

Rules:

- `screen.tsx` is the route-level composition entry
- `sections/` is for blocks used by only one page
- `components/` is for UI reused by multiple pages in the same feature
- `data/` is for API modules, React Query hooks, and query keys
- `lib/` is for pure helpers only

If a page grows past roughly 150-200 lines, split sections or hooks out of it.

## Naming

- Components: `PascalCase.tsx`
- Route page entrypoints: `pages/<page>/screen.tsx`
- Page-local blocks: `sections/PascalCase.tsx`
- Hooks: `useSomething.ts`
- Pure helpers: `kebab-case.ts`
- Data modules: `something-api.ts`, `something-keys.ts`, `use-something.ts`

Prefer named exports outside Expo Router route modules.

## Dependency rules

Allowed direction:

- `src/app/*` -> `src/features/*`, `src/core/*`, `src/shared/*`
- `features/<feature>/pages/*` -> `sections/*`, `components/*`, `hooks/*`, `data/*`, `lib/*`
- `features/<feature>/hooks/*` -> `data/*`, `lib/*`, `shared/*`
- `features/<feature>/data/*` -> `src/core/*`, shared types, workspace packages
- `features/<feature>/lib/*` -> no React, no device APIs, no network

Disallowed:

- feature pages calling Supabase directly
- tab layout or route files reading lane state directly
- direct cross-feature imports when the code belongs in `shared/**` or a shared package

## Navigation rules

- default tabs are `Home / Meds / Me`
- `People` is additive and controlled through `src/core/access`
- route files should not contain lane checks
- use `ActiveCareContext` to represent whose care data is active

## React Query rules

- each data domain owns its keys
- invalidate via key helpers, not ad-hoc arrays
- prefer moving UI ownership before moving data ownership when doing incremental refactors

## Cleanup expectations

- remove pure re-export wrappers once the real owner exists
- delete obsolete route trees after new paths are wired
- do not keep two competing navigation models alive in parallel
