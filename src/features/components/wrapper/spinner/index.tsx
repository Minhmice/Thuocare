import React from 'react';
import { useTheme } from 'react-native-paper';
import { Spinner as SpinnerPrimitive } from '../../ui/spinner';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

export interface SpinnerWrapperProps {
  size?: 'sm' | 'md' | 'lg' | number;
  color?: string;
  center?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SIZE_MAP = {
  sm: 'small' as const,
  md: 'small' as const,
  lg: 'large' as const,
};

export const Spinner: React.FC<SpinnerWrapperProps> = ({
  size = 'md',
  color,
  center = false,
  style,
}) => {
  const theme = useTheme();
  const spinnerColor = color || theme.colors.primary;
  const spinnerSize = typeof size === 'number' ? size : SIZE_MAP[size];

  const content = (
    <SpinnerPrimitive size={spinnerSize} color={spinnerColor} style={style} />
  );

  if (center) {
    return <View style={styles.center}>{content}</View>;
  }

  return content;
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
