# Sign Up Implementation Report

**Date:** 2026-03-27
**Phase:** Phase 0 - Auth And Onboarding
**Status:** Complete

## What Was Implemented

### 1. Multi-Account Local Storage Refactor

#### `src/lib/auth/storage.ts` (breaking change from v1)

The previous storage used a single `StoredAuthRecord` at key `thuocare.mock.auth-record`. It only supported one local account, which broke the spec requirement for prototype multi-account testing.

**New shape:**

```typescript
type StoredAuthRecord = {
  id: string;           // Date.now().toString(), unique per account
  phone: string;        // always required, primary identity
  email: string | null; // optional
  password: string;
  fullName: string;
  onboardingCompleted: boolean;
  routineStage: RoutineStage | null;
  reminderPreference: ReminderPreference | null;
  createdAt: string;
};

type AuthStore = {
  accounts: StoredAuthRecord[];   // list of all local accounts
  activeAccountId: string | null; // which account is currently signed in
};
```

- Stored at new key `thuocare.mock.auth-store.v2` — old single-record data is ignored cleanly
- `signedIn: boolean` field removed; replaced by `activeAccountId` presence in the store
- `phone` is now non-nullable (always required at sign-up)
- `email` stays nullable (optional)

### 2. AuthProvider Rewrite

#### `src/lib/auth/AuthProvider.tsx`

All four auth methods updated to work with the new `AuthStore`:

**`signUp(input)`** — new `SignUpInput` type:
```typescript
type SignUpInput = {
  phone: string;
  email?: string;
  password: string;
  fullName: string;
};
```
- Checks phone uniqueness across ALL accounts in the store
- Throws exact spec error on duplicate: `"This phone number is already registered. Please tap Forgot Password to recover access."`
- Creates new account, appends to `accounts[]`, sets `activeAccountId`

**`signIn(input)`** — searches across all accounts by phone or email match.

**`signOut()`** — sets `activeAccountId: null` (account remains in store for future sign-in).

**`completeOnboarding(input)`** — updates the active account in-place inside the `accounts[]` array.

**Hydration** — on startup reads store, resolves `activeAccountId` to the matching account record.

### 3. Sign Up Screen Rewrite

#### `src/app/(auth)/sign-up.tsx`

Complete rewrite per `docs/screen_feature/sign-up.md` spec.

**Field order (per spec):**
1. Full name (required)
2. Phone number (required, primary identity)
3. Email address (optional — labeled "optional" in the field)
4. Password (required, with Show/Hide toggle)
5. Confirm password (required, with Show/Hide toggle)
6. Legal acceptance checkbox
7. Submit button

**Behavioral correctness:**
- Redirect guards at top: if already `needsOnboarding` → `/onboarding`, if `ready` → tabs
- Submit disabled until all required fields are filled AND legal checkbox is checked
- `canSubmit` computed without any async work (pure derived state)
- Duplicate phone → exact spec error message surfaced in the error block with an inline "Go to Forgot Password →" link for recovery
- Legal modal: opens when tapping "Terms and Privacy Policy" text in the checkbox label
- Accepting in the modal auto-checks the checkbox
- No identifier-type toggle — phone is always required, email is always optional

**Design alignment (DESIGN_STYLE.md):**
- Hero block: `GlassSurface` with title and subtitle
- Form block: `AppCard` with `AppTextField` for each field
- Spacing: `gap: 16` between fields, standard padding
- Error block: `rgba(196, 30, 30, 0.08)` background, `#9F1D1D` text
- Legal modal: same structure as Sign In screen

## What Was Deferred

1. **Shared legal modal component** — Legal modal content is currently duplicated in `sign-in.tsx` and `sign-up.tsx`. Consolidating into a shared component is tracked in `TODO_LATER.md`.
2. **Optional email uniqueness check** — Per the open question in `docs/screen_feature/sign-up.md`, MVP tolerates duplicate emails. Added to `TODO_LATER.md`.
3. **Stronger password policy** — Min 6 chars is the only rule. No complexity requirements.
4. **Phone format normalization** — Phone stored as-is (no stripping of spaces, +countrycode). Prototype-acceptable.
5. **Email format validation** — Not checked client-side. Lightweight MVP.
6. **Onboarding progress per-account vs per-device** — `onboardingCompleted` is stored per `StoredAuthRecord`, so it is already per-account. This closes the open question from the spec.

## Changed Files

| File | Change type |
| --- | --- |
| `src/lib/auth/storage.ts` | Breaking refactor — multi-account `AuthStore` |
| `src/lib/auth/AuthProvider.tsx` | Full rewrite — all methods updated for new store |
| `src/app/(auth)/sign-up.tsx` | Full rewrite — correct fields, legal checkbox, redirects |

## Unchanged (verified still correct)

| File | Why unchanged |
| --- | --- |
| `src/app/(auth)/sign-in.tsx` | Calls `signIn({ identifier, password })` — API unchanged |
| `src/app/(auth)/onboarding.tsx` | Calls `completeOnboarding({ routineStage, reminderPreference })` — API unchanged |
| `src/app/(auth)/forgot-password.tsx` | Placeholder — unchanged |
| `src/app/(auth)/_layout.tsx` | Unchanged |
| `src/app/index.tsx` | Uses `status` only — unchanged |
| `src/app/_layout.tsx` | Unchanged |

## Testing the Sign Up Flow

**Happy path:**
1. Launch app → Sign In screen (no account)
2. Tap "Create a new prototype account"
3. Fill in: Full name, Phone, (optional Email), Password, Confirm password
4. Check legal checkbox
5. Tap "Create account"
6. App routes to Onboarding screen
7. Complete onboarding → routes to Home

**Duplicate phone error path:**
1. Create an account with phone `0912345678`
2. Sign out (or use a different device session)
3. Try to create another account with the same phone
4. Error: "This phone number is already registered. Please tap Forgot Password to recover access."
5. "Go to Forgot Password →" link appears inline in the error block

**Multi-account testing:**
1. Create account A with phone `0900000001`
2. Sign out → Sign In screen
3. Create account B with phone `0900000002`
4. Both accounts exist in store; each has independent onboarding state

**Password mismatch:**
- Error: "Passwords do not match."

**Legal checkbox not checked:**
- Submit button is disabled until checkbox is checked

## Completion Status

**Sign Up Implementation: COMPLETE FOR MVP**

All requirements from `docs/screen_feature/sign-up.md` met:
- ✓ Full name first
- ✓ Phone required, primary identity
- ✓ Email optional
- ✓ Password + confirm password
- ✓ Legal acceptance checkbox gating submission
- ✓ Duplicate phone error with exact recovery message
- ✓ Redirect guards (already authenticated → out of sign-up)
- ✓ Successful sign-up signs user in immediately
- ✓ Routes to onboarding after sign-up
- ✓ Multiple local accounts supported (storage is now a list)
- ✓ Sign-in link at bottom

Ready to move to Phase A (App Shell Foundation) or next auth feature.
