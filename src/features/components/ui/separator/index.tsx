import React from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";

export interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export const Separator: React.FC<SeparatorProps> = ({
  orientation = "horizontal",
  size = 1,
  color = "#E5E7EB",
  style
}) => {
  return (
    <View
      style={[
        orientation === "horizontal"
          ? { height: size, width: "100%" }
          : { width: size, height: "100%" },
        { backgroundColor: color },
        style
      ]}
    />
  );
};
