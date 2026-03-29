# Auth Success And Transition State Spec

Last updated: 2026-03-27

## Purpose

This screen pattern covers the short state between:

- successful `Sign in` or `Sign up`
- entry into onboarding
- completion of onboarding
- entry into `Home`

It is not a destination screen. It is a transition layer.

## Why It Exists

Without a dedicated transition state, auth can feel abrupt:

- user submits a form
- app immediately jumps to the next route
- there is no emotional confirmation that progress worked

A short auth-success state can make the flow feel:

- calmer
- more trustworthy
- more intentional

## Recommended Use Cases

Use this state in two places:

1. after successful sign-in or sign-up, before onboarding starts
2. after onboarding completion, before entering `Home`

## Screen Intent

### After Sign In / Sign Up

The message should communicate:

- success
- continuity
- next step is a short setup flow

Recommended intent:

- `You're in. Let's set up your routine.`

### After Onboarding

The message should communicate:

- progress is saved
- the app is ready
- next stop is `Home`

Recommended intent:

- `You're ready. Let's start with today.`

## Recommended Structure

Each auth-success transition screen should contain:

1. success mark or calm positive visual
2. short headline
3. one-line explanation
4. progress cue or short loading cue
5. automatic route transition

## Motion Guidance

This state should feel soft and short.

Recommended motion:

- subtle fade + upward settle on content entrance
- short hold state
- route transition after a brief pause

Recommended timing:

- content entrance: `200ms`
- readable hold: `500ms` to `900ms`
- then route forward automatically

If the transition is between onboarding steps:

- use slide animation there instead of success-state fade

## Navigation Rules

### Auth To Onboarding

After successful sign-in or sign-up:

- show success transition state
- then move into onboarding intro or first onboarding step

### Onboarding To Home

After onboarding completion:

- show success transition state
- then route to `Home`

## UX Guidance

The state should:

- reassure the user that the action worked
- reduce the feeling of abrupt route jumps
- keep copy minimal
- avoid buttons unless the route is blocked

The state should not:

- behave like a full page the user needs to manage
- ask for more input
- delay the flow too long

## MVP Acceptance Criteria

- successful auth can show a short success transition before onboarding
- onboarding completion can show a short success transition before Home
- the transition feels calm and not abrupt
- the user is not forced to tap through unnecessary confirmation screens

## Prompt Note For Later

When writing the implementation prompt later:

- treat auth success as a lightweight transition state, not a full standalone feature
- keep the copy very short
- prefer automatic forward movement
- keep the animation subtle and calm
