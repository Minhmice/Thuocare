import React from 'react';
import { useTheme } from 'react-native-paper';
import { Field as FieldPrimitive } from '../../ui/field';
import { FieldProps } from '../../ui/field/types';

export const Field: React.FC<FieldProps> = (props) => {
  const theme = useTheme();

  return (
    <FieldPrimitive
      {...props}
      labelStyle={[
        {
          color: theme.colors.onSurface,
          fontSize: 14,
          fontWeight: '600',
        },
        props.labelStyle,
      ]}
      errorStyle={[
        {
          color: theme.colors.error,
        },
        props.errorStyle,
      ]}
    />
  );
};
