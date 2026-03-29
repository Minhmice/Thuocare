# Lab Tab (Dev-Only UI Review)

Last updated: 2026-03-28 — implemented

## Purpose
The `Lab` tab is a temporary, developer-only surface for auditing and reviewing the component system. It provides a visual inventory of all UI building blocks, from primitives to screen-level snippets, ensuring they adhere to the **clinical-minimal** design direction before broader deployment.

---

## 1. UX Structure & IA
- **Format:** Single long scrollable screen.
- **Hierarchy:** High-contrast sections with clear headings.
- **Top Bar:** Quick jump links (optional) or just a clear "Lab Mode" header.
- **Copy:** English (Development context).

### Section Order
1. **Primitives (`ui/`):** Raw building blocks without heavy theme logic.
2. **Wrappers (`wrapper/`):** Themed versions of primitives.
3. **Composed:** High-level app components (e.g., `MedicationTile`, `AlertBanner`).
4. **Screen Snippets:** Integrated blocks representing parts of actual screens.
5. **Toast Preview:** Dedicated interactive area for feedback testing.

---

## 2. State-Control Design
To review interactivity, components should include **Inline Toggle Controls**.
- **Visuals:** Small, subtle segmented controls or switches placed directly below or beside the component.
- **Controls:**
  - `Loading`: Toggle loading state (spinner inside button, skeleton on card).
  - `Error`: Toggle error state (red borders, error text).
  - `Disabled`: Toggle interactive availability.
  - `Type/Variant`: Switch between primary, secondary, outline, etc.

---

## 3. Section-by-Section Preview Plan

### 1. Primitives (`ui/`)
- `Button`: All basic sizes and styles.
- `Input`: Text, password, numeric with native focus behavior.
- `Checkbox`: Selected, unselected, disabled.
- `Typography`: Scale review (Headline -> Body -> Label).
- `Icon`: Phospor icon library representative set.

### 2. Wrappers (`wrapper/`)
- `Button`: MD3-themed buttons.
- `Card`: Elevated, flat, and outlined variants.
- `Input`: Themed fields with error messaging.

### 3. Composed
- `AlertBanner`: Info, Warning, Critical variants.
- `MedicationTile`: Active, Out of Stock, Low Stock, Highlighted.
- `SummaryStatsRow`: 3-column stats with/without segmentation.
- `SliderConfirm`: Full swipe gesture demo.
- `ScreenHeader`: Greeting variant vs. Title variant.

### 4. Screen Snippets
- **Auth:** Login form snippet (Phone + Password + Forgot Link).
- **Add Medication:** Step 1 (Search/Name) and Step 5 (Summary) previews.
- **Current App:** Home next-dose hero and Me profile summary card.

---

## 4. Toast Preview Approach
The toast should be tested in a safe, review-only way without triggering global app state.
- **Area:** A card containing 3 buttons: `Show Success`, `Show Info`, `Show Error`.
- **Behavior:** Pressing a button triggers a local `Toast` component instance.
- **State:** Toggles a local boolean in the Lab screen to show/hide the toast with its standard duration.

---

## 5. Implementation Guidance for Claude
1. **Route:** Add `src/app/(tabs)/lab.tsx`.
2. **Tab Layout:** Temporarily add `<Tabs.Screen name="lab" />` to `src/app/(tabs)/_layout.tsx`.
3. **Hardcoded Data:** Use realistic mock strings (e.g., "Paracetamol 500mg") for composed components.
4. **Dev-Only Flag:** (Optional) Wrap the tab in a `__DEV__` check or keep it as a simple file addition that we manually remove later.

---

## 6. Visual Consistency
- **Surfaces:** Use `surface` base with `surface-container` tiers for sectioning.
- **Spacing:** Minimum `6` (24px) between groups, `10` (40px) between sections.
- **Editorial:** Maintain a clean, calm look even with many components on screen.
