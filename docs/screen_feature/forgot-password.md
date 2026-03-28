# Forgot Password Feature Spec

Last updated: 2026-03-27

## Purpose

`Forgot Password` is a support flow shared by:

- the Sign In screen
- the duplicate-phone error path in Sign Up

For the MVP, this is a mock-friendly recovery helper, not a real recovery service.

## Locked Decisions

Based on current product direction:

- surface: modal popup
- input mode: user can recover with either `phone` or `email`
- there is no priority between phone and email
- if the entered identifier exists in local data, the app should simulate sending recovery information to that same channel
- if the user entered an email, recovery is simulated to email
- if the user entered a phone number, recovery is simulated to phone
- if the identifier does not exist in local data, recovery should not be sent
- the modal is shared by both:
  - Sign In
  - duplicate-phone guidance in Sign Up

## Screen Goals

The modal should feel:

- supportive
- short
- easy to understand
- low-friction

It should not feel:

- like a full account-recovery workflow
- clinical or legal-heavy
- dependent on real backend messaging

## Required UI Blocks

1. Modal title
2. Short explanation text
3. One identifier input
4. Primary CTA
5. Cancel or close action
6. Result message area

## Input Rules

The input can accept:

- phone
- email

Behavior:

- detect which form the user entered
- check whether that phone or email exists in local account data
- only simulate recovery if a matching account exists

## Response Rules

### If identifier exists

- simulate sending recovery information
- if input is email, message should reference email delivery
- if input is phone, message should reference phone delivery

Suggested MVP message examples:

- `We sent recovery instructions to your email.`
- `We sent recovery instructions to your phone.`

### If identifier does not exist

- do not simulate sending recovery information
- surface a lightweight failure message suitable for prototype mode

Suggested MVP message example:

- `We could not find an account with that phone or email.`

## UX Guidance

- keep the modal short and focused on one task
- avoid asking both phone and email in separate fields
- allow the same modal component to open from Sign In and Sign Up
- keep copy plain and recovery-oriented
- make the success state feel helpful even though delivery is simulated

## Prototype Policy

This is a mock flow:

- no real OTP
- no real email delivery
- no verification step
- no password reset screen is required yet

## MVP Acceptance Criteria

- modal popup can open from Sign In
- modal popup can open from duplicate-phone guidance in Sign Up
- user can enter either phone or email
- app checks local account data
- success is simulated only when the identifier exists
- failure state is shown when the identifier does not exist

## Deferred Work

- real recovery transport
- OTP flow
- reset-password screen
- token validation
- backend-backed rate limiting
