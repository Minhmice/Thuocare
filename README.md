# Thuocare

**Thuocare** is a platform that helps doctors and outpatient clinics manage the full medication lifecycle: from prescription to adherence, refill, and follow-up.

> Product direction: **Prescription-to-Adherence Platform**

## What problem does Thuocare solve?

Traditional e-prescribing tools usually stop at "issuing the prescription." In real outpatient care, patients often:
- forget to take medicine on time,
- run out of medication mid-treatment,
- miss follow-up visits,
- or misunderstand usage instructions.

Thuocare is designed to turn a one-time visit into a continuous treatment workflow.

## Target users

- **Outpatient doctors** (internal medicine, cardiology, endocrinology, respiratory, geriatrics, pediatrics, etc.)
- **Patients on long or recurring treatment plans**, especially chronic conditions
- **Family/caregivers** who help monitor medication use
- **Clinics and care teams** that want better post-visit continuity and follow-up rates

## Core software capabilities

### 1) Doctor Workspace
- Electronic prescribing
- Treatment templates and one-click repeat prescription
- Refill governance rules by medication/risk type
- Priority lists for patients who are near stockout or overdue for follow-up

### 2) Patient App / Patient Channel
- Medication reminders by daily timeline (morning, noon, evening, night)
- Dose confirmation (taken/skipped)
- Remaining medication days indicator
- Clear, patient-friendly medication instructions
- Follow-up appointment reminders

### 3) Refill and Delivery Engine
- Refill timing prediction
- Refill request submission workflow
- Approve/reject/review-before-refill flow
- Delivery integration readiness (pharmacy/logistics)

### 4) Clinical Safety Layer
- Drug interaction alerts
- Allergy alerts
- Duplicate active-ingredient checks
- Safety rules for high-risk medications

## Main workflow

1. Doctor creates a prescription and follow-up plan.
2. Patient receives daily medication reminders.
3. System tracks adherence and remaining supply.
4. When supply is low, patient sends a refill request.
5. Doctor/staff approve refill or require reassessment.
6. System reminds follow-up and continues the treatment cycle.

## Value delivered

### For doctors
- Less repetitive prescribing work
- Better visibility after the visit
- Faster prioritization of high-risk patients

### For patients
- Fewer missed doses
- Less treatment interruption due to stockout
- Better follow-up compliance

### For clinics
- Higher return/follow-up rates
- Stronger patient retention
- Better long-term treatment data

## Current repository status

This monorepo is currently at the foundation stage:

- `apps/web`: Next.js web app
- `apps/desktop`: Tauri + React desktop app
- `apps/mobile`: Expo + React Native mobile app
- `packages/*`: shared packages (UI, types, validation, utils, Supabase client)

## Run the project

### Requirements
- Node.js >= 20
- pnpm >= 10
- Rust toolchain (for desktop/Tauri)

### Install

```bash
pnpm install
```

### Main commands

```bash
pnpm dev          # run workspace dev pipeline
pnpm dev:web      # run web app
pnpm dev:desktop  # run desktop frontend
pnpm dev:mobile      # Expo dev server (Metro); press `i` for iOS Simulator
pnpm mobile:ios:run  # build & install dev client on Simulator (Xcode); see apps/mobile/README.md

pnpm typecheck
pnpm lint
pnpm build
```

## Supabase (brief)

- Supabase is used for auth, database, and row-level security.
- SQL migrations are in `supabase/migrations/`.
- After schema changes, regenerate DB types with:

```bash
supabase gen types typescript --local > packages/supabase/src/database.types.ts
```

## Product roadmap

### Core (priority)
- E-prescribing
- Medication reminders
- Remaining-supply tracking
- Refill request + approval workflow
- Follow-up reminders
- Patient risk/priority dashboard

### Expansion level 2
- Pharmacy integration
- Medication delivery coordination
- Telehealth refill review
- Family/caregiver mode

### Expansion level 3
- Advanced refill prediction engine
- Adherence and no-show risk scoring
- Disease-specific care programs
- Outcome-linked follow-up flows

## License

Not defined yet. Add a `LICENSE` file before open-source/public release.
