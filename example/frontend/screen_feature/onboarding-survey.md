# Onboarding Survey Screen Feature Spec

Last updated: 2026-03-27

## Purpose

This is the first screen after successful auth.

Its job is not clinical intake. Its MVP job is to:

- understand the user's medication reminder context
- segment the user into a practical personal-routine profile
- collect enough information to shape later screens and future forms
- keep the survey light enough to finish in one sitting

## Working Principle

The user is assumed to be:

- feeling unwell
- possibly tired or stressed
- trying to avoid missing medication

So the survey should optimize for:

- low cognitive load
- short steps
- large tap targets
- plain language
- clear progress

## Recommended Structure

Recommended MVP format:

- `2 steps`
- multiple screens instead of one long stacked form
- mostly multiple-choice answers
- optional free-text only where it adds real value

Step split:

1. medication routine context
2. reminder intensity and support needs

## Screen Splitting Rule

For future implementation and prompting:

- this survey should be split into multiple screens, not one dense screen
- each step should feel like a focused card-sized decision surface
- transitions between steps should use slide animation
- forward motion should slide from right to left
- back navigation should slide from left to right
- animation should stay calm, around the macro-interaction guidance from `docs/DESIGN_STYLE.md`
- do not implement this yet if the current task is only planning

## Suggested Questions Table

| ID | Question | Type | Why it matters | MVP use |
| --- | --- | --- | --- | --- |
| Q1 | Who are you managing medication for right now? | single choice | confirms personal-only use for MVP | lock user into `self` mode |
| Q2 | How often do you usually need to take medicine? | single choice | estimates routine frequency | shapes future reminder defaults |
| Q3 | What is hardest for you right now? | multi choice | identifies the biggest adherence problem | influences Home empty state and nudges |
| Q4 | When are you most likely to forget? | multi choice | finds likely failure windows | informs later reminder timing presets |
| Q5 | How strong do you want reminders to feel? | single choice | matches reminder tone to user tolerance | stores reminder preference |
| Q6 | Are you taking medicine for a short illness or something ongoing? | single choice | helps separate temporary and repeated routines | informs future onboarding path |
| Q7 | Do you want quick check-ins about doses, stock, or both? | single choice | identifies the most useful early dashboard focus | drives future Home emphasis |
| Q8 | Anything else making your routine difficult? | optional text | catches edge cases without bloating the main flow | save for later form design |

## Recommended Answer Sets

### Q1 - Who are you managing medication for right now?

- Just myself
- Mostly myself, with help from someone

### Q2 - How often do you usually need to take medicine?

- Once a day
- Two times a day
- Three or more times a day
- Only when needed
- I am not sure yet

### Q3 - What is hardest for you right now?

- Remembering on time
- Keeping track of what I already took
- Managing several medicines
- Remembering to refill
- Understanding what each medicine is for

### Q4 - When are you most likely to forget?

- Early morning
- Midday
- Evening
- Late at night
- When I am outside
- When my routine changes

### Q5 - How strong do you want reminders to feel?

- Gentle
- Balanced
- Firm

### Q6 - Are you taking medicine for a short illness or something ongoing?

- A short illness
- An ongoing condition
- Not sure yet

### Q7 - Do you want quick check-ins about doses, stock, or both?

- Doses first
- Stock first
- Both equally

## Recommended Personal-Routine Segments

These are internal working labels, not user-facing labels:

| Segment | Trigger logic | Product use |
| --- | --- | --- |
| `light-routine` | low frequency + gentle reminders | reduce friction and avoid over-alerting |
| `structured-routine` | repeating schedule + balanced reminders | default personal medication flow |
| `high-support` | frequent schedule or strong reminder preference | stronger reminder surfaces later |
| `uncertain-start` | unsure answers or short illness | simpler guidance and more educational empty states |

## UX Guidance

The survey should:

- show one clear question block at a time
- keep answers tappable without typing when possible
- allow back navigation
- show visible progress
- save local progress after each step if possible

The survey should not:

- ask for medical history in MVP
- ask for diagnosis details in MVP
- ask for caregiver or family management in MVP
- feel like hospital intake paperwork

## What This Enables Later

Even in mock mode, storing these answers is useful because it lets the app later:

- adapt reminder defaults
- personalize empty states
- choose better prompt copy
- define what the second, deeper form should ask next

## Candidate Screen 2 Flow

Recommended order:

1. success after sign-in
2. short onboarding intro
3. step 1 screen
4. step 2 screen
5. completion screen
6. redirect to `Home`

## MVP Acceptance Criteria

- survey is short enough to finish in under 2 minutes
- most answers are single tap choices
- answers can be stored locally
- answers create a usable routine profile for later screens
- completion unlocks the tab experience

## Follow-Up Questions For The Next Form

After this screen is approved, the next deeper form can ask:

- current medication names
- dosage timing
- refill concerns
- symptom or routine interference

That deeper form should be designed later, not bundled into this MVP survey.

## Prompt Note For Later

When writing the next prompt for onboarding implementation:

- explicitly instruct the agent to split the survey into multiple screens
- explicitly instruct the agent to use slide transitions between onboarding steps
- keep each step lightweight and low-cognitive-load
