import { StyleProp, ViewStyle } from 'react-native';

export type AlertVariant = 'info' | 'warning' | 'critical';

export interface AlertBannerProps {
  variant?: AlertVariant;
  title: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}
