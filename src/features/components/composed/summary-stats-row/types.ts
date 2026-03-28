import { StyleProp, ViewStyle } from 'react-native';

export interface StatItem {
  label: string;
  value: string | number;
  color?: string;
  emphasize?: boolean;
}

export interface SummaryStatsRowProps {
  items: StatItem[];
  style?: StyleProp<ViewStyle>;
}
