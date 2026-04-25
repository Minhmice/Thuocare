import * as Haptics from "expo-haptics";
import { useCallback, useRef } from "react";
import { Platform } from "react-native";
import { HAPTIC_THROTTLE_MS } from "./constants";

/**
 * Throttled haptic feedback for the slider.
 * All methods are no-ops on platforms without haptic support.
 */
export function useSliderHaptics(enabled: boolean) {
  const lastFireRef = useRef(0);

  const throttled = useCallback(
    (fn: () => void) => {
      if (!enabled || Platform.OS === "web") return;
      const now = Date.now();
      if (now - lastFireRef.current < HAPTIC_THROTTLE_MS) return;
      lastFireRef.current = now;
      fn();
    },
    [enabled]
  );

  const onStart = useCallback(() => {
    throttled(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  }, [throttled]);

  const onThreshold = useCallback(() => {
    throttled(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  }, [throttled]);

  const onComplete = useCallback(() => {
    throttled(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    );
  }, [throttled]);

  return { onStart, onThreshold, onComplete };
}
