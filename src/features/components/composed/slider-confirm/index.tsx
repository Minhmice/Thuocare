import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  Extrapolation,
} from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import {
  SPRING_BACK,
  SPRING_COMPLETE,
  SUCCESS_HOLD_MS,
  THUMB_ACTIVE_SCALE,
} from "./constants";
import { useSliderHaptics } from "./use-haptics";
import type { SliderConfirmProps, SliderConfirmSize } from "./types";

// ── Component ───────────────────────────────────────────────────────
export const SliderConfirm: React.FC<SliderConfirmProps> = ({
  onConfirm,
  label = "Slide to mark all as taken",
  threshold = 0.75,
  disabled = false,
  loading = false,
  size = "medium",
  hapticEnabled = true,
  variant = "dark",
  style,
}) => {
  // Fixed geometry system (do not derive from size)
  // Keep `size` prop for API compatibility; visuals are intentionally fixed.
  const supportsGlass = Platform.OS === "ios";

  const TRACK_HEIGHT = 84;
  const THUMB_SIZE = supportsGlass ? 64 : 60;
  const TRACK_PADDING = 10;
  const TRACK_RADIUS = TRACK_HEIGHT / 2;
  const THUMB_RADIUS = THUMB_SIZE / 2;

  // Track width measured on layout
  const trackWidth = useSharedValue(0);

  // Maximum travel distance for the thumb
  const maxTravel = useSharedValue(0);

  // Current thumb X position (shared value for UI thread)
  const thumbX = useSharedValue(0);

  // Whether the thumb is being actively dragged
  const isActive = useSharedValue(false);

  // Whether confirmation has already been triggered
  const hasConfirmed = useSharedValue(false);

  // Mirror hasConfirmed into React state so render-phase reads are safe
  const [hasConfirmedState, setHasConfirmedState] = useState(false);
  useAnimatedReaction(
    () => hasConfirmed.value,
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setHasConfirmedState)(current);
      }
    }
  );

  // For showing check icon briefly upon success
  const [showCheck, setShowCheck] = useState(false);

  // Whether the threshold was crossed during this drag
  const thresholdCrossed = useSharedValue(false);

  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;

  const haptics = useSliderHaptics(hapticEnabled);

  const isBlocked = disabled || loading || hasConfirmedState;

  // ── JS callbacks (called from worklets via runOnJS) ─────────────
  const fireConfirm = useCallback(() => {
    setShowCheck(true);
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
      // The padded wrapper already accounts for TRACK_PADDING, so the fill
      // should be calculated purely in wrapper coordinates.
      width: thumbX.value + THUMB_SIZE / 2,
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

  // Visual tokens
  const isDark = variant === "dark";
  // iOS: Glass base + tint overlay. Android: flat blue pill (no shine/crescent).
  const trackBg = supportsGlass
    ? isDark
      ? "rgba(255, 255, 255, 0.14)"
      : "rgba(0, 0, 0, 0.05)"
    : isDark
      ? "rgba(180, 220, 255, 0.18)"
      : "rgba(0, 88, 188, 0.10)";

  // Active fill: simple clipped tint layer (never glass)
  const fillBg = supportsGlass
    ? isDark
      ? "rgba(255, 255, 255, 0.16)"
      : "rgba(0, 88, 188, 0.10)"
    : isDark
      ? "rgba(0, 88, 188, 0.26)"
      : "rgba(0, 88, 188, 0.18)";
  const labelColor = isDark ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.6)";
  const innerStrokeColor = isDark ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.07)";
  const androidOuterStrokeColor = "rgba(255, 255, 255, 0.5)";
  
  // Thumb styling
  const thumbBg = "#FFFFFF";
  const iconColor = "#0058BC"; // Primary blue
  const disabledIconColor = "#9CA3AF";

  return (
    <View
      style={[
        styles.trackContainer,
        {
          height: TRACK_HEIGHT,
          borderRadius: TRACK_RADIUS,
          ...(supportsGlass
            ? null
            : {
                borderWidth: 1,
                borderColor: androidOuterStrokeColor,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 6,
                elevation: 1,
              }),
        },
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
      {/* Liquid Glass Background */}
      <View style={[StyleSheet.absoluteFill, styles.glassWrapper, { borderRadius: TRACK_RADIUS }]}>
        {supportsGlass ? (
          <>
            <GlassView
              style={[
                StyleSheet.absoluteFill,
                { borderRadius: TRACK_RADIUS, overflow: "hidden" },
              ]}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: trackBg, borderRadius: TRACK_RADIUS },
              ]}
            />
          </>
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: trackBg, borderRadius: TRACK_RADIUS },
            ]}
          />
        )}
      </View>

      {/* Dimmed overlay for disabled state */}
      {disabled && !loading && (
        <View style={[StyleSheet.absoluteFill, styles.disabledOverlay]} />
      )}

      {/* iOS-only inner stroke/highlight (Android should stay flat/clean) */}
      {supportsGlass && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: TRACK_RADIUS,
              borderWidth: 1,
              borderColor: innerStrokeColor,
            },
          ]}
          pointerEvents="none"
        />
      )}
      {/* Android: no inner highlight/shine layers (only outer border on container) */}

      {/* Track inner content wrapper — clips fill, positions label + thumb */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            padding: TRACK_PADDING,
            borderRadius: TRACK_RADIUS,
            overflow: "hidden",
          },
        ]}
      >
        {/* Active fill tint (clipped inside track; not a capsule, no glass) */}
        <Animated.View
          style={[
            styles.fill,
            fillAnimatedStyle,
            {
              backgroundColor: fillBg,
              borderRadius: THUMB_RADIUS,
              height: THUMB_SIZE,
              left: 0,
              top: 0,
            },
          ]}
          pointerEvents="none"
        />

        {/* Label */}
        {!loading && (
          <Animated.View
            style={[
              styles.overlay,
              labelAnimatedStyle,
              { paddingLeft: THUMB_RADIUS }
            ]}
            pointerEvents="none"
          >
            <Animated.Text
              style={[
                styles.labelText,
                {
                  color: labelColor,
                  fontSize: 13,
                },
              ]}
            >
              {label}
            </Animated.Text>
          </Animated.View>
        )}

        {/* Loading spinner overlay */}
        {loading && (
          <View style={styles.overlay} pointerEvents="none">
            {/* In Liquid Glass, spinner is moved into the thumb, but we can keep a subtle text or keep it empty here */}
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
                borderRadius: THUMB_RADIUS,
                backgroundColor: thumbBg,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={iconColor} />
            ) : (
              <MaterialCommunityIcons
                name={showCheck ? "check" : "chevron-right"}
                size={28}
                color={disabled ? disabledIconColor : iconColor}
              />
            )}
          </Animated.View>
        </GestureDetector>
      </View>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  trackContainer: {
    overflow: "hidden",
    width: "100%",
    alignSelf: "stretch",
  },
  glassWrapper: {
    overflow: "hidden",
  },
  disabledOverlay: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    zIndex: 1,
  },
  fill: {
    position: "absolute",
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
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  thumb: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: Platform.OS === "android" ? 1 : 0,
  },
});
