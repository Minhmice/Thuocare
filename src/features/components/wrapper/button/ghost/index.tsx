import React from 'react';
import { Button as ButtonPrimitive } from '../../../ui/button';
import { ButtonProps } from '../../../ui/button/types';

export const GhostButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => {
  return (
    <ButtonPrimitive
      {...props}
      variant="ghost"
      style={[
        {
          borderRadius: 12,
          paddingHorizontal: 16,
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
