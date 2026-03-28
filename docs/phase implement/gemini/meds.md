# Meds Screen UX and Flow Definition

## Screen Objective
The Meds screen is the primary reference surface for a user's personal medication library. Its objective is to provide a clean, uncluttered list of all active medications, their current schedules, and stock levels. It serves as the jumping-off point for adding new medications and monitoring routine compliance through a compact, high-level dashboard.

## Content Hierarchy
The screen follows a top-down information flow designed for rapid scanning:
1.  **Header:** Screen title ("Meds" or "Medications") with a primary "Add" trigger.
2.  **Compact Dashboard:** A lightweight summary of the medication library status.
3.  **Medication List:** A vertically scrolling list of medication tiles.
4.  **Empty State:** A supportive view shown when no medications are present.

## Compact Top Dashboard
Following the "Daily Reassurance" mindset of the Home screen, the Meds dashboard is small and lightweight (top ~15-20% of the screen). It uses the "Value-Label" pairing pattern from `DESIGN_STYLE.md`.

### Recommended Metrics
*   **Total Meds:** Total count of active medications in the library.
*   **Active Today:** Count of medications that have at least one dose scheduled for the current day.
*   **Low Stock:** Count of medications where the remaining quantity is below the threshold or at zero.

## Add-Medication Trigger Placement
*   **Primary Placement:** A "plus" (+) icon or "Add" text button in the top right of the header.
*   **Secondary Placement (Empty State):** A prominent primary button in the center of the screen when the list is empty.
*   **Note:** Avoid using a Floating Action Button (FAB) if it obscures stock information on the bottom-most tiles; a header-based trigger is preferred for the clinical-minimal aesthetic.

## Medication Tile Hierarchy
Tiles use the `surface-container-lowest` card primitive with a 4px primary-color accent bar on the leading edge.
1.  **Name (Top Left):** `titleMedium` or `titleLarge`, enforced 2-line max with ellipsis.
2.  **Dosage & Form (Below Name):** `bodyMedium` (e.g., "1 Tablet" or "10ml").
3.  **Schedule Summary (Below Dosage):** `labelMedium` in `on-surface-variant` (e.g., "Morning, Evening").
4.  **Stock Status (Bottom Right or Bottom Left):** A small, high-contrast indicator.

## Visual Distinction: Active vs. Out-of-Stock
*   **Active Items:** Standard high-contrast text and primary color accent bar.
*   **Low Stock Items:** The stock label turns to a warning color (e.g., `tertiary` or a soft orange) with a "Low Stock" badge.
*   **Out-of-Stock Items:** 
    *   The tile background may shift to a slightly more muted `surface-container-low`.
    *   The accent bar remains but may be dimmed or changed to a neutral gray.
    *   Medication name and details use `on-surface-variant` (dimmed) to indicate inactivity.
    *   A prominent "Out of Stock" badge is displayed.

## Empty State Guidance
*   **Visual:** A calm, clinically-themed illustration or icon (e.g., an empty medicine cabinet or a pill bottle icon).
*   **Copy:** "Your medication list is empty."
*   **Action:** A primary button labeled "Add Medication" to launch the multi-step flow.

## Return-from-Add Flow & Highlight Behavior
1.  **Return:** Upon saving a new medication, the user is navigated back to the Meds screen.
2.  **Auto-Scroll:** The list automatically scrolls to bring the newly added item into view (ideally centered or at the top of the viewport).
3.  **1-Second Highlight:** 
    *   The new tile receives a "Soft Glow" treatment (per `add-medication.md`).
    *   A subtle background tint (e.g., 8% opacity of the primary color) is applied.
    *   The highlight fades out gracefully over exactly **1 second**, leaving the tile in its standard state.

## Mock-Data Diversity
To stress-test the UI, mock data must include:
*   **Long Names:** Medications with 3+ words (e.g., "Acetaminophen & Codeine Phosphate") to test truncation.
*   **Various Forms:** Tiles for Tablets, Liquids, and Powders to verify dosage string formatting.
*   **Stock Extremes:** One item with high stock, one with 2 doses left (Low), and one with 0 doses (Out).
*   **Complex Schedules:** One item with "Morning, Noon, Evening" to test multi-line label layout.

## iPhone vs Android Notes
*   **iPhone:** Use native header styling and standard iOS "push" or "modal" transitions for adding meds. Leverage `BackdropBlur` on the header if the list scrolls behind it.
*   **Android:** Ensure touch targets for the "Add" trigger and tiles are at least 48dp. Use standard Material-style fade/slide-up for the list entry.
*   **Common:** Both platforms must follow the "No-Line" rule, using surface shifts instead of borders.
