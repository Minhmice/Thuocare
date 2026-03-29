# Meds Screen Feature Spec

Last updated: 2026-03-27

## Purpose

`Meds` is the medication list surface for the MVP.

For this phase, it should:

- prioritize list clarity first
- show a lightweight dashboard summary similar in spirit to `Home`
- expose a clear trigger for adding medication
- leave edit and deeper management flows for later screens

## Locked Decisions

Based on current product direction:

- MVP starts with a `list` screen, not a detail-first flow
- `Add medication` must exist
- adding medication should route to a separate screen later
- medication tiles should prioritize:
  - name
  - dosage
  - schedule
- layout should feel logical and easy to scan
- stock information should be visible
- a small dashboard summary should exist on the screen, similar to Home
- dashboard should follow the same summary spirit as Home
- out-of-stock state can stay as a badge in MVP
- no filters in MVP
- no grouped list sections in MVP
- mock medication data should include familiar Vietnamese-friendly examples so UI review is easier
- editing or advanced management should be deferred to a later screen or trigger

## Screen Intent

The screen should feel like:

- a medication overview
- a practical reference list
- a clean starting point for future medication management

It should not feel like:

- a dense admin console
- a prescription record dump
- a fully expanded edit workflow

## Recommended Structure

Recommended order:

1. screen title and supporting context
2. compact dashboard summary
3. primary add-medication trigger
4. medication list
5. lightweight empty state if there are no medications

## Required Blocks

### 1. Compact Dashboard Summary

Purpose:

- give fast context before the user scans the list

Recommended metrics:

- total medications
- active routines today
- low stock or refill risk count

This should stay visually lighter than the Home hero.

### 2. Add Medication Trigger

Purpose:

- make the next action obvious without overloading the list

MVP rule:

- the trigger exists on Meds
- the actual add/edit screen is deferred for later definition

### 3. Medication List

Purpose:

- provide a clean overview of all current medications

Each tile should prioritize:

- medication name
- dosage
- schedule
- stock remaining
- out-of-stock badge where relevant

The tile should feel logical and stable:

- name first
- dosage and schedule as supporting lines
- stock visible but not louder than the name

## Deferred But Reserved

These are intentionally later:

- medication detail screen
- edit medication screen
- destructive actions
- advanced management triggers
- filters
- grouped sections

## MVP Acceptance Criteria

- Meds is list-first
- add-medication trigger exists
- dashboard summary exists
- dashboard summary follows the same compact logic as Home
- medication tiles prioritize name, dosage, and schedule
- stock remaining is visible
- out-of-stock can be shown as a badge
- deeper add/edit flows are clearly deferred

## Prompt Note For Later

When writing the implementation prompt later:

- keep Meds list-first
- include a compact summary area above the list
- reserve separate routes for add/edit rather than forcing inline complexity
