import React, { useCallback, useRef } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Extrapolation,
} from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  SIZE_CONFIG,
  SPRING_BACK,
  SPRING_COMPLETE,
  SUCCESS_HOLD_MS,
  THUMB_ACTIVE_SCALE,
} from "./constants";
import { useSliderHaptics } from "./use-haptics";
import type { SliderConfirmProps, SliderConfirmSize } from "./types";

// ── Size normalization ──────────────────────────────────────────────
type NormalizedSize = keyof typeof SIZE_CONFIG;

function normalizeSize(size: SliderConfirmSize | undefined): NormalizedSize {
  if (size === "lg" || size === "large") return "large";
  return "medium";
}

// ── Component ───────────────────────────────────────────────────────
export const SliderConfirm: React.FC<SliderConfirmProps> = ({
  onConfirm,
  label = "Slide to confirm",
  threshold = 0.75,
  disabled = false,
  loading = false,
  size = "medium",
  hapticEnabled = true,
  variant = "dark",
  style,
}) => {
  const sz = normalizeSize(size);
  const { thumb: THUMB_SIZE, padding: TRACK_PADDING } = SIZE_CONFIG[sz];

  // Track width measured on layout
  const trackWidth = useSharedValue(0);

  // Maximum travel distance for the thumb
  const maxTravel = useSharedValue(0);

  // Current thumb X position (shared value for UI thread)
  const thumbX = useSharedValue(0);

  // Whether the thumb is being actively dragged
  const isActive = useSharedValue(false);

  // Whether confirmation has already been triggered (prevent double-fire)
  const hasConfirmed = useSharedValue(false);

  // Whether the threshold was crossed during this drag (for haptic gating)
  const thresholdCrossed = useSharedValue(false);

  // Stable ref for the callback
  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;

  const haptics = useSliderHaptics(hapticEnabled);

  const isBlocked = disabled || loading;

  // ── JS callbacks (called from worklets via runOnJS) ─────────────
  const fireConfirm = useCallback(() => {
    haptics.onComplete();
    setTimeout(() => {
      onConfirmRef.current();
    }, SUCCESS_HOLD_MS);
  }, [haptics]);

  const fireThresholdHaptic = useCallback(() => {
    haptics.onThreshold();
  }, [haptics]);

  const fireStartHaptic = useCallback(() => {
    haptics.onStart();
  }, [haptics]);

  // ── Gesture ─────────────────────────────────────────────────────
  const panGesture = Gesture.Pan()
    .enabled(!isBlocked)
    .activeOffsetX(8) // Only activate after 8px horizontal movement
    .failOffsetY([-12, 12]) // Fail (let ScrollView win) if vertical > 12px
    .onStart(() => {
      "worklet";
      if (hasConfirmed.value) return;
      isActive.value = true;
      thresholdCrossed.value = false;
      runOnJS(fireStartHaptic)();
    })
    .onUpdate((e) => {
      "worklet";
      if (hasConfirmed.value) return;
      const clamped = Math.max(0, Math.min(e.translationX, maxTravel.value));
      thumbX.value = clamped;

      // Threshold crossing detection (one-shot per drag)
      const progress = maxTravel.value > 0 ? clamped / maxTravel.value : 0;
      if (progress >= threshold && !thresholdCrossed.value) {
        thresholdCrossed.value = true;
        runOnJS(fireThresholdHaptic)();
      } else if (progress < threshold && thresholdCrossed.value) {
        thresholdCrossed.value = false;
      }
    })
    .onEnd(() => {
      "worklet";
      if (hasConfirmed.value) return;
      isActive.value = false;

      const progress = maxTravel.value > 0 ? thumbX.value / maxTravel.value : 0;

      if (progress >= threshold) {
        // Success: snap to end
        hasConfirmed.value = true;
        thumbX.value = withSpring(maxTravel.value, SPRING_COMPLETE);
        runOnJS(fireConfirm)();
      } else {
        // Fail: spring back
        thumbX.value = withSpring(0, SPRING_BACK);
      }
    })
    .onFinalize(() => {
      "worklet";
      isActive.value = false;
    });

  // ── Animated Styles ─────────────────────────────────────────────
  const thumbAnimatedStyle = useAnimatedStyle(() => {
    const scale = isActive.value
      ? withSpring(THUMB_ACTIVE_SCALE, { damping: 15, stiffness: 200 })
      : withSpring(1, { damping: 15, stiffness: 200 });

    return {
      transform: [{ translateX: thumbX.value }, { scale }],
    };
  });

  const fillAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: thumbX.value + THUMB_SIZE / 2 + TRACK_PADDING,
    };
  });

  const labelAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      thumbX.value,
      [0, 60],
      [1, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  // Visual tokens based on variant
  const isDark = variant === "dark";
  const trackBg = isDark ? "rgba(0, 0, 0, 0.15)" : "rgba(0, 0, 0, 0.06)";
  const fillBg = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 88, 188, 0.08)";
  const labelColor = isDark ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.45)";
  const thumbBg = "#FFFFFF";
  const iconColor = isDark ? "#0058BC" : "#0058BC";

  return (
    <View
      style={[
        styles.track,
        {
          height: THUMB_SIZE + TRACK_PADDING * 2,
          padding: TRACK_PADDING,
          backgroundColor: trackBg,
        },
        disabled && !loading && styles.trackDisabled,
        style,
      ]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        trackWidth.value = w;
        maxTravel.value = Math.max(0, w - THUMB_SIZE - TRACK_PADDING * 2);
      }}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isBlocked }}
      accessibilityHint="Slide right to confirm"
    >
      {/* Track fill */}
      <Animated.View
        style={[
          styles.fill,
          fillAnimatedStyle,
          {
            backgroundColor: fillBg,
            borderRadius: 9999,
            height: THUMB_SIZE,
          },
        ]}
        pointerEvents="none"
      />

      {/* Label */}
      {!loading && (
        <Animated.View
          style={[styles.overlay, labelAnimatedStyle]}
          pointerEvents="none"
        >
          <Animated.Text
            style={[
              styles.labelText,
              {
                color: labelColor,
                fontSize: sz === "large" ? 13 : 11,
              },
            ]}
          >
            {label.toUpperCase()}
          </Animated.Text>
        </Animated.View>
      )}

      {/* Loading spinner overlay */}
      {loading && (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
        </View>
      )}

      {/* Thumb */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.thumb,
            thumbAnimatedStyle,
            {
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: THUMB_SIZE / 2,
              backgroundColor: thumbBg,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={iconColor} />
          ) : (
            <MaterialCommunityIcons
              name="chevron-right"
              size={sz === "large" ? 36 : 28}
              color={disabled ? "#9CA3AF" : iconColor}
            />
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  track: {
    borderRadius: 9999,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  trackDisabled: {
    opacity: 0.45,
  },
  fill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  labelText: {
    fontWeight: "700",
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },
  thumb: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    // Subtle shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
});
