import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import type { NextDoseGroup } from "../../../../types/home";
import { CollapsedView } from "./collapsed-view";
import { ExpandedView } from "./expanded-view";
import { COLLAPSE_END, COLLAPSE_START, PRIMARY } from "./shared-parts";

const EXPANDED_MIN_HEIGHT = 420;
const CARD_SIDE_PADDING = 20;
const COLLAPSED_TOP_GAP = 12;

export type ReminderExperienceProps = {
  readonly nextDose: NextDoseGroup;
  readonly viewportHeight: number;
  readonly topInset: number;
  readonly onConfirm: () => void;
  readonly scrollY?: Animated.Value;
  readonly children: React.ReactNode;
};

export function ReminderExperience({
  nextDose,
  viewportHeight,
  topInset,
  onConfirm,
  scrollY,
  children,
}: ReminderExperienceProps) {
  const internalScrollY = useRef(new Animated.Value(0)).current;
  const reminderScrollY = scrollY ?? internalScrollY;
  const [isImmersive, setIsImmersive] = useState(true);

  const [touchFocus, setTouchFocus] = useState<"expanded" | "collapsed">("expanded");
  const threshold = 180; // Point where touch focus flips

  // Synchronize immersive mode AND touch focus
  useEffect(() => {
    const id = reminderScrollY.addListener(({ value }) => {
      // Status bar handling
      const shouldBeImmersive = value < 20;
      if (shouldBeImmersive !== isImmersive) {
        setIsImmersive(shouldBeImmersive);
      }

      // Touch layer focus handling
      const newFocus = value < threshold ? "expanded" : "collapsed";
      if (newFocus !== touchFocus) {
        setTouchFocus(newFocus);
      }
    });
    return () => reminderScrollY.removeListener(id);
  }, [isImmersive, touchFocus, reminderScrollY]);

  // We make the shell taller than the viewport and offset it to hide 
  // the permanent border radius in fullscreen mode.
  const CORNER_BUFFER = 60;
  const expandedHeight = Math.max(EXPANDED_MIN_HEIGHT, viewportHeight) + (CORNER_BUFFER * 2);

  const shellScale = reminderScrollY.interpolate({
    inputRange: [0, COLLAPSE_START, COLLAPSE_END],
    outputRange: [1, 1, 0.92],
    extrapolate: "clamp",
  });

  const shellTranslateY = reminderScrollY.interpolate({
    inputRange: [0, COLLAPSE_START, COLLAPSE_END],
    outputRange: [-CORNER_BUFFER, -CORNER_BUFFER, COLLAPSED_TOP_GAP],
    extrapolate: "clamp",
  });

  const expandedOpacity = reminderScrollY.interpolate({
    inputRange: [0, COLLAPSE_START, COLLAPSE_END - 80, COLLAPSE_END],
    outputRange: [1, 1, 0, 0],
    extrapolate: "clamp",
  });

  const expandedTranslateY = reminderScrollY.interpolate({
    inputRange: [0, COLLAPSE_START, COLLAPSE_END],
    outputRange: [CORNER_BUFFER, CORNER_BUFFER, CORNER_BUFFER - 20],
    extrapolate: "clamp",
  });

  const collapsedOpacity = reminderScrollY.interpolate({
    inputRange: [0, COLLAPSE_START + 40, COLLAPSE_END - 20, COLLAPSE_END],
    outputRange: [0, 0, 1, 1],
    extrapolate: "clamp",
  });

  const collapsedTranslateY = reminderScrollY.interpolate({
    inputRange: [0, COLLAPSE_START + 84, COLLAPSE_END],
    outputRange: [CORNER_BUFFER + 24, CORNER_BUFFER + 24, CORNER_BUFFER],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.root} pointerEvents="box-none">
      <StatusBar hidden={isImmersive} animated />
      <Animated.ScrollView
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: reminderScrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={8}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.shell,
            {
              height: expandedHeight,
              borderRadius: 40,
              transform: [
                { translateY: shellTranslateY },
                { scale: shellScale }
              ],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.layer,
              {
                opacity: expandedOpacity,
                transform: [{ translateY: expandedTranslateY }],
              },
            ]}
            pointerEvents={touchFocus === "expanded" ? "auto" : "none"}
          >
            <ExpandedView
              nextDose={nextDose}
              expandedHeight={viewportHeight}
              topInset={topInset}
              onConfirm={onConfirm}
              scrollY={reminderScrollY}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.layer,
              {
                opacity: collapsedOpacity,
                transform: [{ translateY: collapsedTranslateY }],
              },
            ]}
            pointerEvents={touchFocus === "collapsed" ? "auto" : "none"}
          >
            <CollapsedView
              nextDose={nextDose}
              onConfirm={onConfirm}
              scrollY={reminderScrollY}
            />
          </Animated.View>
        </Animated.View>

        <View style={styles.scheduleSection}>
          {children}
        </View>

        <View style={{ height: 200 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    // Transparent wrapper
  },
  scrollContent: {
    // Transparent wrapper
    paddingBottom: 0, 
  },
  shell: {
    backgroundColor: PRIMARY,
    overflow: "hidden",
  },
  layer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scheduleSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: "#FFFFFF",
    gap: 16,
  },
});
