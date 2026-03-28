/**
 * Mock auth test accounts for local development.
 *
 * These are seeded into the local store on first app launch (when no accounts exist).
 * Edit freely to adjust test credentials or onboarding state.
 *
 * To reset and re-seed: delete the app from the device/simulator, or bump
 * AUTH_STORE_KEY in src/lib/auth/storage.ts to a new version string.
 *
 * All accounts use password: test1234
 */

import type { StoredAuthRecord } from "../lib/auth/storage";

export const MOCK_AUTH_ACCOUNTS: StoredAuthRecord[] = [
  {
    // Fully onboarded. Use phone 0912345678 or email david@example.com to sign in.
    // Forgot Password will report destination: 091***678 or d***@example.com
    id: "mock-001",
    fullName: "Tran Tue Minh",
    phone: "0912345678",
    email: "minhmice2908@gmail.com",
    password: "test1234",
    onboardingCompleted: true,
    routineStage: "steady",
    reminderPreference: "balanced",
    createdAt: "2026-01-15T08:00:00.000Z",
  },
  {
    // Fully onboarded, quiet reminders. Use phone 0987654321 or email mai.tran@example.com.
    // Forgot Password will report destination: 098***321 or m***@example.com
    id: "mock-002",
    fullName: "Mai Tran",
    phone: "0987654321",
    email: "mai.tran@example.com",
    password: "test1234",
    onboardingCompleted: true,
    routineStage: "starting",
    reminderPreference: "quiet",
    createdAt: "2026-02-20T10:00:00.000Z",
  },
  {
    // Onboarding NOT completed. Signs in and lands on the onboarding survey.
    // Use phone 0909090909. No email — Forgot Password phone-only test.
    // Forgot Password will report destination: 090***909
    id: "mock-003",
    fullName: "Linh Pham",
    phone: "0909090909",
    email: null,
    password: "test1234",
    onboardingCompleted: false,
    routineStage: null,
    reminderPreference: null,
    createdAt: "2026-03-01T09:00:00.000Z",
  },
];
