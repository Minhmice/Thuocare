# Composed Component Definition: SliderConfirm

## Purpose
This document defines the `SliderConfirm`, a high-affordance, gesture-based confirmation component. Its primary purpose is to prevent accidental triggering of critical actions, starting with the "take dose" confirmation in the Home screen's next-dose hero. It provides a deliberate, physical-feeling interaction that is both strong and calm, aligning with the "clinical minimal" design ethos.

## Composition from Lower Layers
The `SliderConfirm` is a self-contained composed component built from primitives and wrappers. It will likely require a gesture handling library (`react-native-gesture-handler`) for its core interaction.
- **Root Container (Track):** A `View` with a large corner radius to form the slider track.
- **Handle (Thumb):** An animated `View`, styled as a circle, that the user drags. It contains an `<Icon>` (e.g., a chevron-right).
- **Instructional Label:** An `<AppText>` element positioned centrally on the track, which fades out as the handle is dragged over it.
- **Loading/Success Indicators:** The component will internally swap the handle's `<Icon>` with a `<Spinner>` or a success icon (e.g., checkmark) based on its state.

## Gesture and Completion Behavior
- **Interaction:** The user must press and drag the handle from the far left to the far right.
- **Completion Threshold:** The `onConfirm` action is only triggered if the user releases the handle after dragging it past a high threshold (e.g., >95% of the track's width). This prevents accidental confirmation.
- **Haptics:** A subtle "success" haptic feedback should be triggered on successful confirmation on supported devices (iOS).

## Visual Hierarchy & Structure
1.  **Track:** The background element. A long, pill-shaped container.
2.  **Label:** Centered text on top of the track (e.g., "Swipe to Take").
3.  **Handle:** The circular, draggable element, sitting on the left end of the track in its initial state. It should have a subtle shadow or be on a higher surface level to afford dragging.

## State Behavior
The component has a clearly defined set of visual states managed via props.
- **`default`:** The active, initial state. The handle is on the left, and the label is visible.
- **`loading`:** When an action is pending after confirmation. The handle shows a `<Spinner>` and is locked. The component is disabled.
- **`success`:** After the action is successfully completed. The handle is locked at the far right, and its icon changes to a checkmark. The track background could briefly flash a success color.
- **`disabled`:** The entire component has reduced opacity (`0.5`) and is non-interactive.

## Failure/Cancel/Reset Behavior
- **Cancel (Release Before Threshold):** If the user releases the handle before reaching the confirmation threshold, the handle smoothly animates back to its starting position on the left. No action is triggered.
- **Reset:** The component does not manage its own reset. The parent screen is responsible for changing the component's `state` prop back to `default` when the UI needs to be reset (e.g., when the next dose becomes available).

## Accessibility Guidance
- **Action Hint:** The component should have an `accessibilityHint` that clearly describes the required action, e.g., "Swipe right to confirm taking this dose."
- **Alternative Action:** For users who cannot perform the swipe gesture, an alternative is required. While not part of the component's internal logic, the screen using it should provide a secondary way to trigger the action, such as a long-press on the component that opens a confirmation `Dialog`. This is deferred but should be noted.

## MVP Screen Mapping
- **Home Screen:** The `SliderConfirm` is the primary action within the "Next-Dose Hero" card. It is used to confirm that the user has taken their scheduled medication.

## Intentionally Deferred
- **Customization:** Variants for different colors, sizes, or layouts are deferred. This initial version is purpose-built for the Home screen hero.
- **Vertical Sliding:** The component only supports horizontal, left-to-right sliding.
- **Complex Gesture Support:** "Undo" states or other complex gestures are not in scope.
- **Built-in Accessibility Fallback:** The component itself will not contain the alternative confirmation method (like a long-press to dialog). This logic will live in the parent screen for now.
