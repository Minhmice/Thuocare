# Reusable Components: First Composed Batch Definition

## Purpose
This document defines the first batch of **composed** components. These components assemble primitives and wrappers from Batch 01 and 02 into meaningful, reusable UI patterns that are shared across multiple MVP screens. The goal is to accelerate screen development and ensure a consistent user experience for common layouts like headers, banners, and dashboards. This definition serves as the architectural spec for a Claude implementation agent.

## Role of Composed Components
Composed components live in `src/features/components/composed`. They are opinionated about their internal layout and the types of primitives they contain, but flexible enough to be used in different contexts. They represent the first layer of real UI patterns, moving beyond basic elements.

---

## Component Definitions: Composed Batch 01

### 1. `ScreenHeader`
**Purpose:** Provides a consistent, calm, and information-dense header for primary tab screens. It replaces the need for each screen to manually implement its own title and context area.

**Composition:**
- A root `View` that respects safe area insets.
- Uses `<AppText>` for its `title` and optional `subtitle` props.
- Contains an optional `rightAction` slot that can accept an `<Icon>` or a `<Button variant="text">`.

**Layout Hierarchy & Behavior:**
- `title` is the dominant element (`headline` or `title` variant).
- `subtitle`, if present, appears below the title with a `label` variant and `onSurfaceVariant` color.
- The `rightAction` slot is aligned to the far right of the container, vertically centered with the `title`.
- **Guardrail:** The component should not manage its own background (e.g., glassmorphism). That is the responsibility of the screen layout it's placed in, to allow for different scroll behaviors.

**Minimal Variant Guidance:**
- `default`: Standard left-aligned title and subtitle.
- A boolean prop like `centered` could be added later if needed for modal headers, but is deferred for now.

**MVP Screen Mapping:**
- **Home:** `title="Chào buổi sáng, [Tên]"`, `subtitle="Thứ Ba, 24 Th10"`, `rightAction` contains the live clock.
- **Meds:** `title="Medications"`, `rightAction` contains the "Add" button/icon.
- **Me:** `title="My Profile"`, no `rightAction`.

### 2. `AlertBanner`
**Purpose:** A reusable, themed banner for displaying contextual, non-blocking alerts to the user.

**Composition:**
- A root `<Card variant="nested">` to provide the surface.
- An `<Icon>` on the leading side.
- A block of `<AppText>` for the `title` and optional `body`.
- An optional `action` slot for a `<Button variant="text">`.

**Layout Hierarchy & Behavior:**
- The icon, text block, and action are arranged horizontally.
- The component's height adapts to its content.
- It is not self-dismissing; it remains visible until the parent state changes or the user interacts with the action.

**Minimal Variant Guidance:**
- `warning` (default): Yellow/orange theme. Uses `tertiary-container` or similar. For low stock warnings.
- `critical`: Red theme. Uses `error-container`. For missed doses.
- `info`: Neutral/blue theme. Uses `secondary-container`. For informational nudges.

**MVP Screen Mapping:**
- **Home:** Used for both "Missed Dose" (`critical`) and "Stock Warning" (`warning`) alerts.

### 3. `SummaryStatsRow`
**Purpose:** A compact, scannable row of key metrics, used for the dashboard summaries on Home and Meds.

**Composition:**
- A root horizontal `View` that distributes its children evenly.
- It accepts an array of `StatItem` data objects.
- It internally maps over the data, rendering a `StatItem` for each.
- **`StatItem` (sub-component):**
  - A vertical `View`.
  - An `<AppText variant="headline">` for the `value`.
  - An `<AppText variant="label">` for the `label`.

**Layout Hierarchy & Behavior:**
- Designed to hold 2-4 `StatItem`s.
- Adheres to the "Value-Label" high-contrast pattern from `DESIGN_STYLE.md`. The value is large and prominent; the label is smaller and uses `onSurfaceVariant`.
- The entire component is compact and should not occupy more than ~15% of the vertical screen height.

**Guardrails & Density:**
- The component should not grow into a full analytics dashboard. It is for quick-scan summary data only.
- The `StatItem` values should be strings, not complex nodes, to enforce simplicity.

**MVP Screen Mapping:**
- **Home:** Displays "Taken", "Remaining", and "Missed" dose counts.
- **Meds:** Displays "Total Meds", "Active Today", and "Low Stock" counts.

---

## Intentionally Deferred
- **`MedicationTile`:** While a high-priority `composed` component, it has more complex state and is deferred to the next batch.
- **`SettingsSection`:** Deferred to focus on these more widely-used structural components first.
- **`SliderConfirm`:** Highly specialized for the Home screen; will be considered for composition later if another use case appears.
- **Complex Variants:** Headers with search bars, banners with dismiss buttons, and interactive/chart-based stat rows are all deferred.
