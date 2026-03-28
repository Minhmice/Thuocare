import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { Icon } from '../../wrapper/icon';
import { Typography } from '../../wrapper/typography';
import type { SliderConfirmProps } from './types';

// These match the Home hero's SlideToConfirm for visual consistency.
const THUMB_SIZE = 56;
const TRACK_PADDING = 6;

export const SliderConfirm: React.FC<SliderConfirmProps> = ({
  onConfirm,
  label = 'Slide to confirm',
  threshold = 0.75,
  disabled = false,
  loading = false,
  style,
}) => {
  const theme = useTheme();

  // Use refs for everything the PanResponder closure must read.
  // PanResponder is created once; refs let it see current values without
  // needing to be recreated on each render.
  const trackWidthRef = useRef(0);
  const onConfirmRef = useRef(onConfirm);
  const thresholdRef = useRef(threshold);
  const blockedRef = useRef(disabled || loading);

  useEffect(() => { onConfirmRef.current = onConfirm; }, [onConfirm]);
  useEffect(() => { thresholdRef.current = threshold; }, [threshold]);
  useEffect(() => { blockedRef.current = disabled || loading; }, [disabled, loading]);

  const thumbAnim = useRef(new Animated.Value(0)).current;

  // Maximum x distance the thumb can travel.
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
      onStartShouldSetPanResponder: () => !blockedRef.current,
      onMoveShouldSetPanResponder: () => !blockedRef.current,
      onPanResponderGrant: () => {
        thumbAnim.stopAnimation();
      },
      onPanResponderMove: (_, gs) => {
        thumbAnim.setValue(Math.max(0, Math.min(gs.dx, maxX())));
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx >= maxX() * thresholdRef.current) {
          // Snap to end, then fire confirm.
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
        // Gesture interrupted by OS (incoming call, scroll conflict, etc.)
        springBack();
      },
    })
  ).current;

  // Label fades out as the thumb moves right.
  const labelOpacity = thumbAnim.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const isBlocked = disabled || loading;

  return (
    <View
      style={[
        styles.track,
        // Only dim when disabled (not loading — the spinner communicates that).
        disabled && !loading && styles.trackDisabled,
        style,
      ]}
      onLayout={(e) => {
        trackWidthRef.current = e.nativeEvent.layout.width;
      }}
    >
      {/* Label — centered, fades as thumb advances */}
      {!loading && (
        <Animated.View
          style={[styles.overlay, { opacity: labelOpacity }]}
          pointerEvents="none"
        >
          <Typography
            variant="label-sm"
            weight="bold"
            style={styles.labelText}
          >
            {label.toUpperCase()}
          </Typography>
        </Animated.View>
      )}

      {/* Track-level loading indicator */}
      {loading && (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
        </View>
      )}

      {/* Draggable thumb */}
      <Animated.View
        style={[styles.thumb, { transform: [{ translateX: thumbAnim }] }]}
        {...(!isBlocked ? panResponder.panHandlers : {})}
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <Icon
            name="chevron-right"
            size={28}
            color={disabled ? theme.colors.onSurfaceVariant : theme.colors.primary}
          />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Default track is designed for use on the primary blue Home hero.
  // Consumers rendering on a light background should override via `style`.
  track: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 9999,
    padding: TRACK_PADDING,
    flexDirection: 'row',
    alignItems: 'center',
    height: THUMB_SIZE + TRACK_PADDING * 2,
  },
  trackDisabled: {
    opacity: 0.45,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 2.5,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    zIndex: 1,
  },
});
