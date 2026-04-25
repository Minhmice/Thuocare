# Reusable Components: Second Composed Batch Definition

## Purpose

This document defines the second batch of **composed** components: `SettingsSection` and `SupportSection`. These components provide structured, list-like layouts for the `Me` screen, ensuring a consistent and clinically minimal presentation for account settings and help resources. This definition serves as the architectural spec for a Claude implementation agent.

## Role of Composed Components

This batch continues the work of assembling primitives into meaningful UI patterns. These components are responsible for the layout and visual grouping of related interactive rows, but not for the state management or navigation logic, which remains at the screen level.

---

## Component Definitions: Composed Batch 02

### 1. `SettingsSection`

**Purpose:** A primary component for grouping and displaying lists of settings. It creates a clear visual hierarchy with a title and an enclosing card.

**Composition from Lower Layers:**

- **Root:** A `View` acting as the main container.
- **Header:** An `<AppText variant="title">` to serve as the section title (e.g., "Reminders & Notifications").
- **Container:** A `<Card variant="nested">` (`surface-container-low`) that wraps the interactive rows, providing visual grouping.
- **Rows:** The component accepts an array of `items` and renders a `SettingsRow` for each.
- **`SettingsRow` (Sub-Component/Internal Pattern):**
  - A root `Pressable` for interactivity.
  - **Leading Icon:** An `<Icon>` to provide a visual cue for the setting.
  - **Text Label:** An `<AppText variant="body">` for the setting's title.
  - **Trailing Affordance (Slot):** An optional slot on the trailing side that can accept a chevron icon (`<Icon name="chevron-right">`) for navigation, a toggle/switch component, or a simple text value.

**Layout Hierarchy & Behavior:**

- The section `title` has a generous bottom margin to separate it from the `Card`.
- Inside the `Card`, rows are separated by the `<Separator>` component to maintain the "No-Line" aesthetic while providing clear boundaries.
- The component's API should accept an array of data, e.g., `items: { label: string; icon: string; onPress: () => void; trailing?: React.ReactNode; }[]`.

**Density and Spacing:**

- The component must feel calm and un-cramped. Rows should have a minimum height of ~56dp with ample horizontal padding.

**MVP Screen Mapping:**

- **Me Screen:** Used for the "Account Details" and "Reminders & Notifications" sections.

### 2. `SupportSection`

**Purpose:** A visually lighter, secondary version of the `SettingsSection`, intended for help and informational links that need to feel distinct from primary settings.

**Composition from Lower Layers:**

- **Root:** A `View` acting as the main container.
- **Header:** An optional `<AppText variant="title">`.
- **Rows:** Renders a list of `SupportRow` items.
- **`SupportRow` (Sub-Component/Internal Pattern):**
  - Composition is identical to `SettingsRow` (`Pressable`, leading `<Icon>`, `<AppText>`, trailing `<Icon>`).
  - **Differentiation:** It may use slightly different styling to appear secondary, for instance, by using a smaller `title` variant for its label or being rendered without an enclosing `Card`.

**Layout Hierarchy & Behavior:**

- To differentiate from `SettingsSection`, this component does **not** use a wrapping `<Card>`. It renders its rows directly on the screen's base `surface`.
- Rows are separated by `<Separator>` components.
- This creates a less contained, more "lightweight" feel suitable for its secondary role.

**Accessibility Guidance:**

- Each row in both `SettingsSection` and `SupportSection` must be a single, focusable element with a clear `accessibilityLabel` describing its action (e.g., "Reminder Intensity, button").

**MVP Screen Mapping:**

- **Me Screen:** Used for the "Help & Support" and "About" links that sit above the final "Sign Out" action.

---

## Intentionally Deferred

- **Complex Row Types:** Rows with sliders, steppers, or inline text inputs are deferred. The trailing slot for MVP is limited to a simple icon or toggle.
- **Nested Sections:** The ability to nest `SettingsSection`s within each other is not supported.
- **Sign Out Button:** The "Sign Out" action is a standalone `Button` and is not part of the `SupportSection` component itself.
- **Automatic Routing:** These components do not handle their own navigation. The `onPress` handlers are passed in from the parent screen.
