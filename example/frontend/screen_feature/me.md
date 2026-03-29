# Me Screen Feature Spec

Last updated: 2026-03-27

## Purpose

`Me` is the personal account surface for the MVP.

For this phase, it should combine:

- a calm profile summary at the top
- practical settings below
- support access near the bottom
- sign out as the last action

## Locked Decisions

Based on current product direction:

- screen tone: `clinical minimal`
- top section: `profile summary`
- lower section: `settings`
- `Sign out` sits at the bottom
- `Support / Help` sits above `Sign out`
- `notification` and `reminder` settings should exist in MVP shape
- reminder-related settings should be designed with Expo SDK integration in mind
- `edit profile` is deferred
- richer medical context is deferred
- manager / caregiver / related-person detail is deferred

## Screen Intent

The screen should feel like:

- a clear personal account snapshot
- a calm place to review account-level settings
- a lightweight control surface

It should not feel like:

- a dense admin page
- a hospital record screen
- a feature dump

## Recommended Structure

Recommended order:

1. screen title area
2. profile summary card
3. account details card
4. reminder and notification settings section
5. support section
6. sign-out action

## Required Blocks

### 1. Profile Summary

Purpose:

- identify the user quickly
- make the screen feel personal before it feels technical

Recommended contents:

- full name
- phone
- email if available
- optional placeholder visual treatment for profile image or avatar, without requiring avatar upload now

### 2. Account Details

Purpose:

- show the current core identity data without editing complexity

Recommended contents:

- full name
- phone number
- email

This can be combined with the profile summary if the layout stays clean.

### 3. Reminder And Notification Settings

Purpose:

- expose the first meaningful user controls
- make later Expo notification integration feel native and expected

Recommended MVP contents:

- reminder intensity summary
- notifications enabled / disabled placeholder or toggle-ready row
- reminder preference entry

Implementation note:

- this area should be shaped for future Expo notifications usage
- actual notification permission and scheduling complexity can stay light in MVP

### 4. Support / Help

Purpose:

- give the user a safe non-destructive help entry point

Recommended contents:

- help or support row
- FAQ or guidance placeholder if needed

### 5. Sign Out

Purpose:

- provide a clear account-exit action

Placement:

- always last on the screen
- visually separated from normal settings rows

## Suggested UX Guidance

- keep section count low
- use strong vertical rhythm instead of many dividers
- avoid crowding with future account-management fields
- keep rows tappable and simple
- preserve a calm profile-first hierarchy

## What To Defer

These are intentionally not MVP:

- edit profile flow
- avatar upload flow
- disease or medical history detail
- manager / caregiver / linked-person detail
- deeper routine summary embedded in Me

## MVP Acceptance Criteria

- user sees a clear personal summary
- user sees settings below the summary
- reminder and notification settings are visibly reserved in the screen
- support/help exists near the bottom
- sign out is the bottom-most action
- screen remains clinically minimal and not overloaded

## Prompt Note For Later

When writing the implementation prompt later:

- keep `Me` as profile-summary-first
- treat settings as secondary, not the hero
- place support above sign out
- reserve reminder and notification rows for Expo-based settings work
