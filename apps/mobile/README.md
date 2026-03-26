# Thuocare Mobile

This README is the implementation guide for `apps/mobile`.

Use it when adding new screens, moving routes, or deciding where code should live.

If the question is “where should this file go?” or “which layer owns this logic?”, this is the first document to read.

## Current state (post UI reset)

The product UI was reset to a **minimal shell**: auth routes, native tab layout, and **placeholder tab screens** while the stack was moved to **Expo SDK 55**, **NativeWind v5 (preview)**, and **Tailwind CSS v4** (`react-native-css`). Feature folders such as `home`, `meds`, `people`, and `me` pages are **not** present yet; rebuild them under `src/features/` as you implement flows.

## Styling and bundling

- Global styles: [`global.css`](./global.css) (Tailwind layers + `@import "nativewind/theme"` + design tokens).
- Types: [`nativewind-env.d.ts`](./nativewind-env.d.ts) references `react-native-css/types` (NativeWind v5).
- **Monorepo:** the root `package.json` pins `lightningcss` to `1.30.1` so Metro can compile `global.css` reliably.

**Stale Metro cache** after upgrading from NativeWind v4 may surface errors like `react-native-css-interop/jsx-runtime` missing. Use `pnpm run start:clear` (or `npx expo start --go --clear`) from this directory, or delete `.expo` here and reinstall from the repo root.

## Installing Expo-native dependencies (pnpm monorepo)

Running `npx expo install …` from the **repo root** fails with `ERR_PNPM_ADDING_TO_ROOT`. From the monorepo root run:

```bash
pnpm run expo:install -- <package>
```

(or `pnpm --dir apps/mobile exec expo install <package>`). See **Expo packages (mobile, pnpm workspace)** in the root [README.md](../../README.md).

## Product model in mobile

Mobile follows the product rule:

- every authenticated user has a personal experience
- default tabs are `Home / Meds / Me`
- elevated roles also get `People`
- navigation is capability-based, not lane-first

This means:

- we do not build separate top-level mobile apps for personal, family, and hospital
- we build shared feature surfaces, then vary content through capability and context

## Read these docs together

- [Root README.md](../../README.md): product model, monorepo commands, Expo / NativeWind notes
- [docs/EXPO_SDK_REFERENCE.md](./docs/EXPO_SDK_REFERENCE.md): full Expo SDK / Router / third-party index, agent discovery, wrapper pattern
- [docs/CONVENTIONS.md](./docs/CONVENTIONS.md): naming, dependency, and structural rules
- [docs/DESIGN.md](./docs/DESIGN.md): visual system and UI composition rules

## Target architecture (reference)

The sections below describe **where code should go** as features are rebuilt. They are not an inventory of every file that exists today.

## Source structure

```text
src/
  app/        # Expo Router routes only
  core/       # app-wide wiring and navigation contracts
  shared/     # cross-feature reusable modules
  features/   # function-first feature ownership
```

### `src/app`

Purpose:

- Expo Router files
- route groups
- layouts
- route-to-feature entrypoint wiring

Rules:

- keep route files dumb
- no direct Supabase calls
- no raw feature business logic
- no lane-first branching in route files

If a route file is doing real screen work, the code is in the wrong place.

### `src/core`

Purpose:

- auth/session restore
- query provider wiring
- Supabase client wiring
- capability resolution
- active care context resolution

Current important modules:

- `src/core/access`
- `src/core/auth`
- `src/core/query`
- `src/core/supabase`

Use `core` for app-wide contracts, not screen-specific logic. (A dedicated `core/context` for active-care scope can be reintroduced when multi-person flows return.)

### `src/shared`

Purpose:

- reusable modules shared across multiple features

Subfolders:

- `ui/` reusable UI primitives
- `form/` shared inputs/editors
- `feedback/` empty, loading, error, placeholder surfaces
- `lib/` pure helpers
- `theme/`, `constants/`, `types/` app-wide support modules

Move code here only when it is truly cross-feature.

### `src/features`

Purpose:

- function-first ownership of user-facing product surfaces

Primary feature ownership:

- `home/`
- `meds/`
- `people/`
- `me/`

Add feature folders such as `home/`, `meds/`, `people/`, and `me/` under `src/features/` as you implement them.

## Route model

### Primary tabs

`src/app/(tabs)`

- `index.tsx` → Home tab (placeholder until `features/home` exists)
- `meds.tsx` → Meds tab (placeholder)
- `people.tsx` → People tab (placeholder)
- `me.tsx` → Me tab (placeholder)

Rules:

- Tab visibility (e.g. **People**) is driven by `src/core/access` — today this is a **stub** until lane/capability data is wired again.
- Tab route files should stay thin: import a screen from `src/features/...`.

### Nested stacks (to add with features)

When you rebuild flows, add route groups such as `(meds)`, `(people)`, and `(me)` under `src/app/` for stacks beyond tabs, and register them in `src/app/_layout.tsx`.

`src/app/(auth)` today:

- sign-in, sign-up, resolve-account, unsupported

## How to place code

### Route-level UI

Use this shape:

```text
features/<feature>/
  pages/
    <page>/
      screen.tsx
      sections/
      hooks/
```

Meaning:

- `screen.tsx`: route-level composition entry
- `sections/`: blocks used only by that page
- `hooks/`: page-specific composition hooks

### Feature-shared UI

If multiple pages inside the same feature reuse the same UI, place it in:

```text
features/<feature>/components/
```

Examples:

- shared `home` dashboard sections
- shared `meds` medication tiles
- shared `people` person summary cards

### Feature data ownership

If the module owns fetching, mutation, query keys, or API shaping, place it in:

```text
features/<feature>/data/
```

Rules:

- feature pages should consume hooks/modules from `data`
- do not put raw query setup inside route files
- query keys should be owned near the data domain

### Pure logic

If the module is pure, reusable logic without React or I/O:

```text
features/<feature>/lib/
shared/lib/
```

Use `feature/lib` if only one feature needs it.
Use `shared/lib` if multiple features need it.

## Ownership rules

### `Home`

Owns:

- dashboard composition
- today summaries
- care-priority hero blocks
- high-level alerts

Does not own:

- medication CRUD internals
- profile/settings
- people management workflows

### `Meds`

Owns:

- medication list
- medication detail
- medication create/edit form
- history
- prescriptions
- refill UI
- safety-related medication workflows

### `People`

Owns:

- managed people list
- person detail
- coordination surfaces
- managed-person medication context

### `Me`

Owns:

- profile
- settings
- privacy/consent
- account-level preferences

## Capability and context model

This app is not lane-first anymore.

### Capabilities

Navigation and guarded surfaces are decided only in:

- `src/core/access/useCapabilities.ts`
- `src/core/access/resolve-visible-tabs.ts`
- `src/core/access/resolve-default-entry.ts`

Use capability checks for:

- whether `People` exists
- whether management surfaces are shown
- whether clinical-only actions are enabled

Do not put these checks ad-hoc across route files.

### Active care context (future)

When multi-person flows return, centralize “whose care is active” in a small `core` module (for example a revived `useActiveCareContext`) instead of scattering `personId` checks across features.

## Dependency rules

Allowed direction:

- `src/app/*` -> `src/features/*`, `src/core/*`, `src/shared/*`
- `features/<feature>/pages/*` -> `sections/*`, `components/*`, `hooks/*`, `data/*`, `lib/*`
- `features/<feature>/hooks/*` -> `data/*`, `lib/*`, `shared/*`
- `features/<feature>/data/*` -> `src/core/*`, packages, shared types

Avoid:

- route files importing old lane-specific screens directly unless it is a temporary migration bridge
- feature pages calling Supabase directly
- cross-feature imports when the code should be moved to `shared`

## Practical coding rules

### 1. Keep route files dumb

Bad:

- loading data in `src/app/(tabs)/index.tsx`
- deciding role/lane logic in a route file

Good:

- route imports a page entry from `features/home/pages/dashboard/screen`

### 2. One page, one entrypoint

Every real screen should have one obvious owner.

If someone asks “where is the meds detail screen?”, the answer should be one clear page folder, not three wrappers.

### 3. Split by reuse honestly

Move something to `shared` only if it is truly cross-feature.

Do not create pass-through wrappers like:

- `features/x/components/Button.tsx` that only re-export from `shared/ui`

Those add search noise and make ownership worse.

### 4. Prefer migration adapters over duplicate products

If old `personal/` code still powers a flow, wrap or adapt it while moving toward `home / meds / people / me`.

Do not build a second competing version of the same screen unless replacement is immediate.

### 5. Move UI ownership before data ownership when needed

If a migration is large:

1. move route ownership first
2. preserve working data hooks temporarily
3. move data modules later

This reduces breakage.

## UI implementation rules

Use [docs/DESIGN.md](./docs/DESIGN.md) when building screens.

High-level rules:

- prefer tonal layering over borders
- use spacing to separate content
- use `Plus Jakarta Sans` for hero moments and major headings
- use `Inter` for body and labels
- keep `Home` editorial and calm
- avoid cramped dashboard patterns

If a screen looks like a generic admin panel, it is off-direction.

## Adding a new screen

Example: add a new Meds page.

1. Create page folder:

```text
src/features/meds/pages/<page>/screen.tsx
```

2. Add page-local sections if needed:

```text
src/features/meds/pages/<page>/sections/
```

3. Put fetching/mutations in:

```text
src/features/meds/data/
```

4. Add Expo Router entrypoint in:

```text
src/app/(meds)/...
```

5. If screen visibility depends on permissions, route that through `src/core/access`, not through ad-hoc page logic.

## When to create `shared` code

Move code to `shared` only if at least one of these is true:

- used by multiple primary features
- clearly generic enough to survive feature changes
- not coupled to a specific product domain

Examples:

- generic button
- empty state shell
- date field
- time editor used in multiple areas

Do not move feature-specific cards, summaries, or domain terms into `shared`.

## Local development

### Environment variables

Create `apps/mobile/.env.local` with:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Never place server secrets in the mobile app.

### Commands

| Goal | From repo root | From `apps/mobile` |
|------|----------------|--------------------|
| Dev server only | `pnpm dev:mobile` | `pnpm start` |
| Dev server + clear Metro cache | — | `pnpm run start:clear` |
| Open iOS Simulator | `pnpm --filter @thuocare/mobile ios` | `pnpm ios` |
| Native iOS rebuild | `pnpm mobile:ios:run` | `pnpm ios:run` |
| Android | `pnpm --filter @thuocare/mobile android` | `pnpm android` |
| Web | `pnpm --filter @thuocare/mobile web` | `pnpm web` |
| Typecheck | `pnpm --filter @thuocare/mobile typecheck` | `pnpm typecheck` |

Use native rebuild commands only when native config changed.

## Review checklist before merging

- Does the route file stay dumb?
- Is page ownership obvious?
- Is logic in `core`, `shared`, or `feature` at the correct level?
- Are navigation checks going through `core/access`?
- Is active data scope using a single `core` contract (when multi-person context exists)?
- Did we avoid adding new lane-first route ownership?
- Does the UI follow `DESIGN.md`?
- Did we remove any temporary wrapper we no longer need?

## Short version

If you need the shortest possible rule set:

- `app` routes only
- `core` for app-wide contracts
- `shared` for true cross-feature reuse
- `features/home|meds|people|me` for product ownership
- capabilities decide visibility
- context decides whose care is active
- pages own screens
- sections own page-only blocks
- design follows `DESIGN.md`
