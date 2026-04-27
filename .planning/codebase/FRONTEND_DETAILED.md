## 1) Overview & runtime entry

- Runtime boot is `package.json` `main: "index.js"` -> `index.js`, which initializes `react-native-gesture-handler` and `react-native-reanimated`, then loads `expo-router/entry`.
- Expo runtime config in `app.json` sets deep-link `scheme: "thuocare"`, enables `expo-router` plugin, and enables `experiments.typedRoutes`.
- Global provider boundary is defined in `src/app/_layout.tsx` `RootLayout` with this nesting order: `GestureHandlerRootView` -> `SafeAreaProvider` -> `LanguageProvider` -> `AuthProvider` -> `PaperProvider(theme=paperTheme)` -> `MedicationsProvider` -> `Stack`.
- `RootLayout` also mounts `StatusBar`, `AndroidNavigationBar`, and a `Stack.Screen` override for `name="reminder/[doseId]"` with `presentation: "fullScreenModal"`.

## 2) Routing map (major routes)

- Root redirect route is `src/app/index.tsx` `IndexScreen`; it branches on `useAuth().status`: `"loading"` -> `LoadingState`, `"signedOut"` -> `/sign-in`, `"needsOnboarding"` -> `/onboarding`, else -> `/(tabs)/home`.
- Auth group lives in `src/app/(auth)/_layout.tsx` (`Stack` with `headerShown: false`) and contains:
  - `src/app/(auth)/sign-in.tsx`
  - `src/app/(auth)/sign-up.tsx`
  - `src/app/(auth)/onboarding.tsx`
  - `src/app/(auth)/survey.tsx`
  - `src/app/(auth)/forgot-password.tsx` (redirect-only to `/sign-in`).
- Tabs group is `src/app/(tabs)/_layout.tsx` `TabsLayout`, with `Tabs.Screen` routes `home`, `meds`, `me`, and `tabBar={() => null}` (custom tab bar rendered by screens).
- Non-tab app routes are `src/app/feedback.tsx`, `src/app/meds/add.tsx`, and `src/app/reminder/[doseId].tsx`.
- Navigation is imperative in screen flows via `router.push`, `router.replace`, and `router.back` (for example in auth, meds add/edit, feedback, and reminder actions).

## 3) Screen patterns (loading/error/data)

- Shared state shells are:
  - `src/components/state/LoadingState.tsx` (`Spinner` + fade-in animation)
  - `src/components/state/ErrorState.tsx` (fade-in + optional retry button via `onRetry`)
  - `src/components/state/EmptyState.tsx`.
- Tabs and reminder screens use explicit state branches:
  - `src/app/(tabs)/home.tsx` gates on meds load/error, profile load/error, then renders data.
  - `src/app/(tabs)/meds.tsx` gates on provider `loading/error` before list/empty render.
  - `src/app/(tabs)/me.tsx` gates on auth record, profile loading, profile error.
  - `src/app/reminder/[doseId].tsx` gates on meds load/error and reminder VM states (`idle/loading/error/not_found/ready`).
- Data loading style is hook-driven and route-local: `useMedicationsData()` from `MedicationsProvider`, `useFocusEffect()` for profile refresh (`home`, `me`), and minute-based recomputation in reminder via `useMinuteTicker()`.
- Retry affordances are standardized where possible: `ErrorState` with `onRetry` delegates to route-level refresh methods (`refresh`, `loadProfile`, `loadVm`).

## 4) Data layer (repositories, domain types)

- Repository modules and responsibilities:
  - `src/features/meds/repository.ts`: fetches remote `medications` rows, merges with local store (`getLocalMedications`), maintains `cachedRemoteMedications`, supports optimistic delete flags (`markRemoteDeletePending` / `clearRemoteDeletePending`), and exposes remote CRUD (`upsertMedicationRemote`, `deleteMedicationRemote`).
  - `src/features/me/repository.ts`: reads `profiles` row (`getProfile`) and maps to `UserProfile`.
  - `src/features/home/repository.ts`: `getHomeData()` composes `getProfile()` + `getMedications()` + `computeDailySummary()`.
  - `src/features/reminder/repository.ts`: builds reminder VM (`getReminderDoseVM`) and action handlers (`markDoseTaken`, `snoozeDose10m`, `snoozeDose`, `skipDose`) using local reminder state plus best-effort persistence to `dose_occurrences` and `dose_events`.
  - `src/features/feedback/repository.ts`: optional screenshot upload to Supabase Storage bucket `feedback-screenshots`, then inserts into `app_feedback` with rollback if insert fails.
- Shared provider-backed data source:
  - `src/lib/meds/MedicationsProvider.tsx` exposes `{ items, loading, error, refresh }`, performs initial async fetch with `getMedications()`, and subscribes to local mutations via `subscribeLocalMedications()` + `getMedicationsMerged()`.
- Supabase access boundary:
  - `src/lib/supabase/client.ts` exports configured client.
  - `src/lib/supabase/queryUser.ts` resolves signed-in user id.
  - `src/lib/supabase/profileRepository.ts` contains profile row fetch/mapping helpers used by auth hydration.
- Domain/type surface:
  - `src/types/medication.ts` (`Medication`, `MedicationWizardSnapshot`, `UserProfile`).
  - `src/types/home.ts` (`HomeData`, `NextDoseGroup`, `ScheduledDose`).
  - `src/types/onboarding-survey.ts` (`OnboardingSurveyAnswers`, question enums, completion guard).

## 5) Auth/onboarding flow (as implemented)

- Session/status machine is centralized in `src/lib/auth/AuthProvider.tsx`:
  - Status values: `"loading" | "signedOut" | "needsOnboarding" | "ready"`.
  - Hydration uses `supabase.auth.getSession()` and `supabase.auth.onAuthStateChange(...)`.
  - Profile-backed auth record is derived via `fetchProfileRowWithRetry`, `backfillProfilePhoneIfMissing`, and `profileRowToStoredRecord`.
- Sign-in path (`signIn`) resolves phone/email identifiers (`resolveAuthEmailFromIdentifier`) and authenticates with `supabase.auth.signInWithPassword`.
- Sign-up path (`signUp`) supports optional email, synthetic email fallback (`syntheticEmailFromPhone`), profile contact sync (`syncProfileContact`), and explicit post-signup redirect signaling via `RedirectToSignInAfterSignUp` (handled by `src/app/(auth)/sign-up.tsx`).
- Onboarding route gating:
  - `src/app/(auth)/onboarding.tsx` only allows `"needsOnboarding"` and starts survey route.
  - `src/app/(auth)/survey.tsx` is multi-step (0..8), validates per-step answers, persists draft to `SecureStore` via `readOnboardingSurveyDraft` / `writeOnboardingSurveyDraft`, and calls `completeOnboarding`.
- `completeOnboarding` writes to `profiles` (`onboarding_completed`, `onboarding_survey`, `reminder_preference`, `routine_stage`, `routine_segment`) then clears draft state (`clearOnboardingSurveyDraft`).

## 6) Reminder feature (as implemented)

- Route entry is `src/app/reminder/[doseId].tsx`; the modal presentation comes from `src/app/_layout.tsx` stack config.
- Dose identity and parsing are in `src/lib/reminder/doseId.ts` (`formatDoseId`, `parseDoseId`) using `scheduledDate + "T" + scheduledAt`.
- VM derivation path:
  - `getReminderDoseVM` in `src/features/reminder/repository.ts` filters medications by `scheduledDate/scheduledAt`, merges local and remote dose state, computes status via `getDoseWindowStatus` (`src/lib/reminder/domain.ts`), then maps to `ReminderDoseVM` (`src/lib/reminder/vm.ts`).
- Action path:
  - Confirm -> `markDoseTaken` updates local meds (`upsertLocalMedication`) and attempts persistence.
  - Snooze -> `snoozeDose` / `snoozeDose10m` updates local reminder state and attempts persistence.
  - Skip -> `skipDose` updates local reminder state and attempts persistence.
- Persistence is tolerant by design: missing-table signals for `dose_occurrences` / `dose_events` are handled without hard-failing UI actions.
- Local reminder state store is `src/lib/reminder/localReminderStore.ts`; reminder screen recomputes every minute via `useMinuteTicker` (`src/lib/reminder/useMinuteTicker.ts`).
- Primary reminder UI is `src/features/components/composed/reminder-experience/index.tsx` with slider confirmation using `SliderConfirm` (`src/features/components/composed/slider-confirm/index.tsx`) and skip confirmation dialog in `src/app/reminder/[doseId].tsx`.

## 7) i18n/localization system

- Localization provider is `src/lib/i18n/LanguageProvider.tsx` (`LanguageProvider`, `useLanguage`) and is mounted globally in `RootLayout`.
- Supported app languages are `en | vi` (`src/lib/i18n/storage.ts` `AppLanguage`); persistence is via `expo-secure-store` (`readLanguage`, `writeLanguage`) with fallback default `"en"`.
- Translation retrieval uses `t(key, params?)` with interpolation by `{{token}}` replacement.
- Route labels in `src/app/(tabs)/_layout.tsx` are localized with `t("tab_home" | "tab_meds" | "tab_me")`.
- Observed localization drift in composed components:
  - Hardcoded tab labels in `src/features/components/composed/main-tab-bar/index.tsx` (`"Trang Chủ"`, `"Thuốc"`, `"Tôi"`).
  - Hardcoded reminder copy in `src/features/components/composed/reminder-experience/index.tsx` (for example `"Due now"`, `"Snooze 10 min"`).
  - Hardcoded stock/status labels in `src/features/components/composed/medication-tile/index.tsx` (for example `"HẾT"`, `"SẮP HẾT"`, `"Out of stock"` fallback).

## 8) Theming/UI primitives

- Theme source is `src/theme/paperTheme.ts` (`paperTheme` from `MD3LightTheme` with overridden tokens like `primary`, `surface`, `outline`, `roundness`).
- Global Paper boundary is `PaperProvider(theme={paperTheme})` in `src/app/_layout.tsx`.
- Base UI wrapper layer in `src/components/ui/*` includes `AppScreen`, `AppCard`, `AppText`, `AppButton`, `AppTextField`, `GlassSurface`.
- State-shell layer is `src/components/state/*` and is reused in route-level loading/error/empty handling.
- Feature UI layer in `src/features/components/*` is split by `ui`, `wrapper`, and `composed` modules (examples: `Typography`, `Card`, `PrimaryButton`, `ReminderExperience`, `MainTabBar`, `MedicationTile`, `SliderConfirm`).
- Cross-screen UI state provider `UIProvider` in `src/lib/ui-context.tsx` carries `homeScrollY` and `isHomeReminderActive`, and wraps all tabs in `src/app/(tabs)/_layout.tsx`.
- Android system UI behavior is handled in `src/lib/system/AndroidNavigationBar.tsx` (`NavigationBar.setVisibilityAsync("visible")`, `NavigationBar.setStyle("dark")` on Android).

## 9) Config/build notes (expo/eas relevant)

- `app.json` Expo config highlights:
  - `scheme: "thuocare"` and `plugins: ["expo-router", "expo-secure-store", "expo-navigation-bar", "expo-font", "expo-image-picker"]`.
  - `experiments.typedRoutes: true`.
  - `extra.eas.projectId` is present.
  - `expo-navigation-bar` and `expo-image-picker` plugin options are configured.
- `eas.json` build pipeline highlights:
  - `cli.version: ">= 18.4.0"`, `appVersionSource: "remote"`.
  - Build profiles: `development` (`developmentClient: true`, `distribution: "internal"`), `preview` (`distribution: "internal"`), `production` (`autoIncrement: true`).
  - Submit profile exists at `submit.production`.
- Runtime environment requirements are enforced by `src/lib/env.ts` `getEnvConfig()`:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Supabase auth session persistence uses custom storage adapter `supabaseAuthStorage` in `src/lib/supabase/authStorage.ts` (web localStorage/memory fallback; native SecureStore with chunking).

## 10) Gaps/risks and next refactor opportunities

- **Localization drift**: composed widgets bypass `useLanguage().t` in `main-tab-bar`, `reminder-experience`, and `medication-tile`; move route/component labels to `LanguageProvider` keys for consistent bilingual behavior.
- **ReminderExperience prop mismatch**: `ReminderExperienceProps` in `src/features/components/composed/reminder-experience/index.tsx` includes `children`, `viewportHeight`, `topInset`, `scrollY`, but render path only consumes `nextDose` + action callbacks; remove/align unused props and callers (`home`, `reminder/[doseId]`).
- **Slider sizing abstraction is incomplete**: `SliderConfirmProps.size` (`src/features/components/composed/slider-confirm/types.ts`) and `SIZE_CONFIG` (`constants.ts`) exist, but `index.tsx` uses fixed geometry and does not apply size variants; wire size to dimensions or delete dead abstraction.
- **Toast effect sensitivity**: `src/features/components/ui/toast/index.tsx` `useEffect` depends on `onDismiss`; unstable callback identities can restart sequence unexpectedly. Consider stable callback wrapping or internal one-shot guarding.
- **Unused import debt**: `src/features/components/ui/sheet/index.tsx` imports `PanResponder` but does not use it.
- **Theme type safety**: `paperTheme` is cast with `as any` in `src/theme/paperTheme.ts`, which weakens type checking against `MD3Theme`.
- **Potential dead component**: `GradientButton` appears defined in `src/features/components/wrapper/button/gradient/index.tsx` but has no runtime usage in `src/**` imports.
- **Data-path duplication**: `src/features/home/repository.ts` provides `getHomeData()`, but `src/app/(tabs)/home.tsx` currently computes equivalent summary directly (`getProfile` + `computeDailySummary` + provider meds). Consolidating to one path would reduce divergence risk.
