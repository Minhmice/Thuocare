# Thuocare Project Plan

Last updated: 2026-03-28

## Purpose

This file is the working source of truth for:

- phased delivery
- task priority
- model selection
- prompt intake
- working memory across turns

This repo is currently **mobile-only**. UI should not depend on SQL files in `supabase/` during the current phase. Data may stay `null` or empty until the repository layer is swapped to Supabase later.

Locked product assumptions:

- MVP lane: `personal` only
- visual direction: `clinical minimal`
- platform support: `iPhone` and `Android`
- implementation bias: use Expo SDK patterns that feel native on iPhone first, while preserving Android parity
- design reference: `docs/DESIGN_STYLE.md`
- screen phasing reference: `docs/MVP_SCREEN_PHASES.md`
- deferred-work reference: `docs/TODO_LATER.md`
- workflow reference: `docs/WORKFLOW.md`
- reusable-components reference: `docs/REUSABLE_COMPONENTS.md`
- source component root: `src/features/components/`

## Operating Mode

Execution split:

- `Orchestrator`: owns decomposition, prioritization, sequencing, and done criteria
- `Gemini agent`: UI/UX exploration, information architecture, design direction, prompt ideation, multimodal review
- `Claude agent`: implementation, repository contracts, TypeScript/Expo changes, backend-facing architecture, integration safety

Agent constraint:

- only `2 agents` are available for execution: `Gemini` and `Claude`
- prompts should be written in English
- prompts should instruct the agent to update docs when its assigned phase is completed
- follow-up questions should be asked in chat after the prompt, not embedded inside the prompt body

## Model Routing

The model guidance below is based on official vendor positioning and adapted to this repo.

### Claude

| Task type | Recommended model | Why |
| --- | --- | --- |
| rename, copy polish, tiny edit, quick grep/summarize | `Haiku` | fastest and cheapest for low-risk work |
| normal coding task, repository change, screen implementation, TypeScript fix, Expo wiring | `Sonnet` | best default balance of reasoning, speed, and coding quality |
| architecture review, complex refactor, auth and permissions, hard debugging, high-stakes system prompt | `Opus` | strongest deep reasoning when mistakes are expensive |

Default rule:

- use `Sonnet` unless the task is either clearly tiny (`Haiku`) or structurally hard/high-risk (`Opus`)

### Gemini

Assumption:

- you are choosing between the `Gemini 2.5` family and the `Gemini 3` family, not every sub-variant individually

| Task type | Recommended model | Why |
| --- | --- | --- |
| screen concepts, UX alternatives, IA, onboarding flows, prompt ideation, visual critique | `Gemini 3` | strongest for broad ideation, multimodal reasoning, and agentic build/plan workflows |
| long-form reasoning on specs, README synthesis, research-backed comparisons, conservative prompt drafting | `Gemini 2.5` | strong thinking model family for careful document and codebase reasoning |

Default rule:

- use `Gemini 3` for creative and UI-heavy work
- use `Gemini 2.5` for careful reasoning over longer context when you want fewer stylistic jumps

## Task To Model Map

| Task | Lead model | Secondary model |
| --- | --- | --- |
| product scope clarification | `Gemini 2.5` | `Claude Sonnet` |
| tab flow and screen map | `Gemini 3` | `Claude Sonnet` |
| empty/loading/error UX states | `Gemini 3` | `Claude Sonnet` |
| component API design | `Claude Sonnet` | `Gemini 3` |
| Expo Router implementation | `Claude Sonnet` | `Claude Haiku` |
| repository contracts | `Claude Sonnet` | `Claude Opus` |
| backend architecture without SQL implementation | `Claude Opus` | `Claude Sonnet` |
| prompt generation for UI tasks | `Gemini 3` | `Gemini 2.5` |
| prompt generation for backend tasks | `Claude Sonnet` | `Claude Opus` |
| fast task slicing and checklists | `Claude Haiku` | `Gemini 2.5` |
| final cross-check before execution | `Claude Sonnet` | `Claude Opus` |

## Prompt Intake Protocol

Before generating any serious prompt or starting any ambiguous task:

1. Run a quick web check first when the topic may be stale.
2. Ask a short set of targeted questions.
3. Lock the model choice.
4. Draft the prompt.
5. Restate success criteria before execution.

### When web search is mandatory before asking

- model capabilities, pricing, current product behavior, SDK docs
- external APIs, Expo package changes, Supabase changes, policy or platform changes
- any prompt that depends on current tool behavior rather than stable repo code

### Default question set

Ask at least 4 questions, unless the answer is already explicit in repo context:

1. What exact outcome do you want from this task?
2. Who is the target user or operator for this output?
3. What constraints are fixed?
4. What does a good result look like?

### Prompt Output Rule

Whenever a prompt is produced for execution:

1. write the prompt first
2. put it in a copyable code block
3. require the agent to update the relevant docs when its phase is done
4. do not append a `Questions` section inside the prompt
5. ask the next screen or next feature questions in chat after the prompt

### UI prompt questions

1. Is the screen for `personal`, `family`, or `hospital` lane?
2. Should the tone feel clinical, calm, premium, warm, or utilitarian?
3. Is the screen optimized for iPhone only, Android only, or both?
4. Do you want fast prototype fidelity or production-ready spec fidelity?

### Backend prompt questions

1. Is this contract for current null data mode or Supabase-ready mode?
2. Which repository function or route owns the behavior?
3. What errors must be surfaced explicitly?
4. What can stay deferred to a later phase?

## Working Memory Protocol

To keep execution coherent across turns:

1. Read `README.md`, `AGENTS.md`, and this file before major work.
2. Read `docs/WORKFLOW.md` before deciding whether to ask questions, write specs, output prompts, or implement.
3. Update the `Current Phase`, `Active Tasks`, and `Next Actions` sections after meaningful progress.
4. Treat this file as the canonical backlog summary, not chat memory.
5. Keep tasks small enough that one owner and one lead model can complete them.
6. Move blocked items into `Open Questions` immediately instead of holding them in implicit memory.
7. For screen-level work, update `docs/MVP_SCREEN_PHASES.md` as the detailed execution ledger.

## Current Phase

`Phase 3 - Mobile UX And Component Spec`

Goal:

- lock mobile UX direction and source component architecture
- scaffold the first reusable component batch (ui and wrapper)
- prepare for composed component implementation and screen refactors

## Phase Plan

### Phase 0 - Operating System Setup

Deliverables:

- project plan in `docs/`
- model routing rules
- prompt intake rules
- working memory protocol

Done when:

- the repo has one visible source of truth for planning
- future tasks can be mapped to a model quickly

### Phase 1 - Auth And Onboarding Definition

Deliverables:

- sign-in feature spec
- sign-up feature spec
- onboarding question flow
- redirect logic after auth

Lead model:

- `Gemini 2.5` for flow shaping
- `Claude Sonnet` for implementation constraints

### Phase 2 - Product Scope And Information Architecture

Deliverables:

- clarified MVP boundary
- lane priorities (`personal` only for MVP)
- screen inventory for `Home`, `Meds`, `Me`
- conditions for later `People` tab unlock

Lead model:

- `Gemini 2.5` for scope reasoning
- `Gemini 3` for screen/flow alternatives

### Phase 3 - Mobile UX And Component Spec

Deliverables:

- state maps for loading, empty, error, and populated states
- component inventory
- source component architecture in `src/features/components/ui`, `src/features/components/wrapper`, and `src/features/components/composed`
- a small first batch of primitives and wrappers, not the full library at once
- visual direction and interaction rules
- onboarding and empty-state copy guidance

Lead model:

- `Gemini 3`

Support:

- `Claude Sonnet` for implementation-safe component APIs

### Phase 4 - App Shell And Screen Implementation

Deliverables:

- tab shell stabilized
- `Home`, `Meds`, `Me` implemented against null-safe repositories
- reusable UI wrappers extended only when necessary

Lead model:

- `Claude Sonnet`

Support:

- `Claude Haiku` for small cleanup tasks

### Phase 5 - Repository Contracts And Backend Readiness

Deliverables:

- repository interfaces ready for Supabase swap
- clear null, empty, loading, and error contracts
- environment and client boundaries documented

Lead model:

- `Claude Sonnet`

Escalate to:

- `Claude Opus` for difficult contract or architecture decisions

### Phase 6 - Prompt Library And Execution Cadence

Deliverables:

- reusable prompt templates for UI, backend, and review tasks
- task update cadence
- model choice rubric proven on real tasks

Lead model:

- `Gemini 3` for prompt ideation
- `Claude Sonnet` for hardening prompts into execution specs

### Phase 7 - Supabase Integration Readiness

Deliverables:

- list of repositories to swap first
- expected response shapes
- rollout order for real data integration

Constraint:

- do not read SQL in current UI iteration unless explicitly requested later

## Active Tasks

| ID | Task | Phase | Lead model | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| P0-01 | create orchestration plan file | Phase 0 | `Claude Sonnet` | done | initial version created |
| P0-02 | define model routing rules | Phase 0 | `Claude Sonnet` | done | based on official vendor positioning |
| P0-03 | define prompt intake questions | Phase 0 | `Claude Sonnet` | done | web check first for unstable topics |
| P1-01 | define sign-in UX and flow | Phase 1 | `Gemini 2.5` | done | captured in `docs/phase implement/gemini/sign-in.md` |
| P1-02 | define sign-up UX and flow | Phase 1 | `Gemini 2.5` | done | captured in `docs/phase implement/gemini/sign-up.md` |
| P1-03 | define onboarding question flow | Phase 1 | `Gemini 2.5` | done | captured in `docs/screen_feature/onboarding-survey.md` |
| P1-04 | define forgot-password UX and flow | Phase 1 | `Gemini 2.5` | done | captured in `docs/phase implement/gemini/forgot-password.md` |
| P1-05 | define auth-success transition | Phase 1 | `Gemini 2.5` | done | captured in `docs/screen_feature/auth-success-transition.md` |
| **P1-06** | **implement sign-in flow** | **Phase 1** | **`Claude Sonnet`** | **done** | **phone-first, password visibility, forgot password, legal modal** |
| **P1-07** | **implement onboarding flow** | **Phase 1** | **`Claude Sonnet`** | **done** | **2-step flow (reminder preference + condition type)** |
| **P1-08** | **implement sign-up screen** | **Phase 1** | **`Claude Sonnet`** | **done** | **full spec: name-first, phone required, email optional, legal checkbox, multi-account storage** |
| **P1-09** | **refactor storage to multi-account** | **Phase 1** | **`Claude Sonnet`** | **done** | **AuthStore v2: accounts list + activeAccountId** |
| P2-01 | define MVP screen inventory | Phase 2 | `Gemini 2.5` | done | `Home`, `Meds`, `Me` only for personal lane |
| P2-02 | split MVP screens into execution waves | Phase 2 | `Claude Sonnet` | in_progress | implementation-facing breakdown in docs |
| P2-03 | define Me screen UX and flow | Phase 2 | `Gemini 2.5` | done | captured in `docs/phase implement/gemini/me.md` |
| **P2-04** | **implement Me screen** | **Phase 2** | **`Claude Sonnet`** | **done** | **profile summary, account, reminders placeholder, support, sign out** |
| P2-05 | define Meds screen spec | Phase 2 | `Gemini 2.5` | done | captured in `docs/phase implement/gemini/meds.md` |
| P2-10 | define Meds MVP UX and IA | Phase 2 | `Gemini 3` | done | compact dashboard + list hierarchy + return-from-add flow in `docs/phase implement/gemini/meds.md` |
| **P2-11** | **implement Meds screen** | **Phase 2** | **`Claude Sonnet`** | **done** | **compact dashboard + list tiles + low/out-of-stock styling + 1s post-add highlight + mock diversity** |
| P2-06 | define Add medication UX and flow | Phase 2 | `Gemini 2.5` | done | captured in `docs/phase implement/gemini/add-medication.md` |
| **P2-09** | **implement Add medication flow** | **Phase 2** | **`Claude Sonnet`** | **done** | **5-step flow, return-to-Meds highlight; no backend assumptions** |
| P2-07 | define Home screen UX and flow | Phase 2 | `Gemini 3` | done | captured in `docs/phase implement/gemini/home.md` |
| **P2-08** | **implement Home screen** | **Phase 2** | **`Claude Sonnet`** | **done** | **greeting, alerts, stats dashboard, next-dose hero, slider confirm, schedule, photo stub** |
| P3-01 | define mobile UX direction | Phase 3 | `Gemini 3` | done | visual and interaction rules in `docs/DESIGN_STYLE.md` |
| P3-02 | lock source component architecture | Phase 3 | `Claude Sonnet` | done | `src/features/components/` with `ui`, `wrapper`, `composed`; colocated English READMEs allowed |
| P3-03 | choose first small component batch | Phase 3 | `Claude Sonnet` | done | small batch first; wrappers should expose the same conceptual names as primitives |
| P3-04 | define first reusable component batch | Phase 3 | `Gemini 3` | done | captured in `docs/phase implement/gemini/components-batch-01.md` |
| P3-05 | scaffold first component batch (ui/wrapper) | Phase 3 | `Claude Sonnet` | done | button, input, checkbox, card, typography, field |
| P3-06 | define second reusable component batch | Phase 3 | `Gemini 3` | done | captured in `docs/phase implement/gemini/components-batch-02.md` |
| P3-07 | scaffold second component batch (ui/wrapper) | Phase 3 | `Claude Sonnet` | done | icon, dialog, sheet, toast, separator, spinner |
| P3-08 | define first composed component batch | Phase 3 | `Gemini 3` | done | captured in `docs/phase implement/gemini/composed-batch-01.md` |
| P3-09 | scaffold first composed component batch | Phase 3 | `Claude Sonnet` | done | screen-header, alert-banner, summary-stats-row |
| P3-10 | define MedicationTile composed component | Phase 3 | `Gemini 3` | done | captured in `docs/phase implement/gemini/medication-tile.md` |
| P3-11 | scaffold MedicationTile composed component | Phase 3 | `Claude Sonnet` | done | supporting active and out-of-stock states |
| P3-12 | define second composed component batch | Phase 3 | `Gemini 3` | done | captured in `docs/phase implement/gemini/composed-batch-02.md` |
| P3-13 | scaffold second composed component batch | Phase 3 | `Claude Sonnet` | done | settings-section, support-section |
| P3-14 | refactor Me screen to new component system | Phase 3 | `Claude Sonnet` | done | using ScreenHeader, SettingsSection, SupportSection |
| P3-15 | define SliderConfirm composed component | Phase 3 | `Gemini 3` | done | captured in `docs/phase implement/gemini/slider-confirm.md` |
| P3-16 | scaffold SliderConfirm composed component | Phase 3 | `Claude Sonnet` | done | horizontal swipe to confirm dose |
| P4-01 | refine null-data UX in screens | Phase 4 | `Claude Sonnet` | pending | current app is already null-safe at basic level |

## Open Questions

- (Closed) Which exact primitive set should be in the first small batch under `src/features/components/`?
- (Closed) Should `composed` start only after proven reuse, or can a small planned batch be scaffolded alongside primitives and wrappers?

## Next Actions

1. choose the next batch of `composed` components (e.g., PrimaryHeroCard, TodaySchedule)
2. refactor Meds screen to use the new reusable components (MedicationTile, SummaryStatsRow)
3. refactor Home screen to use the new reusable components (ScreenHeader, AlertBanner, SummaryStatsRow, SliderConfirm)
4. keep onboarding split-slide note for future implementation prompt

## Update Rules

When a task finishes:

- update `Active Tasks`
- move the next item into `in_progress`
- append new blockers to `Open Questions`

When a new request arrives:

- map it to a phase
- choose the lead model before execution
- ask the prompt intake questions if the request is ambiguous

## Source Notes

Model routing was informed by official documentation:

- Anthropic model overview: `Opus` is positioned as most capable, `Sonnet` as high-performance and efficient, and `Haiku` as fast/efficient for simpler work.
- Google positions `Gemini 2.5 Pro` as a state-of-the-art thinking model for complex code, docs, and long-context reasoning.
- Google positions `Gemini 3` as its latest most intelligent family with strong build, plan, multimodal, and agentic capabilities.
