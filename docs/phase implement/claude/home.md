# Home Screen Implementation Report

**Date:** 2026-03-27
**Phase:** Phase C - Home Screen
**Status:** Complete

## What Was Implemented

### New types: `src/types/home.ts`

Home-specific types, separate from `src/types/medication.ts` which is kept for Meds.

```
DosePeriod          — "morning" | "afternoon" | "evening" | "night"
ScheduledDose       — id, medicationName, dosage, instruction, scheduledAt, period, status, takenAt?
NextDoseMedication  — id, name, instruction
NextDoseGroup       — scheduledAt, minutesLate, medications[]
HomeStats           — taken, remaining, missed
HomeData            — userName, stats, missedDoseAlert?, stockWarning?, nextDose?, schedule[], allSetToday
```

### Updated mock: `src/mocks/home.ts`

Rich mock data with:
- Stats: 3 taken / 5 remaining / 1 missed
- Missed dose alert: Paracetamol
- Stock warning: Aspirin 81mg, 3 days left
- Next dose group at 09:00 (10 min overdue): Aspirin 81mg, Vitamin C 500mg, Omega 3
- Schedule: 3 doses across morning and afternoon periods
- `allSetToday: false` — hero card shown by default

### Updated repository: `src/features/home/repository.ts`

Replaced null-returning stub with `getHomeData(): Promise<HomeData>` using mock data. Supabase swap requires only changing the body of this function.

### Screen: `src/app/(tabs)/home.tsx`

Full rewrite. All components are screen-local.

---

## Screen Structure

```
AppScreen
  ├── GreetingHeader       — time-of-day greeting + formatted date
  ├── MissedDoseAlert?     — conditional; red-tinted banner with "Take now" label
  ├── StockWarningBanner?  — conditional; blue-tinted banner with days left
  ├── StatsDashboard       — 3-column row: Taken / Remaining / Missed
  ├── NextDoseHero         — hero card (primary blue); OR AllSetCard when done
  │     ├── status badge   — "X min overdue" or "Up next"
  │     ├── scheduled time — large display text
  │     ├── medication list — name + instruction + pill icon per med
  │     └── SlideToConfirm — PanResponder slider; triggers AllSet on complete
  ├── TodayScheduleSection — grouped by period; DoseRow per dose
  └── PhotoConfirmationStub — visually muted placeholder; "Coming soon" badge
```

---

## Component Notes

### SlideToConfirm

Built with `PanResponder` + `Animated.Value`. No external gesture library needed.

- Thumb: 56px white circle with chevron-right icon
- Track: `rgba(0,0,0,0.15)` full-radius container, `padding: 6`
- Label: "Slide to confirm" centered over track, fades out as thumb advances (interpolated opacity 0→70px)
- Confirm threshold: 75% of max track travel
- On confirm: snap to end → fire `onConfirm()` → spring back to 0 after 250ms
- On release below threshold: spring back immediately
- `trackWidthRef` captures track width from `onLayout` — `getMaxX()` is always called fresh inside responder callbacks to avoid stale closure

### AllSetCard

Replaces the hero when `allSet === true` (local state, set by slider confirm). Shows a centered check circle and calm copy.

### TodayScheduleSection

Groups `ScheduledDose[]` by `DosePeriod`. Renders a period divider row (label + hairline) above each group. Skips empty periods.

**DoseRow states:**
- `taken` — name struck through, dimmed, `✓` icon in primary color
- `missed` — time in error color, detail shows "Missed", faded `×` icon
- `upcoming` — time in primary color, empty ring placeholder

### PhotoConfirmationStub

Low-opacity card at the bottom. Camera icon, "Verify with photo" label, "Coming soon" chip. Reserves the space without being interactive.

---

## Dependencies Added

| Package | Reason |
| --- | --- |
| `@expo/vector-icons@^15.1.1` | MaterialCommunityIcons for pill, check, alert, camera, chevron icons. Already present as a transitive dep via Expo SDK 55 — added as explicit dep for TypeScript resolution. |

---

## What Was Deferred

- Pulling user's real name from auth store (currently from mock `HomeData.userName`)
- Personalization based on onboarding `routineStage` or `reminderPreference`
- "Take now" action on the missed dose alert (label only, no handler)
- Actual stock management navigation from warning banner
- Medication photo verification (stub reserved, not implemented)
- Animation on dose completion (fade/slide-out on mark-as-taken)
- Persistent dose state after slider confirm (resets on screen reload)

Tracked in `docs/TODO_LATER.md`.

---

## Changed Files

| File | Change |
| --- | --- |
| `src/types/home.ts` | Created — home-specific domain types |
| `src/mocks/home.ts` | Replaced — now exports `mockHomeData: HomeData` |
| `src/features/home/repository.ts` | Replaced — `getHomeData()` returns mock |
| `src/app/(tabs)/home.tsx` | Full rewrite — greeting, alerts, dashboard, hero, schedule, photo stub |
| `package.json` | Added `@expo/vector-icons` as explicit dependency |

---

## Completion Status

All required behavior implemented:

- ✓ Greeting header with time-of-day greeting and formatted date
- ✓ Compact stats dashboard (taken / remaining / missed)
- ✓ Missed dose alert surface
- ✓ Stock warning surface
- ✓ Dominant next-dose hero card
- ✓ Large slider-confirm interaction in hero
- ✓ Today schedule section grouped by period
- ✓ "All set today" state (triggered by slider confirmation)
- ✓ Future photo confirmation area reserved
- ✓ TypeScript passes (`pnpm typecheck` clean)
