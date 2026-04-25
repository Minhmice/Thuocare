import React from "react";
import { useTheme } from "react-native-paper";
import { Button as ButtonPrimitive } from "../../../ui/button";
import { ButtonProps } from "../../../ui/button/types";

export const PrimaryButton: React.FC<Omit<ButtonProps, "variant">> = (
  props
) => {
  const theme = useTheme();

  return (
    <ButtonPrimitive
      {...props}
      variant="primary"
      style={[
        {
          borderRadius: 9999,
          paddingHorizontal: 24,
          backgroundColor: theme.colors.primary
        },
        props.style
      ]}
      labelStyle={[
        {
          fontWeight: "600"
        },
        props.labelStyle
      ]}
    />
  );
};
