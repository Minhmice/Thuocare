# Thuocare Execution Workflow

Last updated: 2026-03-27

## Purpose

This file defines the required workflow for future work in this repo.

The main goal is to prevent the same mistakes from repeating:

- writing implementation too early
- writing only docs when the user expected prompts in chat
- forgetting to ask enough questions before building a function
- drifting away from the repo's chosen orchestration style

## Non-Negotiable Rules

1. Before building a new function or feature, ask the user at least `5 questions` unless the scope is already fully locked.
2. For screen and flow work, write the spec into `docs/screen_feature/*.md`.
3. When the user wants agents to work, also output prompts directly in chat.
4. Prompts must include:
   - the recommended model
   - a copyable code block
   - instructions for the agent to update the relevant docs after finishing the phase
5. Do not replace prompts with docs. Both are required when the user expects prompt-driven execution.
6. If the user says `not yet`, only update specs and planning docs. Do not write prompts or code.
7. If a screenshot or image is missing, do not invent details from it. Fall back to chat context and existing docs.

## Required Reading Order

Before substantial planning or implementation:

1. `README.md`
2. `AGENTS.md`
3. `docs/PROJECT_PLAN.md`
4. `docs/MVP_SCREEN_PHASES.md`
5. `docs/TODO_LATER.md`
6. the relevant file in `docs/screen_feature/`
7. this file

## Standard Turn Flow

### 1. Clarify

Before proposing implementation:

- ask at least `5 questions` for any new function, screen, or flow
- if the topic is unstable, do a quick web check first
- lock the screen scope and MVP boundary

### 2. Spec

After the answers are clear:

- write or update the relevant spec in `docs/screen_feature/`
- update `docs/TODO_LATER.md` for anything explicitly deferred
- update `docs/PROJECT_PLAN.md` and `docs/MVP_SCREEN_PHASES.md` if the phase state changed

### 3. Prompt

If the user wants agent-driven work:

- output prompts directly in chat
- do not hide prompts only inside markdown files
- put each prompt in a code block
- state the model immediately before the code block

Prompt format expectation:

- line before prompt: `Use model: <model name>`
- then the prompt in a code block
- then return to chat and ask the user about the next screen or next unresolved scope

### 4. Implement

Only implement after:

- the user has approved the direction
- enough questions were answered
- the screen or feature spec exists

## Prompt Policy

When outputting prompts:

- write them in English
- keep them practical and execution-oriented
- do not add unnecessary reporting sections like:
  - `Docs created/updated: ...`
- instead, tell the agent to update docs, and allow the agent to clean `docs/TODO_LATER.md` if entries are stale, duplicated, or no longer useful

## Screen Sequencing Policy

For this repo, the sequence should follow:

1. auth and onboarding
2. shell and design primitives
3. Home
4. Meds
5. Me

Specific locked flow decisions already made:

- MVP lane is `personal`
- design direction is `clinical minimal`
- iPhone and Android are both supported
- iPhone-native Expo patterns are preferred when they do not break Android parity
- onboarding survey should later be split into multiple screens with slide transitions

## Auth Funnel Policy

Already locked:

- `Sign in`
- `Sign up`
- `Forgot Password`
- `Onboarding Survey`
- `Auth Success / Transition State`

Important:

- `Sign in` and `Sign up` specs must exist before asking implementation agents to build them
- `Forgot Password` is a shared modal flow
- `Auth Success / Transition State` is a lightweight transition layer, not a heavy standalone screen

## Me-Specific Policy

Already locked:

- `Me` is profile-summary-first
- settings live below the profile summary
- support/help is near the bottom
- sign out is the bottom-most action
- edit profile and richer medical/account relationship detail are deferred into `docs/TODO_LATER.md`

## What To Put In Docs vs In Chat

Put in docs:

- stable screen specs
- backlog and deferred work
- phase tracking
- reusable workflow rules

Put in chat:

- prompts
- model choice
- the next questions for the user
- short summaries of the current decision

## Failure Conditions

This workflow is being violated if:

- a prompt was expected but only a markdown spec was written
- a new function was started without at least `5` questions
- docs and chat drift apart
- deferred items are left implicit instead of recorded in `docs/TODO_LATER.md`

## Definition Of Correct Execution

A turn is correct when:

- the user was asked enough questions
- the relevant spec was written to `docs/`
- the prompt was returned directly in chat when requested
- the model was stated clearly
- backlog and phase docs stayed in sync
