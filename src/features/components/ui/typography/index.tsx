import React from "react";
import { Text, StyleSheet } from "react-native";
import { TypographyProps } from "./types";

export const Typography: React.FC<TypographyProps> = ({
  variant = "body-md",
  color,
  weight,
  align,
  style,
  children,
  ...props
}) => {
  return (
    <Text
      style={[
        styles.base,
        styles[variant],
        color ? { color } : null,
        weight ? { fontWeight: getFontWeight(weight) } : null,
        align ? { textAlign: align } : null,
        style
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

const getFontWeight = (weight: string) => {
  switch (weight) {
    case "bold":
      return "700";
    case "semi-bold":
      return "600";
    case "medium":
      return "500";
    default:
      return "400";
  }
};

const styles = StyleSheet.create({
  base: {
    fontFamily: "System" // Fallback to system font
  },
  "display-lg": { fontSize: 57, lineHeight: 64 },
  "display-md": { fontSize: 45, lineHeight: 52 },
  "display-sm": { fontSize: 36, lineHeight: 44 },
  "headline-lg": { fontSize: 32, lineHeight: 40 },
  "headline-md": { fontSize: 28, lineHeight: 36 },
  "headline-sm": { fontSize: 24, lineHeight: 32 },
  "title-lg": { fontSize: 22, lineHeight: 28 },
  "title-md": { fontSize: 16, lineHeight: 24, fontWeight: "500" },
  "title-sm": { fontSize: 14, lineHeight: 20, fontWeight: "500" },
  "body-lg": { fontSize: 16, lineHeight: 24 },
  "body-md": { fontSize: 14, lineHeight: 20 },
  "body-sm": { fontSize: 12, lineHeight: 16 },
  "label-lg": { fontSize: 14, lineHeight: 20, fontWeight: "500" },
  "label-md": { fontSize: 12, lineHeight: 16, fontWeight: "500" },
  "label-sm": { fontSize: 11, lineHeight: 16, fontWeight: "500" }
});
