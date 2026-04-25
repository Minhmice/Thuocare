# Home Medication Reminder Experience

Last updated: 2026-03-28

## Purpose

This spec defines a new, screen-dominant medication reminder experience for the Home screen. It transitions from a simple hero card to a calm, flat, clinical surface inspired by Apple’s alarm interaction model, emphasizing reassurance and deliberate action.

---

## 1. State Model

| State                   | Trigger                                       | Visuals                                                     | Navigation                            |
| ----------------------- | --------------------------------------------- | ----------------------------------------------------------- | ------------------------------------- |
| **Expanded Reminder**   | Unconfirmed meds exist on open; Reminder tap. | Blue dominant surface, full-screen above fold, large cards. | Tabs visible, scrollable to schedule. |
| **Docked Reminder**     | User scrolls down Today's schedule.           | Compact blue bar/card docked at the top.                    | Sticky at top of AppScreen.           |
| **Confirmed / All-Set** | User completes slider confirmation.           | Transition to standard Home "All Set" view.                 | Standard Home layout.                 |

---

## 2. Reminder Surface Design

- **Background:** Primary Blue (#0058BC) as the dominant surface color.
- **Atmosphere:** Calm, flat, and clinical. No gloss, no heavy shadows.
- **Top Area:**
  - Status Badge: "UP NEXT" or "[X] MIN OVERDUE" (Semi-transparent white pill).
  - Time Label: Large, bold white time (e.g., "09:00").
  - Slot Label: "Morning Medications" or "Doses for 09:00".
- **Container:** The surface acts as a group container for one or more medication cards.

---

## 3. Medication Card Redesign

The medication card is a large unit designed for high legibility and reassurance.

- **Footprint:** Larger than the current compact tile (min height 120px).
- **Structure:**
  - **Top Row (Note):** Small, high-contrast label (e.g., "1 pill, before meal").
  - **Middle Row (Identity):** Large, bold title (e.g., "Aspirin").
  - **Bottom Row (Effect):** Supporting text in subtle secondary color (e.g., "Cardiovascular support").
  - **Right Slot:** Placeholder area for a medication image (Square, rounded 16px).
- **Style:** Flat card with `surface-container-lowest` background (#FFFFFF) to pop against the blue reminder surface.

---

## 4. Motion & Scroll Behavior

### Expand/Collapse Transition

- **Trigger:** Scroll position of the `AppScreen`.
- **Mechanism:** As the user scrolls up, the docked card interpolates its height, opacity, and scale into the expanded surface.
- **Interpolation:**
  - `height`: 80px (Docked) -> 400px+ (Expanded).
  - `cardScale`: 0.9 -> 1.0.
  - `textOpacity`: Fades in/out the detailed labels.
- **Motion:** Smooth ease-in-out (400ms).

### Slider Confirm Interaction

- **Style:** Apple Alarm-inspired flat slider.
- **Size:** Large touch target (height ~64px).
- **Feedback:** Subtle haptic "click" at the start, midpoint, and completion.
- **Outcome:** On completion, the blue surface collapses/fades into the "All Set" state.

---

## 5. Reuse Recommendations

- **Medication Card:** This redesigned card should be extracted into a `composed` component (`PrimaryMedicationCard`) so it can later be used in the `Meds` tab.
- **Slider:** The existing `SliderConfirm` should be updated with a `large` variant/prop to support this new interaction model.
- **Surface:** The blue container remains `Home`-specific for now.

---

## 6. Implementation Guidance for Claude

1. **New Composed Component:** Create `src/features/components/composed/primary-medication-card`.
2. **Home State Update:** Add `scrollOffset` and `reminderState` (expanded/docked) to `HomeScreen`.
3. **Animated Container:** Use `Animated.View` for the reminder surface, wrapping the greeting and stats dashboard (which hide when expanded).
4. **Conditional Header:** The `ScreenHeader` and `StatsDashboard` should fade out as the reminder expands.
5. **Safe Areas:** Ensure the blue surface bleeds into the status bar area but respects the tab bar.

---

## 7. Deferred Work (to docs/TODO_LATER.md)

- Real medication images (use branded placeholders for now).
- Real reminder-entry deep linking integration.
- Future per-medication confirmation (group confirmation is the priority for MVP).
