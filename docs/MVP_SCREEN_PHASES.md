# Thuocare MVP Screen Phases

Last updated: 2026-03-28

## Scope Lock

This breakdown is for the MVP only:

- lane: `personal`
- screens: `Home`, `Meds`, `Me`
- platforms: `iPhone` and `Android`
- design direction: `clinical minimal`
- reference: `docs/DESIGN_STYLE.md`

Implementation rule:

- use Expo SDK and Expo Router patterns that feel native on iPhone first
- keep all interactions functional and visually coherent on Android
- do not introduce SQL-dependent UI assumptions

## Phase Strategy

The app should not be built screen-by-screen in isolation. It should be built in shared layers first, then screen-specific waves.

Order:

1. auth and onboarding
2. app shell and design tokens
3. shared states and reusable blocks
4. `Home`
5. `Meds`
6. `Me`
7. prompt library and backend-ready contracts

## Phase 0 - Auth And Onboarding

Goal:

- lock the entry funnel before building tab content

Tasks:

- define `Sign in` features
- define `Sign up` features
- define onboarding form questions
- define redirect rules after auth and after onboarding
- define which steps are local-only for prototype mode

Suggested lead model:

- `Gemini 2.5` for flow and feature selection
- `Claude Sonnet` for Expo Router and local session implementation

Done when:

- the auth funnel is approved in docs
- prompt-ready specs exist for `Gemini` and `Claude`

## Phase A - App Shell Foundation

Goal:

- stabilize the visual system and route shell before deeper screen work

Tasks:

- align theme tokens to `docs/DESIGN_STYLE.md`
- tune tab shell for a calmer clinical-minimal look
- confirm spacing rhythm for iPhone and Android
- define iPhone-first native affordances that degrade cleanly on Android

Suggested lead model:

- `Gemini 3` for UI direction
- `Claude Sonnet` for implementation

Done when:

- the tab shell already feels aligned with the design language
- shared spacing, surface, radius, and typography rules are decided

## Phase B - Shared State And Primitive Layer

Goal:

- create consistent empty, loading, error, and informational blocks

Tasks:

- redesign `LoadingState`
- redesign `EmptyState`
- redesign `ErrorState`
- define a reusable section header pattern
- define a reusable stat pair pattern for value-label displays

Suggested lead model:

- `Gemini 3` for UX/state visuals
- `Claude Sonnet` for reusable component APIs

Done when:

- all MVP screens can compose from shared states instead of one-off placeholders

## Phase C - Home Screen

Intent:

- the daily reassurance surface

### C1 - Home skeleton

Tasks:

- set native screen title instead of page text title
- define scroll structure and section order
- add greeting and day context
- create empty-state version for null summary data

Lead model:

- `Claude Sonnet`

### C2 - Home summary module

Tasks:

- define daily counters card
- define next-dose summary card
- define soft warning surface for missed dose or no data

Lead model:

- `Gemini 3` for information hierarchy
- `Claude Sonnet` for code

### C3 - Home quick actions

Tasks:

- define primary CTA area
- decide which actions exist in MVP
- add iPhone-first affordances only if Expo-native and Android-safe

Examples:

- bottom sheet
- haptics on primary confirmation

Lead model:

- `Gemini 3`

### C4 - Home polish

Tasks:

- apply motion to state changes
- tune spacing and copy
- confirm Android layout parity

Lead model:

- `Claude Sonnet`

## Phase D - Meds Screen

Intent:

- the medication reference and routine management surface

### D1 - Meds list skeleton

Tasks:

- define list layout and scroll rhythm
- define empty-state view for no medications
- set screen title and supporting context

Lead model:

- `Claude Sonnet`

### D2 - Medication tile pattern

Tasks:

- implement the clinical accent-bar medication tile from `DESIGN_STYLE.md`
- decide hierarchy for name, dosage, schedule, and stock
- enforce long-title handling for medication names

Lead model:

- `Gemini 3` for tile hierarchy
- `Claude Sonnet` for code

### D3 - Medication detail readiness

Tasks:

- decide whether MVP needs a detail screen or only a list
- if yes, define a future-safe route and empty data contract
- if not, keep tile affordances non-misleading

Lead model:

- `Gemini 2.5`

### D4 - Meds polish

Tasks:

- confirm list density on smaller Android devices
- refine copy and surface layering
- verify null and empty contracts still feel intentional

Lead model:

- `Claude Sonnet`

## Phase E - Me Screen

Intent:

- the calm identity and settings surface

### E1 - Profile skeleton

Tasks:

- define profile summary card
- define null-state profile placeholder
- set structure for future settings groups

Lead model:

- `Claude Sonnet`

### E2 - Account and preferences blocks

Tasks:

- split into small sections such as identity, notifications placeholder, and backend mode note
- avoid fake settings that imply implemented backend behavior

Lead model:

- `Gemini 2.5`

### E3 - Me polish

Tasks:

- tighten spacing
- ensure copy is calm and not overly technical
- confirm Android and iPhone feel consistent

Lead model:

- `Claude Sonnet`

## Phase F - Backend Readiness Layer

Goal:

- make the MVP UI easy to swap from null data to real repositories later

Tasks:

- define per-screen repository contracts
- define null, empty, success, and error shape expectations
- list fields that are safe to defer until Supabase phase

Suggested lead model:

- `Claude Sonnet`
- escalate to `Claude Opus` for difficult contract design

## Implementation Order

Recommended execution order:

1. Phase 0
2. Phase A
3. Phase B
4. Phase C1 and C2
5. Phase D1 and D2
6. Phase E1 and E2
7. Phase C3, D3, and F
8. Phase C4, D4, and E3

## Model Selection Cheatsheet

Use `Claude Haiku` for:

- tiny checklists
- copy cleanup
- quick task slicing

Use `Claude Sonnet` for:

- actual Expo implementation
- repository-safe refactors
- screen assembly and polish

Use `Claude Opus` for:

- tricky backend contract design
- route and data architecture decisions with long-term consequences

Use `Gemini 2.5` for:

- careful scope decisions
- deciding what not to build in MVP
- prompt drafting from long context

Use `Gemini 3` for:

- screen hierarchy
- component experience
- motion and interaction ideas
- visual problem solving

## Tracking Table

| ID | Work item | Screen | Lead model | Status |
| --- | --- | --- | --- | --- |
| Z-01 | sign-in feature definition | auth | `Gemini 2.5` | done | captured in `docs/phase implement/gemini/sign-in.md` |
| Z-02 | sign-up feature definition | auth | `Gemini 2.5` | done | captured in `docs/phase implement/gemini/sign-up.md` |
| Z-03 | onboarding question flow | onboarding | `Gemini 2.5` | done |
| Z-04 | forgot-password feature definition | auth | `Gemini 2.5` | done | captured in `docs/phase implement/gemini/forgot-password.md` |
| Z-05 | auth-success transition definition | auth | `Gemini 2.5` | done |
| **Z-06** | **sign-in implementation** | **auth** | **`Claude Sonnet`** | **done** |
| **Z-07** | **sign-up implementation (full spec)** | **auth** | **`Claude Sonnet`** | **done** |
| **Z-08** | **onboarding implementation** | **auth** | **`Claude Sonnet`** | **done** |
| **Z-09** | **multi-account storage refactor** | **auth** | **`Claude Sonnet`** | **done** |
| Z-10 | add-medication UX definition | Meds | `Gemini 2.5` | done | captured in `docs/phase implement/gemini/add-medication.md` |
| Z-11 | add-medication implementation | Meds | `Claude Sonnet` | done |
| Z-12 | meds UX definition (list-first + compact dashboard) | Meds | `Gemini 3` | done | captured in `docs/phase implement/gemini/meds.md` |
| **Z-13** | **meds implementation** | **Meds** | **`Claude Sonnet`** | **done** | **compact dashboard + list tiles + low/out-of-stock styling + 1s post-add highlight + mock diversity** |
| A-01 | theme and tab shell alignment | shell | `Claude Sonnet` | pending |
| B-01 | shared state redesign | shared | `Gemini 3` | done | captured in `docs/screen_feature/shared-states.md` |
| **B-02** | **shared state implementation** | **shared** | **`Claude Sonnet`** | **done** | **LoadingState: centered Spinner + fade-in; ErrorState: icon/Typography/Button + Vietnamese defaults; EmptyState: new composed component; Meds + Me updated** |
| **G-01** | **Lab screen** | **—** | **`Claude Sonnet`** | **removed** | **was implemented then removed; see `docs/screen_feature/lab-tab.md`** |
| **C-00** | **home UX and flow definition** | **Home** | **`Gemini 3`** | **done** | **captured in `docs/phase implement/gemini/home.md`** |
| **C-01** | **home implementation** | **Home** | **`Claude Sonnet`** | **done** | **greeting, missed-dose alert, stock warning, stats dashboard, next-dose hero, slider confirm, schedule, photo stub** |
| **C-03** | **Home reminder experience definition** | **Home** | **`Gemini 3`** | **done** | **captured in `docs/screen_feature/home-reminder-experience.md`** |
| **C-04** | **Home reminder experience implementation** | **Home** | **`Claude Sonnet`** | **done** | **PrimaryMedicationCard (note→name→benefit) + always-expanded ReminderSurface; stats hidden while reminder active; SliderConfirm gesture fixed (move-only, dx>dy); scroll-collapse removed to prevent layout jump** |
| C-02 | home polish and animation | Home | `Claude Sonnet` | pending |
| D-01 | meds list skeleton | Meds | `Claude Sonnet` | done |
| D-02 | medication tile pattern | Meds | `Gemini 3` | done |
| E-01 | me skeleton | Me | `Gemini 2.5` | done | captured in `docs/phase implement/gemini/me.md` |
| E-02 | account and preferences blocks | Me | `Gemini 2.5` | done | captured in `docs/phase implement/gemini/me.md` |
| **E-03** | **Me screen implementation** | **Me** | **`Claude Sonnet`** | **done** | **profile summary + account + reminders placeholder + support + sign out** |
| F-01 | repository contract pass | shared | `Claude Sonnet` | pending |

## Notes For Future Prompting

Before generating a prompt for any row above:

1. check whether Expo SDK or package behavior may have changed
2. ask the 4 core prompt questions from `docs/PROJECT_PLAN.md`
3. include the exact screen ID from this file
4. state whether the prompt is for design exploration or implementation
