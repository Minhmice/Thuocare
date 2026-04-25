import React from "react";
import { View, StyleSheet, Animated, Dimensions, Text } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface ToastProps {
  visible: boolean;
  message: string;
  duration?: number;
  onDismiss: () => void;
  type?: "info" | "success" | "error";
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  duration = 3000,
  onDismiss,
  type = "info"
}) => {
  const [opacity] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.delay(duration),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ]).start(() => {
        onDismiss();
      });
    }
  }, [visible, opacity, duration, onDismiss]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity }, styles[type]]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    backgroundColor: "#374151",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: SCREEN_WIDTH * 0.8,
    alignItems: "center",
    zIndex: 9999
  },
  info: {
    backgroundColor: "#374151"
  },
  success: {
    backgroundColor: "#10B981"
  },
  error: {
    backgroundColor: "#EF4444"
  },
  text: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center"
  }
});
