# Sign In Implementation Report

**Date:** 2026-03-27
**Phase:** Phase 0 - Auth And Onboarding
**Status:** Complete - Sign In, Sign Up placeholder, Onboarding, Forgot Password

## What Was Implemented

### 1. **Authentication Infrastructure**

#### `src/lib/auth/storage.ts`

- Extended `StoredAuthRecord` to support both phone and email
  - Added `phone: string | null`
  - Made `email: string | null` (was `string`)
- Signature unchanged; secure storage via expo-secure-store

#### `src/lib/auth/AuthProvider.tsx`

- Updated `SignInInput` type to use `identifier: string` (accepts phone or email)
- Updated `SignUpInput` type to include `identifierType: "phone" | "email"`
- Refactored `signIn()` to check against either phone or email in stored record
- Refactored `signUp()` to store phone or email based on user choice
- Made `CompleteOnboardingInput` less strict (no longer requires fullName since it's already in record)
- All error messages aligned with prototype behavior

### 2. **Sign In Screen** (`src/app/(auth)/sign-in.tsx`)

**Features implemented:**

- **Phone-first mode**: Primary input for phone number with `keyboardType="phone-pad"`
- **Email toggle**: "Use email" / "Use phone" button above identifier field to switch modes
- **Password visibility toggle**: Eye icon to show/hide password (from TextInput.Icon)
- **Error display**: Distinct error messages for "Incorrect password" vs "No account found"
- **Forgot Password link**: Navigates to `/forgot-password` (placeholder)
- **Create Account link**: Navigates to `/sign-up`
- **Legal modal**: Native Modal component with terms & privacy prototype text
- **Design compliance**:
  - Hero block (GlassSurface)
  - Form block (AppCard)
  - Consistent spacing and color scheme
  - No 1px borders, using surface-container hierarchy

### 3. **Sign Up Screen** (`src/app/(auth)/sign-up.tsx`)

**Features implemented (minimal but functional):**

- **Identifier type toggle**: Phone-first with email fallback (same pattern as Sign In)
- **Full name field**: Required for account creation
- **Password fields**: Password + Confirm password with visibility toggles
- **Validation**:
  - All fields required
  - Passwords must match
  - Minimum 6 characters
- **Error handling**: Clear feedback for validation failures
- **Navigation**: Back button to sign-in, also clickable footer link
- **Design**: Consistent with Sign In screen

### 4. **Onboarding Flow** (`src/app/(auth)/onboarding.tsx`)

**Step 1 (What was collected):**

- **Reminder Preference** (Q5 from spec)
  - Gentle → `"quiet"`
  - Balanced → `"balanced"`
  - Firm → `"firm"`
- **Condition Type** (Q6 from spec, mapped to routineStage)
  - Short-term → `"starting"`
  - Ongoing → `"steady"`
  - Not sure → `"resetting"`

**Step 2 (Summary & completion):**

- Display summary of selected answers
- Call `completeOnboarding()` to finalize onboarding
- Auto-redirect to `/(tabs)/home` when status becomes `"ready"`

**Design features:**

- Step indicator with progress bar (1/2, 2/2)
- Choice buttons with visual selection state (radio-style)
- Large tap targets (16px padding on buttons)
- Back navigation on step 2
- Clear error display

### 5. **Forgot Password Screen** (`src/app/(auth)/forgot-password.tsx`)

**Current state (MVP placeholder):**

- Simple explanatory screen
- Message: "Password recovery is coming in a future update"
- Options: Create new account or back to sign in
- Ready for phase 2 backend integration

## What Was NOT Implemented (Deferred)

1. **Multi-step Sign Up verification** - Currently no email/SMS verification
2. **Full onboarding question set** - Only Q5 & Q6 collected (Q1-4 deferred)
   - Q1 (who) - locked to "Just myself" for MVP, shown as confirmation only
   - Q2 (frequency) - deferred data capture
   - Q3 (hardest) - deferred
   - Q4 (when to forget) - deferred
3. **Forgot Password recovery flow** - Placeholder only, awaits backend
4. **Social/passkey authentication** - Email+password only for MVP
5. **Country code selection** - Phone stored as-is, no regional parsing
6. **Session timeout/expiration** - Sessions persist until app uninstall

## Files Changed

### Created

- `src/app/(auth)/sign-up.tsx`
- `src/app/(auth)/onboarding.tsx`
- `src/app/(auth)/forgot-password.tsx`
- `docs/phase implement/claude/sign-in.md` (this file)

### Modified

- `src/lib/auth/storage.ts` - Added phone field, made email nullable
- `src/lib/auth/AuthProvider.tsx` - Updated types and logic for phone+email auth
- `src/app/(auth)/sign-in.tsx` - Complete rewrite with phone-first UX

### Unchanged (working as-is)

- `src/app/_layout.tsx` - Root layout with AuthProvider
- `src/app/index.tsx` - Routing logic correctly handles all auth states
- `src/app/(auth)/_layout.tsx` - Stack navigation for auth routes

## Testing the Flow

**Successful path:**

1. Launch app → redirects to `/sign-in`
2. Click "Create a new prototype account"
3. On Sign Up:
   - Identifier: `0912345678` (phone) or `test@example.com` (email)
   - Full name: `John Doe`
   - Password: `password123`
   - Confirm: `password123`
4. Submit → Account created, redirects to `/onboarding`
5. On Onboarding Step 1:
   - Select "Balanced" for reminder preference
   - Select "Ongoing condition" for condition type
   - Continue → Step 2
6. On Onboarding Step 2:
   - Review summary
   - Click "Get started"
   - Redirects to `/(tabs)/home`
7. Successful sign-in + onboarding complete ✓

**Error cases tested:**

- Empty fields → validation message
- Passwords don't match → error message
- Password < 6 chars → error message
- Wrong password on sign-in → "Incorrect password."
- Account not found → "No local account found. Create one first."
- Phone-to-email toggle and back → identifier field cleared, mode updates

## Design Alignment

✓ **DESIGN_STYLE.md compliance:**

- Surface-container color hierarchy used
- No 1px borders (GlassSurface has subtle white border as per spec)
- Button radius: `borderRadius: 32` (close to "full")
- Typography: AppText variants (bodyMedium, titleMedium, headlineSmall)
- Spacing: Gap-based layouts, generous padding per spec
- Error styling: 8% opacity background with dark text (soft but legible)

✓ **UX per sign-in.md:**

- Phone-first with email alternative ✓
- Password visibility toggle ✓
- Forgot password entry point ✓
- Create account entry point ✓
- Legal entry point (modal) ✓
- Wrong-password feedback ✓
- Session persistence ✓
- Redirects correctly to onboarding ✓

✓ **Onboarding per onboarding-survey.md:**

- Short 2-step flow ✓
- Multiple-choice answers with large tap targets ✓
- Collects reminde preference and condition type ✓
- Completion unlocks tab experience ✓
- Can go back on step 2 ✓

## Next Phase Considerations

1. **Backend Ready** - Phone field addition is backward-compatible; Supabase schema can adopt same structure
2. **SMS Verification** - Forgot password phase 2 will need SMS/email integration
3. **Data Persistence** - Current prototype uses SecureStore; Supabase migration will be clean swap in SignUpInput + signIn handlers
4. **Analytics** - Currently no event logging; future phase can add onboarding question telemetry
5. **Multi-language** - All copy is English-only; future i18n phase needed

## Known Quirks / Prototype Decisions

1. **Phone stored as string** - No normalization (e.g., +1, spaces). For MVP this is fine; future backend can handle formatting.
2. **Confirm password on Sign Up** - Not in original spec but good UX for prototype; backend doesn't need to repeat validation.
3. **Step 1 layout** - Q5 and Q6 shown on same screen with scroll. Could be two separate screens if needed later.
4. **Onboarding doesn't ask for name** - Assumes it was collected during Sign Up. If user flow changes, add name field to onboarding.
5. **Forgot Password is placeholder** - No actual recovery; users must delete app or create new account. This is intentional for prototype phase.

## Completion Status

**Sign In Implementation: COMPLETE FOR MVP**

All requirements from `docs/screen_feature/sign-in.md` are implemented:

- ✓ Phone-first sign in
- ✓ Email as alternative
- ✓ Password required
- ✓ Wrong-password feedback
- ✓ Local session persistence
- ✓ Successful sign-in → onboarding (not tabs)
- ✓ Tabs blocked until onboarding complete
- ✓ Forgot Password entry point (placeholder)
- ✓ Create Account entry point (working)
- ✓ Legal modal entry point (working)

Ready to move to **Phase A: App Shell Foundation** for theme/tab shell tuning.
