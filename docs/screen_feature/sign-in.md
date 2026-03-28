# Sign In Screen Feature Spec

Last updated: 2026-03-27

## Purpose

`Sign in` is the first practical entry point for the MVP auth funnel.

This screen should:

- let returning users access the app quickly
- prioritize `phone` as the primary identifier
- keep `email` as an alternative sign-in path
- preserve a lightweight prototype policy for rapid testing
- redirect signed-in users into the onboarding survey instead of tabs

## Locked Decisions

Based on current product direction:

- primary identifier: `phone`
- secondary identifier: `email`
- credentials: `phone or email` + `password`
- `forgot password`: included
- `create account`: linked from sign-in
- after successful sign-in: redirect to onboarding survey
- session persistence: local session should always stay signed in
- legal content: present via modal entry point, full implementation can be deferred
- verification: skipped for MVP
- prototype policy: lightweight and mock-friendly for testing
- error copy priority: explicitly support `wrong password`

## Screen Goals

The screen should feel:

- calm
- direct
- trustworthy
- low-friction

It should not feel:

- enterprise-heavy
- over-validated
- visually dense
- dependent on real backend policy

## Required UI Blocks

1. Hero or intro block
2. Primary credential form
3. Primary CTA
4. Forgot password action
5. Create account action
6. Legal entry point
7. Error area

## Form Structure

Recommended field order:

1. `Phone number`
2. `Email` as alternative entry path
3. `Password`

Implementation note:

- only one identity input should be actively required at a time
- the UI can present `Phone number` first and a text action such as `Use email instead`
- this is more coherent than forcing both fields to show as equally primary

## Functional Rules

### Identity Input

- `phone` is the default sign-in method
- `email` is the fallback method
- if `email` mode is active, `phone` should not be required
- if `phone` mode is active, `email` should not be required

### Password

- password is required in both sign-in modes
- password can use a visibility toggle

### Error Handling

Minimum MVP errors:

- `wrong password`
- `account not found` can remain generic for now if implementation is simpler
- field-level empty-state validation should exist, but stay lightweight

### Session

- successful sign-in should persist local session automatically
- app relaunch should keep the user signed in

### Redirect

After successful sign-in:

- if onboarding is incomplete, go to onboarding survey
- tabs should remain blocked until onboarding is completed

## Deferred But Reserved

These should be represented in the screen architecture, but may be implemented later:

- forgot password actual recovery flow
- legal modal content
- phone verification
- email verification
- social sign-in
- passkeys

## Suggested UX Notes

Research-aligned notes from platform guidance:

- Android identity guidance favors minimizing up-front sign-in option overload and keeping the flow simple.
- For MVP, that means `phone first`, `email fallback`, and no crowded list of auth methods.
- Keep copy plain and avoid over-explaining authentication mechanics.

Sources:

- [Android Credential Manager overview](https://developer.android.com/identity/sign-in)
- [Android passkey UX guidance](https://developer.android.com/design/ui/mobile/guides/patterns/passkeys)

## MVP Acceptance Criteria

- user can sign in with phone + password
- user can switch to email + password
- wrong-password state is visible
- forgot-password entry point exists
- sign-up entry point exists
- legal modal trigger exists
- session persists locally
- successful sign-in routes to onboarding instead of tabs

## Open Follow-Ups

- should phone input support country code selection in MVP, or start with one default region?
- should legal modal be shared by both sign-in and sign-up?
