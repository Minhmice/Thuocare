# Thuocare Deferred Work

Last updated: 2026-03-28

## Purpose

This file tracks work explicitly deferred by product or implementation decisions so it does not get lost between turns.

## Auth And Onboarding

- implement full forgot-password recovery flow (including actual transport, OTP, reset screen, token validation, and rate limiting)
- consolidate legal modal into a shared component (currently duplicated inline in sign-in and sign-up)
- fill in full legal content when policies are ready
- add phone and email verification when mock policy is replaced
- decide whether optional email must be unique when provided (currently tolerated as duplicate)
- implement stronger password policy (currently: min 6 chars only)
- implement social sign-up (Google, Apple) if required
- add country code selector for phone number input
- implement full notification configuration (granular settings for types, sounds, schedules)

## Account And Session

- replace lightweight local policy with stricter auth rules later
- decide long-term account storage shape after prototype phase
- decide whether local multi-account testing mode should remain after backend integration

## Core Product Screens

- implement medication database search while typing medication name
- implement medication recommendation and `what is it for` suggestion from medication data
- implement exact-time scheduling (e.g., "08:30") for medications
- implement medication strength field (e.g., "500mg")
- implement native date pickers for medication start/end dates (currently using text inputs)
- implement draft saving for Add Medication (persistence if flow is interrupted)
- define edit-medication screen or edit trigger flow
- add refill / out-of-stock trigger flow
- implement edit-profile flow for Me (including forms and functionality to change name, phone, or email)
- implement avatar upload/management for Me
- add richer medical detail in Me (e.g., medical history, conditions, prescriptions)
- add manager/caregiver/linked-person detail in Me
- move routine summary into Me settings if it still makes sense after Meds detail is defined
- decide whether Meds needs a detail screen post-MVP (MVP is list-only by decision)

## Home Screen

- pull user's name from auth store instead of mock HomeData.userName
- personalize greeting or hero copy based on onboarding routineStage / reminderPreference
- wire "Take now" action on missed dose alert (requires dose state management)
- wire stock warning banner to medication detail or refill flow
- implement medicine photo verification (camera permission, capture, upload) - reserved placement exists
- add fade/slide-out animation when a dose is marked taken
- persist dose confirmation state across screen reloads (requires backend or local state store)
- decide whether next dose hero should auto-advance to next group after confirmation
- implement dashboard expansion (weekly/monthly reports and historical trends)
- implement real medication images in Home reminder surface (currently pill icon placeholder in 80×80 slot in PrimaryMedicationCard)
- adopt PrimaryMedicationCard in Meds tab detail/expanded view when that phase starts
- implement deep linking for reminder notifications to open the Home reminder surface
- implement per-medication confirmation in the reminder surface (group confirmation is the MVP approach)
- revisit scroll-driven reminder collapse: currently removed because height change on collapse causes ScrollView offset jump; a stable-height container approach (overflow:hidden + opacity, no layout change) could reintroduce it if needed

## Backend Readiness

- swap local auth and mock data toward Supabase-backed repositories later
- define stronger recovery and error policies after backend contracts stabilize
- revisit route protection and session persistence rules after real backend integration

## UX And Design

- implement glass treatment for Dialog and Sheet components as defined in component specs
- extend localization coverage (Vietnamese strings, copy review) where product needs it
- refine Android parity for iPhone-first Expo patterns
- tune motion and polish after auth flow implementation is stable
- implement onboarding as multiple screens with slide animation when that phase starts
- refine Home screen state polish (animate AllSetCard transition, empty-schedule state)
- consider Home empty state when no schedule data exists (currently no explicit empty treatment)
