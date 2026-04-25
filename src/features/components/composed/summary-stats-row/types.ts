import { StyleProp, ViewStyle } from "react-native";

export interface StatItem {
  label: string;
  value: string | number;
  color?: string;
  emphasize?: boolean;
  helperText?: string;
}

export interface SummaryStatsRowProps {
  items: StatItem[];
  style?: StyleProp<ViewStyle>;
  segmented?: boolean;
}
