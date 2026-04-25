// Sizing, spring configs, and color tokens for SliderConfirm.

export const SIZE_CONFIG = {
  medium: { thumb: 52, padding: 6 },
  large: { thumb: 64, padding: 8 },
} as const;

// Spring config for the thumb returning to start after a failed drag.
export const SPRING_BACK = {
  damping: 20,
  stiffness: 180,
  mass: 0.8,
} as const;

// Spring config for the thumb snapping to the end on success.
export const SPRING_COMPLETE = {
  damping: 28,
  stiffness: 260,
  mass: 0.6,
} as const;

// Thumb scale when actively dragging.
export const THUMB_ACTIVE_SCALE = 1.05;

// Minimum ms between haptic events to avoid spamming the Taptic Engine.
export const HAPTIC_THROTTLE_MS = 100;

// How long the success state holds before calling onConfirm.
export const SUCCESS_HOLD_MS = 300;
