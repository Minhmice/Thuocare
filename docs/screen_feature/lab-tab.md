# Lab tab (removed)

The **Lab** tab was a dev-only UI review surface (`src/app/(tabs)/lab.tsx`). It has been **removed** from the app (tab route, custom tab bar entry, and i18n keys).

## Why keep this file

- **Planning rows** in `docs/PROJECT_PLAN.md` / `docs/MVP_SCREEN_PHASES.md` still reference this spec for history.
- If you need a component gallery again, prefer **Storybook**, a **feature flag**, or a **separate dev build** instead of a shipping tab.

## Former behavior (archival)

Previously: long-scroll screen grouping primitives → wrappers → composed components, with optional toast previews and inline toggles. The tab was hidden in production builds via `tabBarButton` / `__DEV__` before removal.
