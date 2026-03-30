import type { StyleProp, ViewStyle } from "react-native";

export type SliderConfirmSize = "medium" | "large" | "md" | "lg";

export interface SliderConfirmProps {
  /**
   * Visual size of the slider.
   * - `medium` (default): standard slider
   * - `large`: enlarged primary-action slider (~72px thumb)
   * Legacy aliases `md` and `lg` are supported for backward compatibility.
   */
  size?: SliderConfirmSize;

  /**
   * Called once when the thumb crosses the confirm threshold and the snap
   * animation completes. The parent is responsible for what happens next:
   * unmounting, setting loading=true, navigating, etc.
   */
  onConfirm: () => void;

  /**
   * Instructional text shown centered inside the track while the thumb is idle.
   * Rendered in uppercase automatically.
   * @default "Slide to confirm"
   */
  label?: string;

  /**
   * Fraction of track width (0–1) the thumb must travel to trigger confirm.
   * @default 0.75
   */
  threshold?: number;

  /**
   * Prevents interaction. The track is dimmed to communicate unavailability.
   */
  disabled?: boolean;

  /**
   * Shows a spinner on the thumb and prevents drag. Intended for use while
   * an async operation triggered by onConfirm is in progress.
   * The center label is hidden while loading is true.
   */
  loading?: boolean;

  /**
   * Enable haptic feedback during interaction.
   * @default true
   */
  hapticEnabled?: boolean;

  /**
   * Visual variant for different background contexts.
   * - `dark`: white text on semi-transparent dark track (for use on colored backgrounds)
   * - `light`: dark text on semi-transparent light track (for use on white backgrounds)
   * @default "dark"
   */
  variant?: "dark" | "light";

  /** Applied to the outer track container. */
  style?: StyleProp<ViewStyle>;
}
