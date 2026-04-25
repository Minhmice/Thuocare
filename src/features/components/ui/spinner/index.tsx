import React from "react";
import {
  ActivityIndicator,
  ActivityIndicatorProps,
  StyleProp,
  ViewStyle
} from "react-native";

export interface SpinnerProps extends ActivityIndicatorProps {
  size?: number | "small" | "large";
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = "small",
  color = "#0058BC",
  ...props
}) => {
  return <ActivityIndicator size={size} color={color} {...props} />;
};
