# Sign Up Screen Feature Spec

Last updated: 2026-03-27

## Purpose

`Sign up` is the account creation screen for the MVP auth funnel.

This screen should:

- let new users create a prototype account quickly
- prioritize `phone` because it is the most practical identity method for the local audience
- keep `email` available but optional
- collect enough information to create a useful local account
- send the user directly into the onboarding survey after account creation

## Locked Decisions

Based on current product direction:

- required fields: `full name`, `phone`, `password`, `confirm password`
- optional field: `email`
- field order starts with `full name`
- `phone` is the main identity
- `email` is optional because many users may not rely on it
- successful sign-up redirects directly to the onboarding survey
- survey completion then redirects to `Home`
- if phone already exists, show a clear error:
  - `This phone number is already registered. Please tap Forgot Password to recover access.`
- a legal acceptance checkbox is required before account creation
- prototype mode should allow multiple local accounts for UI testing

## Screen Goals

The screen should feel:

- calm
- direct
- easy to complete in one pass
- reassuring for users who may be unwell or tired

It should not feel:

- bureaucratic
- long
- over-validated
- dependent on real backend rules

## Required UI Blocks

1. Intro block
2. Account creation form
3. Legal acceptance checkbox
4. Primary CTA
5. Sign-in entry point
6. Error area

## Form Structure

Recommended field order:

1. `Full name`
2. `Phone number`
3. `Email` optional
4. `Password`
5. `Confirm password`
6. legal acceptance checkbox

Reasoning:

- `full name` first makes the flow feel more personal and less mechanical
- `phone` stays near the top because it is the real primary identifier
- `email` is present but visually secondary
- `confirm password` is kept because this is account creation, not sign-in

## Functional Rules

### Full Name

- required
- plain text input
- should support Vietnamese names without unnecessary restrictions

### Phone

- required
- primary identity field
- must be unique in prototype data
- if the phone already exists, show the dedicated error message

### Email

- optional
- if provided, it can be stored as secondary contact information
- validation should stay lightweight in MVP

### Password

- required
- confirm password is required
- mismatch should surface clearly before submission

### Legal Acceptance

- checkbox is required before account creation
- legal content itself can be shown through Expo-compatible modal or sheet flow later
- the MVP screen must still make acceptance explicit

### Redirect

After successful sign-up:

- create the local account
- sign the user in immediately
- route directly to onboarding survey
- after onboarding, route to `Home`

## Local Prototype Policy

This MVP should remain mock-friendly:

- multiple local accounts are allowed for UI testing
- policy can stay lightweight
- no verification is required
- no real recovery flow is required yet

Implementation implication:

- local account storage should support account lists rather than a single account record

## Error Handling

Minimum MVP errors:

- phone already registered
- password mismatch
- required field missing
- legal checkbox not accepted

Optional MVP errors:

- invalid email format if email is entered

## Deferred But Reserved

These should be represented in architecture, but may be deferred:

- real forgot-password recovery
- phone verification
- email verification
- full legal modal content
- stronger password policy

## MVP Acceptance Criteria

- user can create an account with full name, phone, password, and confirm password
- email is optional
- legal checkbox is required
- duplicate phone error is explicit
- successful sign-up signs the user in
- successful sign-up routes directly to onboarding
- onboarding then routes to `Home`
- multiple local accounts are possible in prototype mode

## Follow-Ups

- should email also be unique when provided, or can MVP tolerate duplicates for now?
- should onboarding progress be saved per account or globally per device?
