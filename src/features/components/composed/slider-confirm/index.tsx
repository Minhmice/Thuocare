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
  Extrapolation
} from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import {
  SPRING_BACK,
  SPRING_COMPLETE,
  SUCCESS_HOLD_MS,
  THUMB_ACTIVE_SCALE
} from "./constants";
import { useSliderHaptics } from "./use-haptics";
import type { SliderConfirmProps } from "./types";

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
  style
}) => {
  const isIOS = Platform.OS === "ios";

  // Fixed geometry system
  const TRACK_HEIGHT = isIOS ? 72 : 84;
  const THUMB_SIZE = isIOS ? 60 : 60;
  const TRACK_PADDING = isIOS ? 6 : 12;
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
      transform: [{ translateX: thumbX.value }, { scale }]
    };
  });

  const fillAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: thumbX.value + THUMB_SIZE / 2
    };
  });

  const labelAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      thumbX.value,
      [0, 60],
      [1, 0.3], // don't fade to 0 entirely, and never fade the parent views
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const isDark = variant === "dark";
  const labelColor = isDark ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.6)";

  const renderAndroidSlider = () => {
    const trackBg = isDark
      ? "rgba(180, 220, 255, 0.18)"
      : "rgba(0, 88, 188, 0.10)";
    const fillBg = isDark ? "rgba(0, 88, 188, 0.26)" : "rgba(0, 88, 188, 0.18)";
    const androidOuterStrokeColor = "rgba(255, 255, 255, 0.5)";
    const thumbBg = "#FFFFFF";
    const iconColor = "#0058BC";
    const disabledIconColor = "#9CA3AF";

    return (
      <View
        style={[
          styles.trackContainer,
          {
            height: TRACK_HEIGHT,
            borderRadius: TRACK_RADIUS,
            borderWidth: 1,
            borderColor: androidOuterStrokeColor,
            elevation: 1
          },
          style
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
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.glassWrapper,
            { borderRadius: TRACK_RADIUS }
          ]}
        >
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: trackBg, borderRadius: TRACK_RADIUS }
            ]}
          />
        </View>

        {disabled && !loading && (
          <View style={[StyleSheet.absoluteFill, styles.disabledOverlay]} />
        )}

        <View
          style={[
            StyleSheet.absoluteFill,
            {
              padding: TRACK_PADDING,
              borderRadius: TRACK_RADIUS,
              overflow: "hidden"
            }
          ]}
        >
          <Animated.View
            style={[
              styles.fill,
              fillAnimatedStyle,
              {
                backgroundColor: fillBg,
                borderRadius: THUMB_RADIUS,
                height: THUMB_SIZE,
                left: 0,
                top: 0
              }
            ]}
            pointerEvents="none"
          />

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
                style={[styles.labelText, { color: labelColor, fontSize: 13 }]}
              >
                {label}
              </Animated.Text>
            </Animated.View>
          )}

          {loading && <View style={styles.overlay} pointerEvents="none" />}

          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[
                styles.thumb,
                thumbAnimatedStyle,
                {
                  width: THUMB_SIZE,
                  height: THUMB_SIZE,
                  borderRadius: THUMB_RADIUS,
                  backgroundColor: thumbBg
                }
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

  const renderIOSSlider = () => {
    // Soft blue glass tint, not flat
    const trackTint = "rgba(120, 190, 255, 0.22)";
    const fillBg = "rgba(0, 88, 188, 0.26)"; // soft blue liquid fill
    const strokeColor = "rgba(255, 255, 255, 0.50)";

    // Glassy thumb
    const thumbBg = "rgba(255, 255, 255, 0.85)";
    const thumbStrokeColor = "rgba(255, 255, 255, 0.9)";
    const iconColor = "#0058BC";
    const disabledIconColor = "#9CA3AF";

    return (
      <View
        style={[
          styles.trackContainerIOS,
          {
            height: TRACK_HEIGHT,
            borderRadius: TRACK_RADIUS
          },
          style
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
        <View
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: TRACK_RADIUS, overflow: "hidden" }
          ]}
        >
          <GlassView
            style={[StyleSheet.absoluteFill, { borderRadius: TRACK_RADIUS }]}
          />
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: trackTint }]}
          />
        </View>

        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: TRACK_RADIUS,
              borderWidth: 1.5,
              borderColor: strokeColor
            }
          ]}
          pointerEvents="none"
        />

        {disabled && !loading && (
          <View style={[StyleSheet.absoluteFill, styles.disabledOverlayIOS]} />
        )}

        <View
          style={[
            StyleSheet.absoluteFill,
            {
              padding: TRACK_PADDING,
              borderRadius: TRACK_RADIUS,
              overflow: "hidden"
            }
          ]}
        >
          <Animated.View
            style={[
              styles.fill,
              fillAnimatedStyle,
              {
                backgroundColor: fillBg,
                borderRadius: THUMB_RADIUS,
                height: THUMB_SIZE,
                left: 0,
                top: 0
              }
            ]}
            pointerEvents="none"
          />

          {!loading && (
            <Animated.View
              style={[
                styles.overlay,
                labelAnimatedStyle,
                { paddingLeft: THUMB_RADIUS }
              ]}
              pointerEvents="none"
            >
              <Animated.Text style={[styles.labelTextIOS]}>
                {label}
              </Animated.Text>
            </Animated.View>
          )}

          {loading && <View style={styles.overlay} pointerEvents="none" />}

          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[
                styles.thumbIOS,
                thumbAnimatedStyle,
                {
                  width: THUMB_SIZE,
                  height: THUMB_SIZE,
                  borderRadius: THUMB_RADIUS,
                  backgroundColor: thumbBg,
                  borderColor: thumbStrokeColor,
                  borderWidth: 1
                }
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

  return isIOS ? renderIOSSlider() : renderAndroidSlider();
};

// ── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  trackContainer: {
    width: "100%",
    alignSelf: "stretch",
    // Android flat styling remains
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6
  },
  trackContainerIOS: {
    width: "100%",
    alignSelf: "stretch",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 0
  },
  glassWrapper: {
    overflow: "hidden"
  },
  disabledOverlay: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    zIndex: 1
  },
  disabledOverlayIOS: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    zIndex: 1
  },
  fill: {
    position: "absolute"
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center"
  },
  labelText: {
    fontWeight: "600",
    letterSpacing: 0.3
  },
  labelTextIOS: {
    fontWeight: "600",
    letterSpacing: 0.2,
    color: "rgba(255, 255, 255, 0.95)",
    fontSize: 14
  },
  thumb: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2
  },
  thumbIOS: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4
  }
});
