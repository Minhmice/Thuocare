# Thuocare

**Thuocare** is a personalized medication management and care coordination platform built around three lanes:
- **Personal lane**
- **Family lane**
- **Hospital lane**

Users can start immediately without a doctor, clinic, or prescription, then connect to hospital workflows later when needed.

## What problem Thuocare solves

Medication management often fails in everyday life:
- missed doses,
- poor schedule consistency,
- medication stockouts,
- weak coordination between family and care teams,
- unsafe combinations when people self-manage medicines.

Thuocare helps users coordinate medication safely across personal, family, and clinical contexts.

## Three-lane model

### 1) Personal lane
- For users managing their own medication.
- Fast start: add medicine, set schedule, receive reminders, log taken/skipped doses.
- No mandatory clinical linkage at entry.

### 2) Family lane
- For one account managing medication for multiple people.
- Supports children, parents, elderly relatives, and dependents.
- Role-based household coordination (owner/coordinator/caregiver/dependent).

### 3) Hospital lane
- For organizations and medical staff.
- Keeps existing clinical lifecycle: prescribing, refill governance, follow-up, and safety rules.
- Can be linked to personal/family data through explicit patient consent.

## Intent-first onboarding

After sign-up, Thuocare asks what the user wants to do:
- manage my own medication,
- manage medication for my family,
- manage treatment in a hospital/clinic context.

The selected intent determines the initial dashboard, permissions, and first actions.

## Core capabilities

1. **Medication management**
   - Medication list and dosage schedule
   - Reminder timeline and dose confirmations
   - Remaining supply visibility

2. **Care coordination**
   - Shared tasks across family members
   - Delegated caregiver workflows
   - Alerts for missed doses and follow-up actions

3. **Safety and knowledge**
   - Drug interaction checks
   - Contraindication and allergy cross-reactivity checks
   - Practical guidance such as: safe together, separate by time, or avoid combination

4. **Clinical continuity (Hospital lane)**
   - Prescription and refill workflows
   - Follow-up planning
   - Clinical oversight with role-based access control

## Data architecture direction

- Keep existing hospital schema intact for backward compatibility.
- Add personal/family tables and bridge them to hospital entities.
- Introduce consent-based cross-lane sharing.
- Use one medication knowledge base for all lanes with lane-specific UX presentation.

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
pnpm dev             # run workspace dev pipeline
pnpm dev:web         # run web app
pnpm dev:desktop     # run desktop frontend
pnpm dev:mobile      # build prescription package + start Expo (Metro)
pnpm mobile:ios:run  # build and install iOS dev client via Expo

pnpm typecheck
pnpm lint
pnpm build
```

## Supabase notes

- Supabase is used for auth, database, and row-level security.
- SQL migrations are in `supabase/migrations/`.
- After schema changes, regenerate DB types with:

```bash
supabase gen types typescript --local > packages/supabase/src/database.types.ts
```

## Roadmap

### Near term

- Three-lane onboarding (Personal / Family / Hospital)
- Personal medication routines and reminders
- Family household care coordination
- Shared medication knowledge base (interactions and guidance)

### Mid term

- Consent-based cross-lane data sharing
- Advanced medication safety alerting and explainability
- Stronger follow-up and refill orchestration across lanes

### Longer term

- Predictive adherence and stockout risk scoring
- Condition-specific pathways
- Outcome-linked care journeys across personal, family, and hospital contexts

## License

Not defined yet. Add a `LICENSE` file before open-source/public release.
