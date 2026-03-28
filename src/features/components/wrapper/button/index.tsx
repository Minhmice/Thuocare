import React from 'react';
import { useTheme } from 'react-native-paper';
import { Button as ButtonPrimitive } from '../../ui/button';
import { ButtonProps } from '../../ui/button/types';

export const Button: React.FC<ButtonProps> = (props) => {
  const theme = useTheme();

  return (
    <ButtonPrimitive
      {...props}
      style={[
        {
          borderRadius: props.variant === 'primary' ? 9999 : 12,
          paddingHorizontal: props.variant === 'primary' ? 24 : 16,
          backgroundColor: props.variant === 'primary' ? theme.colors.primary : undefined,
        },
        props.style,
      ]}
      labelStyle={[
        {
          fontWeight: '600',
        },
        props.labelStyle,
      ]}
    />
  );
};
