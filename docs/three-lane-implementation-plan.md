# Thuocare Three-Lane Implementation Plan

## Guiding rules

- README is the product source of truth.
- SQL is already aligned to the target architecture, so app-layer work must catch up.
- The product must think in `personal / family / hospital`, not `patient / doctor`.
- Each phase must leave the repo in a runnable state and keep `pnpm typecheck` green.

## Phase 1: Workflow Realignment

### Goal

Make the app think in care intents and lane-specific entry flows instead of actor-type-first flows.

### Scope

- Intent-first login/signup/onboarding on web.
- Lane-aware landing routes for personal, family, and hospital.
- Mobile home becomes lane-specific instead of a QA/debug shell.
- Fix package graph and compile issues that block the new flow.

### Deliverables

- Shared `care intent` helper for web routing.
- `/patient`, `/family`, and `/dashboard` become lane-aware entry points.
- Mobile home renders `PersonalHomeScreen`, `FamilyHomeScreen`, or `HospitalHomeScreen`.
- Root and proxy redirects respect lane intent.

### Exit criteria

- `pnpm typecheck` passes.
- A user can sign up or sign in by intent: personal, family, hospital.
- No entry page still hardcodes hospital as the default user journey.

## Phase 2: Personal Lane Completion

### Goal

Make the personal lane usable end-to-end without requiring hospital linkage.

### Scope

- Medication add/edit/stop flows.
- Better schedule presets and routine editing.
- Personal reminders, history, missed-dose handling, and stock visibility.
- Better personal home and personal portal UI.

### Deliverables

- Full CRUD around `personal_medication`.
- Personal adherence history and summary screens.
- Notification surfaces for personal reminders and missed-dose alerts.
- Catalog-backed medication search with custom-name fallback.

### Exit criteria

- A self-managed user can start from zero and manage medication fully in the personal lane.
- Personal lane does not depend on prescription tables to function.

## Phase 3: Family Lane App Layer

### Goal

Turn family lane from schema-only support into a real product workflow.

### Scope

- Household workspace.
- Dependent/member list.
- Role-based caregiver coordination.
- Shared reminders and delegated actions.

### Deliverables

- Family lane home and member switcher.
- Family profile management UI.
- Role-aware visibility for owner/coordinator/caregiver/dependent.
- Shared task and reminder surfaces.

### Exit criteria

- One account can manage multiple relatives with distinct responsibilities.
- Family lane is no longer a placeholder route.

## Phase 4: Hospital Lane Patient Experience

### Goal

Make patient-facing hospital workflows coherent across adherence, prescriptions, refill, and follow-up.

### Scope

- Patient hospital dashboard.
- Better prescriptions and refill workflow presentation.
- Appointment and follow-up visibility.
- Notification inbox for hospital events.

### Deliverables

- Hospital patient home with active treatment summary.
- Refill state and next-action UX.
- Follow-up and appointment timeline.
- Notification center for refill and appointment updates.

### Exit criteria

- A hospital-linked patient can understand what to do next from one place.
- Hospital lane no longer feels like a collection of disconnected tabs.

## Phase 5: Cross-Lane Consent and Bridges

### Goal

Connect personal, family, and hospital lanes through explicit consent and bridge records.

### Scope

- Consent grant creation, review, revoke, and audit trail.
- Shared care profile bridge UI.
- Lane-aware read/write permissions in app behavior.

### Deliverables

- Consent management screens.
- Bridge visualizations between patients, family profiles, and organizations.
- App-layer guardrails that mirror the SQL consent model.

### Exit criteria

- Cross-lane access is explicit and inspectable.
- Family and hospital workflows can consume shared data only when consent exists.

## Phase 6: Medication Knowledge and Safety

### Goal

Use the shared medication knowledge base in real workflows instead of leaving it as import-only metadata.

### Scope

- Interaction checks.
- Contraindication and allergy cross-reactivity checks.
- Explainable recommendations in personal, family, and hospital workflows.

### Deliverables

- Shared safety service for catalog + ingredient checks.
- Alert cards in medication add, refill, and prescription flows.
- Guidance UI such as safe together / separate by time / avoid combination.

### Exit criteria

- Safety logic is invoked in runtime flows, not only stored in the database.
- Alerts are understandable and actionable for both patients and clinicians.

## Phase 7: Advanced Care Intelligence

### Goal

Layer advanced care orchestration on top of a stable three-lane foundation.

### Scope

- Risk scoring.
- Predictive stockout and adherence signals.
- Condition-specific pathways.
- Outcome-linked journeys.

### Deliverables

- Risk dashboards and prioritization.
- Condition-tailored care plans.
- Journey analytics and outcome hooks.

### Exit criteria

- Advanced models consume stable workflow data from the first six phases.
- The product can prioritize care rather than only record it.

## Recommended execution order right now

1. Finish Phase 1 completely and do not reopen old patient-vs-doctor routing.
2. Ship Personal Lane Completion before Family Lane depth.
3. Build Family Lane app UX before cross-lane consent UX.
4. Only wire medication knowledge into runtime after the main lane flows are stable.
