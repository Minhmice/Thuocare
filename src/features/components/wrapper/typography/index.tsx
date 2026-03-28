import React from 'react';
import { useTheme } from 'react-native-paper';
import { Typography as TypographyPrimitive } from '../../ui/typography';
import { TypographyProps } from '../../ui/typography/types';

export const Typography: React.FC<TypographyProps> = (props) => {
  const theme = useTheme();

  return (
    <TypographyPrimitive
      {...props}
      color={props.color || theme.colors.onSurface}
      style={[
        {
          fontFamily: props.variant?.startsWith('display') || props.variant?.startsWith('headline')
            ? 'PlusJakartaSans-Bold' // Would be mapped if font exists
            : 'Inter-Regular',
        },
        props.style,
      ]}
    />
  );
};
