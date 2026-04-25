import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { CardProps } from "./types";

export const Card: React.FC<CardProps> = ({
  variant = "flat",
  padding = 16,
  borderRadius = 16,
  style,
  children,
  ...props
}) => {
  return (
    <View
      style={[
        styles.base,
        styles[variant],
        { padding: typeof padding === "number" ? padding : 0 },
        { borderRadius },
        style
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: "#FFFFFF",
    overflow: "hidden"
  },
  flat: {
    backgroundColor: "#F3F3F8"
  },
  elevated: {
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#0058BC",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12
      },
      android: {
        elevation: 4
      }
    })
  },
  outlined: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#E5E7EB"
  }
});
