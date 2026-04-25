import { StyleProp, ViewStyle } from "react-native";

export type AlertVariant = "info" | "warning" | "critical";

export interface AlertBannerProps {
  variant?: AlertVariant;
  title: string;
  description?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}
