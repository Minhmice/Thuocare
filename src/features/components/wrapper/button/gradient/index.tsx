import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Button as ButtonPrimitive } from "../../../ui/button";
import { ButtonProps } from "../../../ui/button/types";

export interface GradientButtonProps extends Omit<ButtonProps, "variant"> {
  colors?: readonly [string, string, ...string[]];
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  colors = ["#0058BC", "#003A7A"],
  style,
  ...props
}) => {
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[
        {
          borderRadius: 9999,
          overflow: "hidden"
        },
        style
      ]}
    >
      <ButtonPrimitive
        {...props}
        variant="text" // Uses transparent background
        style={{
          paddingHorizontal: 24,
          backgroundColor: "transparent"
        }}
        labelStyle={[
          {
            fontWeight: "600",
            color: "#FFFFFF"
          },
          props.labelStyle
        ]}
      />
    </LinearGradient>
  );
};
