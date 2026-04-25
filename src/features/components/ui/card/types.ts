import { ViewProps, StyleProp, ViewStyle } from "react-native";

export interface CardProps extends ViewProps {
  variant?: "elevated" | "flat" | "outlined";
  padding?: number | string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}
