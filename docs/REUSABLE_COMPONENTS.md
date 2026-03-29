# Thuocare Reusable Components Plan

Last updated: 2026-03-28

## Purpose

This file defines the reusable component layer that should be extracted before more screen implementation is expanded.

The goal is:

- reduce one-off screen code
- keep `Home`, `Meds`, and `Me` visually aligned
- make prompt writing more precise for future agent work

This file is planning-only.

Actual source should live under:

- `src/features/components/ui`
- `src/features/components/wrapper`
- `src/features/components/composed`

Current locked rules:

- `ui` = base primitives
- `wrapper` = app-themed wrappers with one folder per component
- `composed` = multi-primitive app components, to be decided in smaller batches later
- colocated `README.md` files should use English

## Component Strategy

Do not split components too early into tiny fragments.

Prefer extracting components only when they are:

- reused in more than one screen
- structurally meaningful
- helping both UI consistency and implementation speed

Also:

- start with a small batch first
- do not scaffold the full catalog at once
- wrapper components may expose the same conceptual names as their primitive bases when that keeps adoption simple

## Source Architecture

Preferred source shape:

```text
src/features/components/
  ui/
    button/
      index.tsx
      types.ts
      styles.ts
      README.md
  wrapper/
    button/
      index.tsx
      types.ts
      styles.ts
      README.md
  composed/
    medication-tile/
      index.tsx
      types.ts
      styles.ts
      README.md
```

Notes:

- `types.ts` and `styles.ts` are optional when the component stays simple
- `composed` should stay smaller and may later reuse the candidates below

## First Reusable Component Set

These are the first candidates that should exist as shared building blocks:

### 1. `ScreenHeader`

Use for:

- greeting + date
- title + supporting context
- optional compact right-side status chip

Expected reuse:

- Home
- Meds
- Me

### 2. `SummaryStatsRow`

Use for:

- compact 3-metric dashboard row

Expected reuse:

- Home
- Meds

Rules:

- compact
- small visual footprint
- not hero-sized

### 3. `AlertBanner`

Use for:

- missed dose
- stock warning
- future lightweight system notices

Expected reuse:

- Home
- Meds

### 4. `PrimaryHeroCard`

Use for:

- next-dose hero on Home

This may start screen-specific, but should be designed so its internal pieces can later be extracted.

### 5. `SliderConfirm`

Use for:

- the big confirm action on Home
- future confirm flows if needed

Rules:

- strong primary action
- large touch target
- calm but obvious motion

### 6. `MedicationTile`

Use for:

- Meds list
- future Home medication rows if structure converges

Expected fields:

- name
- dosage
- schedule
- stock state
- badge support

### 7. `SettingsSection`

Use for:

- grouped settings rows in Me

Expected reuse:

- Me
- future notification settings

### 8. `SupportSection`

Use for:

- support/help entry block

Expected reuse:

- Me
- future legal/help surfaces if needed

## Things That Should Stay Screen-Specific For Now

Do not force these into shared components yet:

- Home next-dose hero as a full card
- Add Medication multi-step layout
- Auth success transition
- Forgot Password modal body

These may become reusable later, but not yet.

## Prompt Notes For Later

When writing future implementation prompts:

- explicitly say which parts should become reusable components
- do not say only “refactor into components”
- name the component targets directly
- prefer shared components only when they reduce duplication across `Home`, `Meds`, and `Me`

## MVP Component Priorities

Priority order:

1. `ScreenHeader`
2. `SummaryStatsRow`
3. `AlertBanner`
4. `MedicationTile`
5. `SettingsSection`
6. `SliderConfirm`
7. `LoadingState`
8. `EmptyState`
9. `ErrorState`

## Deferred Work

These should stay later:

- fully generic form-step framework
- fully generic bottom-sheet system
- full notification settings component system
- component theming overhaul beyond what MVP needs
- deciding the exact first `composed` batch before primitive and wrapper reuse is clearer
