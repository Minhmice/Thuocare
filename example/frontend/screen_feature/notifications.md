# Notifications Screen Feature Spec

Last updated: 2026-03-28

## Purpose

Central list for **reminder and system messages** opened from the Home header bell (MVP mock).

## MVP

- List or **empty state** when API returns `[]`.
- Row: title, time, read/unread styling (mock).
- Optional “clear all” / settings link → `Me` reminder section later.

## Mock API

- `listNotifications()` → `{ data: [], error: null }`
- `getNotificationPreferences()` → `{ data: null, error: null }`
