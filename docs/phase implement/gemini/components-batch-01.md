# Reusable Components: First Batch Definition

## Purpose
This document defines the first batch of reusable source components for the Thuocare mobile app. The goal is to establish a minimal, consistent, and implementation-friendly set of building blocks that directly support the UI/UX of the MVP screens (Sign In, Sign Up, Home, Meds, Me, Add Medication). This definition serves as the architectural spec for a Claude implementation agent.

## Component Architecture: `ui` vs. `wrapper`
The source component system is split into two primary layers for this batch, located under `src/features/components/`:

- **`ui` (Primitives):** This layer contains the raw, unstyled, and headless building blocks. Their responsibility is purely functional and accessibility-related (e.g., handling press events, accessibility props, and state management). They do not contain any visual styling from the app's design system.
- **`wrapper` (Themed Components):** This layer consumes components from `ui` and applies the application's specific visual identity, as defined in `docs/DESIGN_STYLE.md`. These are the components that screen developers will import and use directly.

## Naming Rules
- **Primitives (`ui`):** Components are suffixed with `Base`. Example: `ButtonBase`, `CardBase`.
- **Themed Wrappers (`wrapper`):** Components use their conceptual name directly. Example: `Button`, `Card`. This provides a clean, ergonomic API for screen implementation.

---

## Component Definitions: Batch 01

### 1. Typography
**Purpose:** Provides a consistent set of text roles for use across the app, mapping directly to the "Editorial Voice" defined in `DESIGN_STYLE.md`.
- **Component:** `<AppText>` (or similar)
- **Roles/Variants:**
  - `display`: For hero moments (e.g., "Good morning, David"). Uses `Plus Jakarta Sans`.
  - `headline`: For screen titles (e.g., "Meds"). Uses `Plus Jakarta Sans`.
  - `title`: For card titles and major section headers (e.g., medication names). Uses `Inter`.
  - `body`: The default for all paragraph-style content. Uses `Inter`.
  - `label`: For secondary information, captions, and input labels. Uses `Inter`.
- **Implementation Note:** The component should accept a `variant` prop and map it to the correct `fontFamily`, `fontSize`, `fontWeight`, and `lineHeight`.

### 2. Card
**Purpose:** Serves as the primary surface for containing related content, adhering to the "No-Line" rule by using background shifts for separation.
- **`ui` primitive (`CardBase`):** A simple `View` with accessibility props.
- **`wrapper` (`Card`):**
  - **Variants:**
    - `default`: Uses `surface-container-lowest` background. For primary interactive cards like medication tiles.
    - `nested`: Uses `surface-container-low` background. For grouping sections of content on a `surface` background.
  - **Styling:** Adheres to the `lg` (2rem) minimum radius and `6` (2rem) padding scale from the design system.

### 3. Button
**Purpose:** Provides clear, accessible primary and secondary actions.
- **`ui` primitive (`ButtonBase`):** A `Pressable` with accessibility roles (`button`) and state handling (hover, press).
- **`wrapper` (`Button`):**
  - **Variants:**
    - `primary`: Full-width, rounded `full`, with the signature Blue Gradient. For primary CTAs like "Sign In" or "Save Medication".
    - `secondary`: Uses `surface-container-high` background with `primary` text. For less emphasized actions.
    - `text`: A plain text button with no background or border, for tertiary actions like "Forgot Password?".
  - **Sizes:** `md` (default), `lg` (for hero actions if needed).
  - **Accessibility:** All variants must have a minimum touch target of 48x48dp.

### 4. Input
**Purpose:** A calm, clinical, and accessible text entry field.
- **`ui` primitive (`InputBase`):** An unstyled `TextInput` that forwards all standard props.
- **`wrapper` (`Input`):**
  - **States:**
    - `default`: Subtle `outline` border.
    - `focused`: `primary` color border, as per the "Focus States" rule in `DESIGN_STYLE.md`.
    - `error`: `error` color border.
    - `disabled`: Muted background and text.
  - **Visuals:** Uses a generous height (e.g., 56dp) and internal padding to feel calm and un-cramped.

### 5. Checkbox
**Purpose:** Handles binary selection for legal agreements and future preferences.
- **`ui` primitive (`CheckboxBase`):** A `Pressable` that manages `checked`/`unchecked` state and accessibility roles.
- **`wrapper` (`Checkbox`):**
  - **Visuals:**
    - A simple square or rounded square.
    - `unchecked`: `outline` color border.
    - `checked`: `primary` color background with a white checkmark icon.
  - **Use Cases:** Legal agreement on the Sign Up screen, schedule moment selection in the Add Medication flow.

### 6. Field
**Purpose:** A composition component that standardizes the layout of form fields. It is a `wrapper`-level component as it enforces a specific layout.
- **Structure:**
  - **`Label`:** An `<AppText variant="label">` positioned above the control.
  - **`Control Slot`:** A placeholder for the actual input component (e.g., `<Input>`, `<Checkbox>`).
  - **`Hint/Error Text`:** A small `<AppText>` area below the control for displaying validation errors or instructional hints.
- **Behavior:** The `Field` component manages the relationship between the label, control, and hint/error text, ensuring consistent spacing and accessibility linking.

---

## How This Batch Supports MVP Screens
- **Auth (Sign In/Up):** Uses `Field`, `Input`, `Button`, `Checkbox`, and `AppText`.
- **Home & Meds:** Use `Card` for dashboard summaries and list items, and `AppText` for all content. The `Add` button uses `Button`.
- **Me:** Uses `Card` for the profile summary, `AppText` for settings rows, and `Button` for Sign Out.
- **Add Medication:** Uses `Field`, `Input`, `Button`, `Checkbox` (for moments), and `AppText` extensively in its multi-step form.

## Intentionally Deferred
- **`composed` components:** Higher-level components like `ScreenHeader` or `MedicationTile` are deferred until this primitive batch is implemented and validated.
- **Complex Variants:** Destructive button variants, dropdown/select inputs, radio buttons, and other form controls are not included in this batch.
- **Full Theming System:** A simple, direct implementation is preferred over a complex theming context for now.
