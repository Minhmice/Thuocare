import React from "react";
import { useTheme } from "react-native-paper";
import {
  Separator as SeparatorPrimitive,
  SeparatorProps
} from "../../ui/separator";

export const Separator: React.FC<SeparatorProps> = ({ color, ...props }) => {
  const theme = useTheme();
  const separatorColor = color || theme.colors.surfaceVariant;

  return <SeparatorPrimitive color={separatorColor} {...props} />;
};
