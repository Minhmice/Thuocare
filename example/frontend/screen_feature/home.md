# Home (Today) Screen Feature Spec

Last updated: 2026-03-28

## Purpose

`Home` is the primary post-onboarding destination: **today’s medication routine** in one glance.

It complements `Meds` (inventory-style list) with **time-oriented** content: what to take now / later today.

## Locked decisions (MVP)

- After onboarding completion → success transition → **Home**.
- Show **selected day** (horizontal date strip or equivalent).
- Primary section: **doses to take** for that day (or empty state).
- Secondary: compact **summary** (e.g. taken vs remaining, optional alerts) — same *spirit* as compact summary on `Meds`, not a duplicate of the full meds list.
- Entry to **add medication** remains obvious (FAB or top action) but deep add flow stays on `add-medication` route.
- **Notifications** bell may navigate to `notifications` list (mock).

## Required UI blocks

1. Header: greeting, avatar placeholder, notifications entry.
2. Month / day selector for the visible schedule.
3. Section title for “To take” (or localized equivalent) + optional batch context (e.g. morning).
4. Dose cards: name, strength, schedule hint, actions (e.g. mark taken, snooze) — mock only.
5. Bottom navigation: Home, Meds, Me (or product-equivalent tabs).
6. Empty state when `data` is null / list empty: calm copy + CTA to add med or browse Meds.

## Data expectations (API shape — mock returns null / [])

- `getDailySummary(date)` → `null` in mock.
- `getScheduleForDate(date)` → `[]` in mock.

## Deferred

- Real push notifications, swipe gestures, adherence analytics.
- Multi-caregiver views.

## Acceptance criteria

- User lands here after onboarding path.
- Day context is visible.
- List or empty state is clear with **null/empty backend**.
- Navigation to Meds / Me / Add med is available in the prototype.
