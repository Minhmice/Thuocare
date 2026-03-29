import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  StyleSheet,
  View,
} from "react-native";
import { useTheme } from "react-native-paper";
import { Icon } from "../../wrapper/icon";
import { Typography } from "../../wrapper/typography";
import type { SliderConfirmProps } from "./types";

// md/medium = standard compact; lg/large = primary-action (Apple-alarm inspired, visibly larger)
const SIZE_CONFIG = {
  medium: { thumb: 56, padding: 6 },
  large: { thumb: 72, padding: 10 },
} as const;

type NormalizedSize = keyof typeof SIZE_CONFIG;

function normalizeSize(size: SliderConfirmProps["size"]): NormalizedSize {
  if (size === "lg" || size === "large") return "large";
  return "medium";
}

export const SliderConfirm: React.FC<SliderConfirmProps> = ({
  onConfirm,
  label = "Slide to confirm",
  threshold = 0.75,
  disabled = false,
  loading = false,
  size = "medium",
  style,
}) => {
  const theme = useTheme();

  const sz = normalizeSize(size);
  const { thumb: THUMB_SIZE, padding: TRACK_PADDING } = SIZE_CONFIG[sz];

  const trackWidthRef = useRef(0);
  const onConfirmRef = useRef(onConfirm);
  const thresholdRef = useRef(threshold);
  const blockedRef = useRef(disabled || loading);

  useEffect(() => { onConfirmRef.current = onConfirm; }, [onConfirm]);
  useEffect(() => { thresholdRef.current = threshold; }, [threshold]);
  useEffect(() => { blockedRef.current = disabled || loading; }, [disabled, loading]);

  const thumbAnim = useRef(new Animated.Value(0)).current;

  const maxX = () =>
    Math.max(0, trackWidthRef.current - THUMB_SIZE - TRACK_PADDING * 2);

  const springBack = () => {
    Animated.spring(thumbAnim, {
      toValue: 0,
      useNativeDriver: false,
      tension: 80,
      friction: 8,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      // Do not claim on touch-start: let ScrollView's responder run first.
      // This preserves vertical scroll when the user touches the slider area.
      onStartShouldSetPanResponder: () => false,

      // Only claim once movement is clearly horizontal (dx > dy, with a small
      // dead zone of 3px to avoid accidental claims on near-diagonal drags).
      onMoveShouldSetPanResponder: (_, gs) => {
        if (blockedRef.current) return false;
        return Math.abs(gs.dx) > Math.abs(gs.dy) && Math.abs(gs.dx) > 3;
      },

      onPanResponderGrant: () => {
        thumbAnim.stopAnimation();
      },
      onPanResponderMove: (_, gs) => {
        thumbAnim.setValue(Math.max(0, Math.min(gs.dx, maxX())));
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx >= maxX() * thresholdRef.current) {
          Animated.timing(thumbAnim, {
            toValue: maxX(),
            duration: 120,
            useNativeDriver: false,
          }).start(() => {
            onConfirmRef.current();
          });
        } else {
          springBack();
        }
      },
      onPanResponderTerminate: () => {
        springBack();
      },
    })
  ).current;

  // Label fades out as the thumb moves right.
  const labelOpacity = thumbAnim.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const isBlocked = disabled || loading;

  return (
    <View
      style={[
        styles.track,
        { height: THUMB_SIZE + TRACK_PADDING * 2, padding: TRACK_PADDING },
        disabled && !loading && styles.trackDisabled,
        style,
      ]}
      onLayout={(e) => {
        trackWidthRef.current = e.nativeEvent.layout.width;
      }}
    >
      {!loading && (
        <Animated.View
          style={[styles.overlay, { opacity: labelOpacity }]}
          pointerEvents="none"
        >
          <Typography
            variant={sz === "large" ? "label-md" : "label-sm"}
            weight="bold"
            style={styles.labelText}
          >
            {label.toUpperCase()}
          </Typography>
        </Animated.View>
      )}

      {loading && (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
        </View>
      )}

      <Animated.View
        style={[
          styles.thumb,
          {
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: THUMB_SIZE / 2,
            transform: [{ translateX: thumbAnim }],
          },
        ]}
        {...(!isBlocked ? panResponder.panHandlers : {})}
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <Icon
            name="chevron-right"
            size={sz === "large" ? 36 : 28}
            color={disabled ? theme.colors.onSurfaceVariant : theme.colors.primary}
          />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    backgroundColor: "rgba(0, 0, 0, 0.15)",
    borderRadius: 9999,
    flexDirection: "row",
    alignItems: "center",
  },
  trackDisabled: {
    opacity: 0.45,
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
    color: "rgba(255, 255, 255, 0.9)",
    letterSpacing: 2.5,
  },
  thumb: {
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
});
