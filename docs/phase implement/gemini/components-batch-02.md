# Reusable Components: Second Batch Definition

## Purpose

This document defines the second batch of reusable source components, focusing on overlays, feedback patterns, and structural helpers. This batch builds upon the foundation of Batch 01 to support more complex interactions like confirmations, notifications, and loading states required by the MVP screens. This definition serves as the architectural spec for a Claude implementation agent.

## Component Architecture: `ui` vs. `wrapper`

The `ui` (primitive) vs. `wrapper` (themed) pattern established in Batch 01 continues. Primitives handle raw functionality and accessibility, while wrappers apply the specific "clinical minimal" aesthetic from `docs/DESIGN_STYLE.md`.

## Naming Rules

- **Primitives (`ui`):** `<ComponentName>Base` (e.g., `DialogBase`).
- **Themed Wrappers (`wrapper`):** `<ComponentName>` (e.g., `Dialog`).

---

## Component Definitions: Batch 02

### 1. Icon

**Purpose:** To provide a consistent API for using icons throughout the app, standardizing size and color. This wrapper will abstract the underlying icon library (`MaterialCommunityIcons` or similar).

- **Component:** `<Icon>`
- **Guidance:**
  - **`size` prop:** Defines a set of standard t-shirt sizes mapped to pixel values.
    - `sm`: 16px
    - `md`: 24px (default)
    - `lg`: 32px
  - **`color` prop:** Maps to theme tokens, not raw color strings.
    - `primary`, `secondary`, `tertiary`, `error`, `onSurface`, `onSurfaceVariant`. Defaults to `onSurface`.
- **Implementation Note:** This is a pure `wrapper` component with no `ui` primitive. It wraps the chosen icon library.

### 2. Dialog

**Purpose:** A modal overlay used for critical confirmations or alerts that require a user decision.

- **`ui` primitive (`DialogBase`):** A headless component that handles modal presentation, focus trapping, and accessibility (e.g., `aria-modal`).
- **`wrapper` (`Dialog`):**
  - **Visuals:**
    - Uses a `Surface-Dim` overlay to darken the background.
    - The dialog itself is a `Card` (`surface-container-lowest`).
  - **Structure:**
    - **Title:** `<AppText variant="headline">`.
    - **Content:** `<AppText variant="body">`.
    - **Actions:** A footer area containing one or two `Button` components (e.g., a `primary` "Confirm" and a `text` "Cancel").
  - **Use Case:** "Are you sure you want to sign out?" confirmation on the Me screen.

### 3. Sheet

**Purpose:** A bottom-anchored modal surface for contextual actions or additional information.

- **`ui` primitive (`SheetBase`):** A headless component managing the slide-up/down animation from the bottom of the screen.
- **`wrapper` (`Sheet`):**
  - **Visuals:**
    - A "grab handle" at the top to indicate draggability.
    - Uses the "Glass & Gradient Rule" for its surface treatment, providing a blurred background effect.
  - **Behavior:** For MVP, this component is for display only. Full gesture-based control (swiping to dismiss) is deferred. It will be dismissed via a button or by tapping the backdrop.

### 4. Toast

**Purpose:** Provides brief, non-interruptive feedback to the user after an action.

- **`ui` primitive (`ToastBase`):** A headless component that manages the presentation, auto-dismiss timer, and screen positioning (e.g., top or bottom).
- **`wrapper` (`Toast`):**
  - **Variants:**
    - `info` (default): Neutral background (`surface-container-high`).
    - `success`: Green-tinted background.
    - `error`: Red-tinted background (`error` container color).
  - **Behavior:** Toasts appear for a short duration (e.g., 3 seconds) and then automatically animate out. They are not dismissible by the user.

### 5. Separator

**Purpose:** A low-contrast horizontal line used for visual separation _only when necessary_.

- **Component:** `<Separator>`
- **Usage Rule:** Per the "No-Line" Rule in `DESIGN_STYLE.md`, this component should be used sparingly. Prefer surface shifts or vertical rhythm for separation. Use cases are limited to scenarios like separating items within a single, long list inside a `Card`.
- **Visuals:**
  - A 1px tall `View`.
  - Color defaults to a low-contrast theme token like `outline` at 50% opacity.

### 6. Spinner

**Purpose:** Provides visual feedback that a process is underway.

- **Component:** `<Spinner>`
- **Guidance:** This is a wrapper around the native `ActivityIndicator`.
  - **`size` prop:**
    - `sm`: 16px
    - `md`: 24px
    - `lg`: 48px (for full-screen loading states).
  - **`color` prop:** Defaults to `primary` theme color.
- **Use Case:** Can be placed inside a `Button` to indicate a pending action, or centered in a screen for a loading state.

---

## How This Batch Supports MVP Screens

- **`Icon`:** Used throughout the app in buttons, form fields, and lists.
- **`Dialog`:** Essential for the "Sign Out" confirmation flow on the "Me" screen.
- **`Sheet`:** Placeholder for future "Forgot Password" or "Help" flows that may originate from a bottom sheet.
- **`Toast`:** Can be used to confirm "Dose taken" on the Home screen or "Medication saved" after the Add Medication flow.
- **`Separator`:** Could be used within the "Review" step of the Add Medication flow to separate summary sections.
- **`Spinner`:** For indicating loading states on Home, Meds, and Me when fetching data.

## Intentionally Deferred

- **Complex Overlays:** Full-featured bottom sheet with swipe-to-dismiss gestures and dynamic height.
- **Custom Toasts:** Toasts with interactive elements or custom layouts.
- **Full Theming:** Dark mode and other theming capabilities remain deferred.
- **`composed` Components:** No `composed` components are defined in this batch.
