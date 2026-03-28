# Add Medication Screen Feature Spec

Last updated: 2026-03-27

## Purpose

`Add medication` is a separate flow launched from `Meds`.

For MVP, it should optimize for:

- simple fast entry
- low cognitive load
- enough structure to keep medication data useful later

## Locked Decisions

Based on current product direction:

- this should be a multi-step flow
- `medicine identity` and `schedule` are separate steps
- MVP should stay as simple as possible
- after save, return to `Meds`
- the newly created medication should get its own small highlight / entry animation on return

## Step Structure

Recommended MVP order:

1. medication identity
2. schedule
3. stock and optional timing details
4. optional date range
5. review and save

## Step 1 - Medication Identity

Required:

- medication name

Optional:

- `what is it for`

Recommended UX:

- when the user types the medication name, future versions should search the medication database and suggest matches
- future versions should also recommend what the medicine is for
- for MVP, this recommendation behavior should be noted but can remain deferred

### Dosage Form UX Recommendation

The form should adapt based on medication form:

- if user selects `tablet` / `capsule`:
  - ask how many pills per dose
- if user selects `liquid`:
  - convert the quantity input into `ml`
- if user selects `powder`:
  - let the user type their own quantity label such as `1 scoop`

Important MVP simplification:

- keep dosage language simple and user-friendly
- do not force overly clinical units if a simpler unit works
- if a user takes `1 tablet`, show `1 tablet`, not a complicated compound dosage

## Step 2 - Schedule

Schedule should use only three preset moments:

- morning
- noon
- evening

Rules:

- user can select one or more of those moments
- each selected moment should be quick to tap
- each moment should include meal relation guidance in the same area if possible

### Timing Customization

There should be a small optional action such as:

- `Use a specific time instead`

Behavior:

- if the user does nothing, the app uses the default or future user settings
- custom exact-time editing is not the main MVP path
- deeper scheduling settings can stay for later

## Step 3 - Stock And Dose Support

Optional:

- stock quantity

Reasoning:

- user should be able to create a medication without knowing stock immediately
- stock is useful, but not mandatory

Future note:

- later there should be a `report out of stock` action that connects to refill flow
- that action is not part of MVP implementation now

## Step 4 - Date Range

Optional:

- start date
- end date

Reasoning:

- these are useful but should stay near the end so they do not slow basic entry

## Step 5 - Save And Return

After save:

- return to `Meds`
- highlight the newly created medication
- use a small dedicated UX treatment or animation so the user immediately sees what was added

Recommended MVP behavior:

- quick scroll/focus to the new item
- soft highlight or entry animation
- keep it calm, not flashy

## Deferred But Reserved

These should remain deferred for now:

- refill threshold configuration
- full medication database recommendation
- automatic “what is it for” recommendation
- advanced exact-time scheduling
- deeper medication editing flow

## MVP Acceptance Criteria

- Add medication is multi-step
- step 1 collects medication identity with optional `what is it for`
- step 2 handles morning / noon / evening presets
- simple dosage-form adaptation exists in the UX design
- stock quantity is optional
- date range is optional and near the end
- save returns to `Meds`
- new medication gets a clear but calm highlight state

## Prompt Note For Later

When writing the implementation prompt later:

- keep the flow simple and fast
- separate identity and schedule into different steps
- reserve database recommendations as a future extension
- include a post-save return animation/highlight in `Meds`
