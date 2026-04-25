import React from "react";
import { useTheme } from "react-native-paper";
import { Input as InputPrimitive } from "../../ui/input";
import { InputProps } from "../../ui/input/types";

export const Input: React.FC<InputProps> = (props) => {
  const theme = useTheme();

  return (
    <InputPrimitive
      {...props}
      containerStyle={[
        {
          marginBottom: 16
        },
        props.containerStyle
      ]}
      inputStyle={[
        {
          color: theme.colors.onSurface
        },
        props.inputStyle
      ]}
      placeholderTextColor={theme.colors.onSurfaceVariant}
    />
  );
};
