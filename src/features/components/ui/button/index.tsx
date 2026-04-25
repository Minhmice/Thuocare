import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View
} from "react-native";
import { ButtonProps } from "./types";

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
  labelStyle,
  children,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={isDisabled}
      style={[
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        style
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#FFFFFF" : "#0058BC"}
        />
      ) : (
        <>
          {label && (
            <Text
              style={[styles.label, styles[`label_${variant}`], labelStyle]}
            >
              {label}
            </Text>
          )}
          {children}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    flexDirection: "row"
  },
  primary: {
    backgroundColor: "#0058BC"
  },
  secondary: {
    backgroundColor: "#F3F3F8"
  },
  text: {
    backgroundColor: "transparent",
    height: "auto",
    paddingHorizontal: 0
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#0058BC"
  },
  error: {
    backgroundColor: "#C41E1E"
  },
  disabled: {
    opacity: 0.5
  },
  label: {
    fontSize: 16,
    fontWeight: "600"
  },
  label_primary: {
    color: "#FFFFFF"
  },
  label_secondary: {
    color: "#0058BC"
  },
  label_text: {
    color: "#0058BC"
  },
  label_ghost: {
    color: "#0058BC"
  },
  label_error: {
    color: "#FFFFFF"
  }
});
