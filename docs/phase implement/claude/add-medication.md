# Add Medication Implementation

## Overview

The Add Medication flow has been implemented as a multi-step modal-like screen using a state machine to manage the transition between four distinct phases: Identity, Schedule, Support, and Review.

## Features

- **Multi-step Form:** State is preserved across all steps, allowing users to go back and correct information without data loss.
- **Form-Adaptive Inputs:** The dosage quantity input changes its label and keyboard type based on the selected dosage form (Tablet, Liquid, Powder).
- **Schedule Management:** Users can toggle morning, noon, and evening moments, each with their own meal relation setting.
- **Review Step:** A final summary of all entered data with deep links back to specific steps for editing.
- **Smooth Return:** On save, the app returns to the medication list and highlights the newly added item using a temporary background tint and auto-scrolling.

## Technical Details

- **Route:** `src/app/meds/add.tsx`
- **State Management:** Local `useState` for form data and current step.
- **Persistence:** Uses `addLocalMedication` from `src/lib/meds/localMedsStore.ts` to simulate local storage.
- **Navigation:** Leverages `expo-router` for stack transitions and parameter passing (`highlightId`).

## iPhone vs Android Parity

- **Safe Areas:** Respects notch and home indicators on both platforms using `useSafeAreaInsets`.
- **Keyboards:** Uses `numeric` keyboard for quantity and stock fields where appropriate.
- **Touch Targets:** Large, tappable cards and buttons for accessible interaction.
