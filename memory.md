# Thuocare Memory

Last updated: 2026-03-26

This file is a handoff note for future agents. It captures the current product understanding, what was recently completed, what is still incomplete, and the constraints that should guide the next implementation round.

## Product Direction

- Thuocare is a three-lane medication platform: `personal`, `family`, and `hospital`.
- `README.md` is the product source of truth.
- The product should think in care lanes first, not in `patient vs doctor` first.
- Personal lane must let a user start without a doctor, clinic, or prescription.
- Family lane is a first-class entry lane, not a hospital sub-flow.
- Hospital lane keeps the clinical workflow: prescribing, refill, follow-up, and staff/doctor governance.
- Intent-first onboarding is a core product rule.

## Current User Constraints

- Bugs and regressions must be fixed when found.
- Current implementation priority is `personal lane`.
- Mobile first.
- No inventory / stock / remaining supply work for the current phase.
- SQL changes, if needed, should be limited to user-owned personal-lane paths.

## Repository Map

- `apps/web`: Next.js web app. Handles login, signup, onboarding, patient/family launchpads, and doctor-facing routes.
- `apps/mobile`: Expo app. This is the main app for the current personal-lane work.
- `apps/desktop`: Tauri + React shell. Not a current workflow priority.
- `packages/auth`: actor resolution, onboarding logic, auth helpers, actor context building.
- `packages/personal`: personal-lane domain, repository, service, and view-model layer.
- `packages/adherence`, `packages/prescription`, `packages/refill`, `packages/doctor-workspace`, `packages/appointments`, `packages/notification`: hospital and shared workflow packages.
- `supabase/migrations`: canonical SQL migrations plus a split reference layer for easier reading.

## What Was Completed Recently

### Phase 1b workflow realignment

The previous agent completed a strong Phase 1b pass that moved the app toward the README model.

- Web onboarding now treats `personal` and `family` as self-serve intents instead of forcing hospital-first wording.
- `apps/web/app/onboarding/actions.ts` now includes `bootstrapSelfServeAccountAction`, which:
  - tries `claimPatientAccount` first,
  - then falls back to the `bootstrap_self_serve_account` RPC,
  - redirects personal users to `/patient` and family users to `/family`.
- `apps/web/app/onboarding/page.tsx` now has lane-specific copy for self-serve setup and removes clinic-first messaging from the main personal/family path.
- `apps/web/app/patient/page.tsx` is no longer just a placeholder. It now behaves like a lane-aware launch surface:
  - personal lane is detected through `personal_profile`,
  - hospital-linked patients still use patient actor logic.
- `apps/web/app/family/page.tsx` is no longer a pure placeholder and now detects `family_profile`.
- `apps/web/app/login/page.tsx` and `apps/web/app/signup/page.tsx` were upgraded to lane-oriented intent cards with clearer copy.
- `apps/mobile/app/(auth)/sign-in.tsx` and `apps/mobile/app/(auth)/resolve-account.tsx` were softened from patient-only wording to lane-neutral wording.
- `apps/mobile/app/(tabs)/index.tsx` is now lane-aware:
  - `personal` -> `PersonalHomeScreen`
  - `family` -> `FamilyHomeScreen`
  - everything else -> `HospitalHomeScreen`

### SQL readability work

I added a read-only split layer for migrations so the schema can be read by table without editing the canonical migration flow.

- Canonical source-of-truth migrations:
  - `supabase/migrations/20260324000000_all_in_one_consolidated.sql`
  - `supabase/migrations/20260324110000_phase_10_three_lane_foundation.sql`
  - `supabase/migrations/20260325000000_phase_11_personal_lane_tables.sql`
  - `supabase/migrations/20260325010000_phase_12_personal_lane_bootstrap.sql`
- Split table reference was added under `supabase/migrations/tables/`.
- Current split count: 43 table-level files.
- `supabase/migrations/README.md` was updated to explain:
  - canonical vs split files,
  - how to read the schema quickly,
  - the rule that canonical migrations remain the execution source of truth.

### Personal lane refinement pass (completed, ~2026-03-26)

Goal: move personal lane from “complete enough” to **trustworthy for daily use** (Vietnamese UI, mobile-first). Implementation followed README/memory constraints; **no** inventory, fake catalog search, or fake push infra.

**Package `@thuocare/personal`**

- `getPersonalMedicationAdherenceSnippet`: adherence summary + recent log lines for **one medication** over a **14-day** window (repo query by `personal_medication_id` + date range). Exported from package index.

**Mobile IA (personal users)**

- Tabs: **Hôm nay / Thuốc / Lịch sử / Tôi**; prescriptions/appointments hidden for personal lane (hospital/family paths unchanged where applicable).

**Today (`PersonalHomeScreen`)**

- Summary, next dose, attention buckets, timeline by time-of-day when helpful.
- **Late / custom time logging:** modal to set `actualTakenTime` (HH:MM, same calendar day); primary button “Đã uống (giờ hiện tại)” for fast path.
- **Adjust taken time:** confirm → reset log → reopen time modal (no clinical audit layer).
- Link **“Chi tiết thuốc ›”** on dose cards → medication detail route.

**Medication detail (`MedicationDetailScreen`)**

- Management hub: **edit**, **pause/resume**, **stop** (with confirm); status explanation block; **next dose today** from timeline; **14-day snippet** + recent events; shortcut to **Hôm nay**.

**Medications tab**

- Search by display name; section counts / empty states; cards show **next dose hint** (active), **paused** / **end date** context; sorting uses `localeCompare(..., "vi")` where added.

**Add / Edit medication**

- Shared mobile-friendly routine UI: `TimeSlotsEditor`, `IsoDateField`, `RoutinePreviewBox`, `scheduleFromRoutineState` in `build-personal-schedule.ts` (presets + custom times + DOW + interval; live preview).

**Me (`PersonalMeScreen`)**

- Editable **preferred name**, **timezone (IANA)**, **language code** via `updatePersonalProfileSettings` + `useUpdatePersonalProfile`; honest copy about in-app reminders (no fake push toggles).

**Web companion**

- `apps/web/app/patient/page.tsx` copy aligned: describes mobile capabilities (late logging, med detail hub, profile edit, search) and states web is secondary.

**Orchestration note**

- Further code changes in this area were delegated per `.cursor/agents/orchestrator/SKILL.md` (frontend-developer specialist); host verified `pnpm typecheck` / `pnpm build`.

## Current Phase 2 State

Phase 2 personal-lane **mobile surface is now much closer to coherent**; some **cross-lane / auth** risks below remain.

### Personal-lane package status

`packages/personal` contains:

- `personal_profile`, `personal_medication`, `personal_adherence_log` modeled and wired.
- Medication: list (incl. all statuses), add, update (incl. pause), stop, get-by-id.
- Timeline: daily + range, mark taken (optional `actualTakenTime`), skipped, **reset** mistaken log, **medication adherence snippet** for detail screen.
- No inventory/stock (still in scope).

### Mobile personal-lane status (high level)

- History tab: **personal lane** uses `PersonalHistoryTabScreen` + personal timeline range (default **14 days**, filters); hospital lane still uses hospital adherence where applicable (`history.tsx` is lane-aware).
- Personal stack: add / edit / medication `[id]` routes under `app/(personal)/`.
- Hooks under `apps/mobile/lib/personal/` include profile update, med snippet, mark/reset dose with query invalidation for snippet keys where needed.

### What is still incomplete or out of scope

- **Catalog-backed medication search** is still not a runtime personal feature (by product choice).
- **Family / hospital** depth and placeholder cleanup remain **not** the current personal-lane priority.
- **Known risks** (bootstrap fallback, actor resolution, family route leak, org-code escape hatch) — see below — still apply until fixed.

## Important SQL State

Phase 12 SQL now exists in the worktree:

- `supabase/migrations/20260325010000_phase_12_personal_lane_bootstrap.sql`

This migration does two important things:

- Makes `patient.organization_id` nullable.
- Adds `public.bootstrap_self_serve_account(p_care_lane text)` for `personal` and `family`.

The function creates:

- a `patient` row with `organization_id = null`,
- a `personal_profile` or `family_profile`,
- all in one transaction.

The migration also explicitly documents a required TypeScript follow-up:

- actor resolution must treat `patient_id IS NOT NULL` as enough to become a patient actor for self-serve lanes,
- not only `patient_id && organization_id`.

## Known Findings And Risks

These issues were identified during review and should remain visible until explicitly fixed.

### 1. Self-serve bootstrap fallback is too broad

`apps/web/app/onboarding/actions.ts` currently falls back to `bootstrap_self_serve_account` after any failed `claimPatientAccount` attempt.

Risk:

- `claimPatientAccount` does not distinguish “no matching patient row” from other failure types such as conflicts or already-linked states.
- Once the RPC is deployed, the fallback can create the wrong account path after a non-bootstrapable failure.

Related area:

- `packages/auth/src/onboarding/onboarding-state.ts`

### 2. Personal self-serve actor resolution is still inconsistent

The system still contains actor-resolution logic that assumes a patient must have an organization.

Known examples:

- `packages/auth/src/actor/actor-resolver.ts`
- `apps/mobile/features/auth/useActor.ts`

Risk:

- A self-serve personal user may stay effectively “unresolved” in places that still require `organization_id !== null`.
- This blocks a clean end-to-end personal-lane actor path.

### 3. Onboarding escape hatch is currently dead

`apps/web/app/onboarding/page.tsx` includes a “Use organization code instead” path for pre-linked users, but the hidden form currently only submits `careIntent` and does not provide `organizationCode`.

Risk:

- The CTA promises a flow that cannot actually work as written.

### 4. Family route guard leaks hospital patient actors

`apps/web/app/family/page.tsx` currently treats `isPatientActor(actor)` as enough to stay on the page even without a `family_profile`.

Risk:

- Hospital patient actor can leak into the family route even when the family lane has not been established.

### 5. Personal history on mobile — updated

For **`lane === "personal"`**, `history.tsx` routes to **`PersonalHistoryTabScreen`** (personal timeline range, filters, stats). The risk above applies mainly if **lane detection fails** or a user is misclassified — then hospital history could still show. Worth keeping an eye on `useLaneDetection` / actor consistency with §2.

## Current Checks

Verified on **2026-03-26** from the current worktree:

- `pnpm typecheck` passes
- `pnpm build` passes
- `pnpm lint` passes (web: eslint; mobile/desktop: placeholder scripts)

Lint caveat:

- `apps/mobile/package.json` still defines `lint` as `echo "add eslint when needed"`.
- `apps/desktop` uses the same placeholder pattern.
- So a green lint run does not mean mobile lint coverage is real yet.

## Current Worktree Notes

- The repository is dirty and contains many modified and untracked files.
- Do not run destructive cleanup commands.
- Do not reset unrelated work.
- There are major migration changes in flight:
  - old granular migration files were deleted,
  - new canonical consolidated migrations were added,
  - split table reference files were added.

## Recommended Next Steps

1. **Fix known cross-lane / auth bugs** (still high priority): bootstrap fallback narrowness, self-serve **actor resolution** (`organization_id` assumptions), dead org-code escape hatch, **family route leak** for hospital patient actors.
2. **Personal lane polish / next product slice** (pick with PM): e.g. ESLint on mobile, E2E smoke, optional `updateAdherenceLogTime` API if product wants “edit timestamp” without reset+rewrite, deeper accessibility on routine editor.
3. Keep SQL changes strictly personal-lane scoped when touching DB.
4. No inventory/stock; no fake catalog or push.
5. Family/hospital depth only when explicitly prioritized.

## Important Paths

- `README.md`
- `docs/three-lane-implementation-plan.md`
- `docs/phase-prompts.md`
- `apps/web/app/onboarding/actions.ts`
- `apps/web/app/onboarding/page.tsx`
- `apps/web/app/patient/page.tsx`
- `apps/web/app/family/page.tsx`
- `apps/mobile/app/(tabs)/index.tsx`
- `apps/mobile/app/(tabs)/history.tsx`
- `apps/mobile/app/(tabs)/_layout.tsx`, `medications.tsx`, `profile.tsx`
- `apps/mobile/features/auth/useActor.ts`
- `apps/mobile/features/personal/screens/PersonalHomeScreen.tsx`
- `apps/mobile/features/personal/screens/MedicationDetailScreen.tsx`
- `apps/mobile/features/personal/screens/PersonalMeScreen.tsx`
- `apps/mobile/features/personal/screens/PersonalMedicationsTabScreen.tsx`
- `apps/mobile/features/personal/screens/PersonalHistoryTabScreen.tsx`
- `apps/mobile/features/personal/screens/AddMedicationScreen.tsx`
- `apps/mobile/features/personal/screens/EditMedicationScreen.tsx`
- `apps/mobile/features/personal/components/PersonalDoseCard.tsx`
- `apps/mobile/features/personal/components/TimeSlotsEditor.tsx`
- `apps/mobile/lib/personal/personal-api.ts`
- `apps/mobile/lib/personal/use-update-personal-profile.ts`
- `apps/mobile/lib/personal/use-personal-medication-adherence-snippet.ts`
- `packages/personal/src/service/personal-medication-service.ts`
- `packages/personal/src/service/personal-timeline-service.ts`
- `packages/auth/src/actor/actor-resolver.ts`
- `supabase/migrations/20260325010000_phase_12_personal_lane_bootstrap.sql`
- `supabase/migrations/README.md`

## Short Summary

The repo reflects the three-lane model; Phase 1b is largely in place. **Personal lane on mobile** now has intentional IA (**Hôm nay / Thuốc / Lịch sử / Tôi**), a **medication command center** (detail + snippet + actions), **profile editing**, **mobile-first routine add/edit**, **late/custom dose logging**, and a **companion-aligned** `/patient` page. Remaining sharp edges are mostly **auth/lane resolution and web route guards** (see Known Findings), not “missing personal CRUD screens.”
