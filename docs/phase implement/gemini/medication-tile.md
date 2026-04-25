# Composed Component Definition: MedicationTile

## Purpose

This document defines the `MedicationTile`, a high-priority composed component. Its purpose is to serve as the standard, scannable display unit for a single medication within a list, primarily on the `Meds` screen. The design prioritizes at-a-glance clarity of the most critical information: what the medicine is, how much to take, when to take it, and its current stock status.

## Composition from Lower Layers

The `MedicationTile` is assembled from the `ui` and `wrapper` components defined in Batch 01 and 02.

- **Root Container:** A `<Card variant="default">`, using `surface-container-lowest`. It will be wrapped in a `Pressable` to handle future navigation to a detail screen.
- **Accent Bar:** A `View` styled to be 4px wide, positioned on the leading edge of the card. Its color changes based on the medication's state.
- **Text Elements:** All text is rendered using the `<AppText>` wrapper with appropriate variants (`title`, `body`, `label`).
- **Badge:** The "Out of Stock" indicator is a small, self-contained `View` with a themed background and a single `<AppText>` label.

## Visual Hierarchy

The layout is designed for quick scanning, with a clear vertical flow of information, adhering to the "clinical minimal" aesthetic.

1.  **Medication Name:** The most prominent element, using the `title` text variant.
2.  **Dosage & Form:** Secondary information, using the `body` text variant.
3.  **Schedule Summary:** Tertiary information, using the `label` text variant with `onSurfaceVariant` color.
4.  **Stock Status:** Positioned to be noticeable without dominating the tile, often in a corner or at the bottom, using a `label` variant.

## Data Shape Expectations (API)

The component should accept a single `medication` prop with a shape like the following:

```typescript
interface MedicationTileProps {
  name: string;
  dosage: string; // e.g., "1 tablet", "10ml"
  schedule: string; // e.g., "Morning, Evening"
  stock?: number; // Remaining dose count
  isLowStock?: boolean;
  isOutOfStock?: boolean;
}
```

**Guardrail:** The component should not fetch its own data. It is a pure display component that receives its data via props.

## Active vs. Out-of-Stock Treatment

The component's appearance changes based on the stock status to provide clear visual cues.

- **Active State:**
  - **Accent Bar:** `primary` color.
  - **Text:** Standard `onSurface` and `onSurfaceVariant` colors.
  - **Stock Text:** Displays the remaining `stock` count (e.g., "25 left").
- **Low Stock State (`isLowStock: true`):**
  - **Accent Bar:** `tertiary` color (warning orange/red).
  - **Stock Text:** Also uses `tertiary` color to draw attention.
- **Out-of-Stock State (`isOutOfStock: true`):**
  - **Accent Bar:** Muted gray (`outline` color).
  - **Text:** All text elements use the dimmer `onSurfaceVariant` color.
  - **Opacity:** The entire tile has a slightly reduced opacity (e.g., `0.7`) to recede visually.
  - **Badge:** A prominent "Out of Stock" badge is displayed.

## Badge Behavior

- The "Out of Stock" badge is a small, pill-shaped `View`.
- **Visuals:** It uses an `error` container background color with high-contrast text.
- **Placement:** Positioned in a corner of the tile (e.g., top-right or bottom-right) to be noticeable but not obscure the core medication name. It should not be a simple text label, but a distinct badge element.

## Long-Title Handling

- As defined in `DESIGN_STYLE.md`, the `name` text element **must** enforce a 2-line maximum with an ellipsis (`...`) for truncation. This prevents long medication names from breaking the vertical rhythm of the list.

## Optional Fields

- If `stock` is `undefined` or `null`, the stock status area of the tile should be omitted entirely, allowing the other content to use the space. The component should not render "Stock: N/A".

## Density and Spacing

- The tile should use the standard `Card` padding (`6` scale unit / ~2rem) to maintain a calm, breathable feel.
- A consistent bottom margin should be applied to each tile to create vertical rhythm in the list, following the `5` scale unit gap.

## Accessibility Guidance

- The root `Pressable` should have an `accessibilityLabel` that combines the key information, e.g., "Medication: [Name], Dosage: [Dosage], Schedule: [Schedule], Stock: [Stock]".
- The component should be a single, focusable element in screen readers.

## MVP Screen Mapping

- **`Meds` Screen:** This component will be the primary item rendered in the `FlatList` on the Meds screen, replacing any one-off tile styling.

## Intentionally Deferred

- **Edit/Delete Actions:** No "three-dot" menus, swipe actions, or other management affordances are included in this component. These are deferred to a dedicated edit flow.
- **Interactivity:** The tile is a "read-only" display component. Tapping it will navigate to a (currently deferred) detail screen, but the tile itself contains no internal interactive elements.
- **Complex Badges:** Badges for other states (e.g., "New", "Refill due") are deferred. Only "Out of Stock" is included in this scope.
