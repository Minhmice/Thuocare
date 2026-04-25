import React from "react";
import { useTheme } from "react-native-paper";
import { Card as CardPrimitive } from "../../ui/card";
import { CardProps } from "../../ui/card/types";

export const Card: React.FC<CardProps> = (props) => {
  const theme = useTheme();

  return (
    <CardPrimitive
      {...props}
      style={[
        {
          backgroundColor:
            props.variant === "elevated"
              ? theme.colors.surface
              : theme.colors.surfaceVariant,
          borderRadius: 24 // Matches paperTheme roundness
        },
        props.style
      ]}
    />
  );
};
