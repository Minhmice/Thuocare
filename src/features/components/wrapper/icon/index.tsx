import React from 'react';
import { useTheme } from 'react-native-paper';
import { Icon as IconPrimitive } from '../../ui/icon';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleProp, TextStyle } from 'react-native';

export interface IconWrapperProps {
  name: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  color?: string;
  variant?: 'primary' | 'secondary' | 'error' | 'onSurface' | 'onSurfaceVariant';
  style?: StyleProp<TextStyle>;
}

const SIZE_MAP = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
};

export const Icon: React.FC<IconWrapperProps> = ({
  name,
  size = 'md',
  color,
  variant = 'onSurface',
  style,
}) => {
  const theme = useTheme();

  const iconSize = typeof size === 'number' ? size : SIZE_MAP[size];
  
  let iconColor = color;
  if (!iconColor) {
    switch (variant) {
      case 'primary':
        iconColor = theme.colors.primary;
        break;
      case 'secondary':
        iconColor = theme.colors.secondary;
        break;
      case 'error':
        iconColor = theme.colors.error;
        break;
      case 'onSurfaceVariant':
        iconColor = theme.colors.onSurfaceVariant;
        break;
      default:
        iconColor = theme.colors.onSurface;
    }
  }

  return <IconPrimitive name={name} size={iconSize} color={iconColor} style={style} />;
};
