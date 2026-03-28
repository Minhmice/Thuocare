import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface IconProps {
  name: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export const Icon: React.FC<IconProps> = ({ name, size = 24, color = '#000000', style }) => {
  return <MaterialCommunityIcons name={name} size={size} color={color} style={style} />;
};
