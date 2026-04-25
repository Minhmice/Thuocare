import React from "react";
import { useTheme } from "react-native-paper";
import { Checkbox as CheckboxPrimitive } from "../../ui/checkbox";
import { CheckboxProps } from "../../ui/checkbox/types";

export const Checkbox: React.FC<CheckboxProps> = (props) => {
  const theme = useTheme();

  return (
    <CheckboxPrimitive
      {...props}
      labelStyle={[
        {
          color: theme.colors.onSurface,
          fontSize: 14
        },
        props.labelStyle
      ]}
    />
  );
};
