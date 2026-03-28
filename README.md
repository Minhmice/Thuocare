# Thuocare

**Thuocare** is a medication management and care coordination platform designed around a unified user model:

- everyone has a **personal page**
- some users also have **extended management responsibilities**
- the product expands from personal medication use into family care and hospital workflows without forcing separate accounts

Thuocare is built to let users start immediately on their own, then grow into household or clinical coordination when needed.

## Product direction

Medication management often breaks down in real life because of:

- missed doses
- inconsistent routines
- medication stockouts
- weak coordination across family members and caregivers
- unsafe self-managed combinations
- fragmented continuity between everyday care and clinical care

Thuocare addresses this by combining:

- personal medication routines
- family and caregiver coordination
- clinical continuity when a hospital or clinic is involved
- a shared medication knowledge and safety layer

## Core product model

Thuocare does **not** treat different care scenarios as completely separate accounts.

Instead, Thuocare is based on this rule:

> every identity account has a personal page by default

From there, the same person may also gain access to additional responsibilities such as:

- managing family members
- caring for dependents
- coordinating medication for another person
- working in a clinic or hospital context
- acting as an organization or care manager

This keeps the product coherent:

- one login identity
- one personal foundation
- optional additional management capabilities
- lane-specific permissions and workflows layered on top

## Navigation model

### Base navigation for all users

Every user has a personal page and sees three core tabs:

- **Home**
- **Meds**
- **Me**

### Extended navigation for elevated roles

Users with management responsibilities may see an additional tab:

- **Home**
- **Meds**
- **People**
- **Me**

This means:

- a regular self-managing user only sees the personal medication experience
- a caregiver, doctor, household coordinator, or manager gets an expanded people-management surface
- the product stays consistent across user types while allowing different scopes of responsibility

## Tab responsibilities

### Home

The primary daily action surface.

Typical responsibilities:

- today's medication schedule
- upcoming doses
- missed dose alerts
- refill or stock warnings
- quick actions
- care summary cards

### Meds

The medication management surface.

Typical responsibilities:

- medication list
- dosage schedules
- routines and reminders
- dose logging
- remaining supply
- medication safety checks
- interaction guidance

### People

Visible only for users with elevated care or management permissions.

Typical responsibilities:

- managed people list
- dependents
- family members
- patient list in managed workflows
- caregiver assignments
- linked care relationships
- coordination actions and alerts

### Me

The personal identity and account surface.

Typical responsibilities:

- user profile
- account preferences
- privacy and consent settings
- linked accounts and memberships
- role visibility
- settings and future personal controls

## Functional lanes

Thuocare still supports three strategic lanes, but they are built on top of a shared identity model rather than separate account silos.

### 1. Personal lane

For self-management.

Functions include:

- create and manage personal medication routines
- receive reminders
- log taken or skipped doses
- view medication stock
- review safety guidance

### 2. Family lane

For household and caregiver coordination.

Functions include:

- manage medication for children, parents, elderly relatives, or dependents
- assign care responsibilities
- monitor missed doses
- coordinate refill-related actions
- operate across shared household relationships

### 3. Hospital lane

For clinical and organization-linked care.

Functions include:

- prescription lifecycle support
- refill governance
- follow-up planning
- clinical oversight
- role-based access for staff and care teams

Hospital workflows can connect to personal or family experiences later through explicit permissions and consent.

## Identity and account philosophy

Thuocare separates these concepts clearly:

### Identity account

The real login account used for authentication.

This is the user's root identity.

### Personal page

The default page every user has.

This is always present, regardless of profession or role.

### Extended management scope

Additional permissions that unlock people-management workflows.

Examples:

- caregiver
- family coordinator
- doctor
- clinic staff
- organization manager

This avoids forcing users into multiple isolated accounts just because they operate in different care roles.

## Current functional direction for account-related architecture

The product is moving toward the following functional structure.

### Always available core functions

- sign up
- sign in
- sign out
- session retrieval
- personal page initialization
- intent-based onboarding
- personal medication management
- profile and account settings

### Elevated management functions

- manage other people
- invite or connect related users
- assign caregiver responsibilities
- access shared medication coordination
- operate within clinic or organizational permissions
- view and manage people under responsibility

### Clinical continuity functions

- bridge into prescription workflows
- refill coordination
- follow-up actions
- care oversight with role-based permissions

The intention is that users begin simply, then unlock broader capabilities without changing their base identity model.

## Intent-first onboarding

After sign-up, Thuocare can ask what the user wants to do first:

- manage my own medication
- manage medication for my family
- manage care in a hospital or clinic context

The selected intent determines:

- the initial dashboard emphasis
- the first setup tasks
- what surfaces are highlighted first

However, the chosen intent does **not** permanently restrict the user.
It only determines the initial product entry path.

Every user still keeps a personal page.

## Core capabilities

### 1. Medication management

- medication list
- schedules and routines
- reminders
- dose confirmation
- skipped dose logging
- supply visibility

### 2. Care coordination

- support for multiple people under one responsible user
- delegated care workflows
- missed dose visibility
- task coordination across caregivers or family members

### 3. Safety and knowledge

- medication interaction checks
- contraindication review
- allergy-related guidance
- practical guidance such as:
  - safe together
  - separate by time
  - avoid combination

### 4. Clinical continuity

- prescription-driven workflows
- refill orchestration
- follow-up planning
- role-based oversight for staff and managers

## Repository status

This repository is now **single app, mobile-only**.

### Current structure

- `src/` — Expo Router app surface (tabs, screens, UI/state components, feature repositories)
- `supabase/` — backend schema workspace for future phases
- `ios/` — native iOS project generated by Expo

The runtime app currently uses repository adapters with **empty/null data** to keep UI and backend decoupled while the Supabase integration is prepared.

## AI orchestration mode (project convention)

Use this split when coordinating implementation work:

- **Orchestrator**: owns task decomposition, acceptance criteria, and merge decisions
- **Gemini lane (UI/UX)**: mobile UI flow, tab UX, component behavior, empty/loading/error states
- **Claude lane (backend)**: repository contracts, data-access wiring, runtime env handling

Constraints for the current phase:

- mobile only
- keep repository swap architecture (`screen -> repository`)
- data may be `null` / empty by default
- do not rely on SQL files in `supabase/` for current UI iteration
- defer Supabase query implementation to a later phase

## Local development

### Requirements

- Node.js >= 20
- pnpm >= 10
- Xcode / Android tooling when running native builds (`expo run:*`) for mobile

### CocoIndex (optional Python tooling)

If you want to use CocoIndex in this repo (isolated Python venv + Docker Postgres), see:

- [`docs/cocoindex.md`](docs/cocoindex.md)

### Install

```bash
pnpm install
```

### Main commands

```bash
pnpm start
pnpm ios
pnpm android
pnpm typecheck
pnpm lint
pnpm run start:clear
```

## Supabase

Supabase is used for:

- authentication
- database
- row-level security
- shared backend contract foundation

For this current mobile UI phase, the app is intentionally running with null/empty repository outputs and does not consume SQL schema files directly.

## Data architecture direction

The current architecture direction is:

- keep the existing hospital-oriented schema compatible where possible
- add a universal personal foundation for all users
- support people-management and family-care relationships
- bridge personal, family, and hospital workflows through permissions and explicit sharing rules
- use one medication knowledge base across all experiences
- keep UX lane-specific while preserving a unified identity model

## Product principles

Thuocare is being shaped by these principles:

### 1. Everyone starts with a personal page

No one should need a doctor, clinic, or organization just to begin.

### 2. One identity, expanding responsibilities

A user should not need multiple separate login accounts for self-care, family care, and professional care roles.

### 3. Management is additive

Extra tabs and workflows appear when the role requires them, not by splitting the whole product into separate systems.

### 4. Daily use comes first

The product should work for normal everyday medication behavior before advanced clinical workflows are introduced.

### 5. Clinical continuity matters

Personal and family care should be able to connect into more formal care workflows when needed.

## Near-term roadmap

- personal page as the default foundation for every user
- base navigation:
  - Home
  - Meds
  - Me
- extended navigation for management roles:
  - Home
  - Meds
  - People
  - Me
- personal medication routines
- people-management workflows
- family care coordination
- shared medication safety knowledge

## Mid-term roadmap

- stronger linked-person management
- richer caregiver assignment models
- explicit sharing and permission flows
- improved medication safety explainability
- better cross-lane continuity between everyday care and clinical care

## Longer-term roadmap

- predictive adherence insights
- stockout risk scoring
- condition-specific pathways
- outcome-linked care journeys
- deeper continuity across personal, family, and hospital contexts

## License

Not defined yet.

Add a `LICENSE` file before public or open-source release.
