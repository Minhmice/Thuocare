import React, { useState } from "react";
import { View, TextInput, Text, StyleSheet } from "react-native";
import { InputProps } from "./types";

export const Input: React.FC<InputProps> = ({
  error,
  label,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.focused,
          !!error && styles.errorWrapper
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, inputStyle]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor="#9CA3AF"
          {...props}
        />
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>
      {typeof error === "string" && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: "100%"
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    color: "#374151"
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12
  },
  focused: {
    borderColor: "#0058BC"
  },
  errorWrapper: {
    borderColor: "#C41E1E"
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#111827"
  },
  iconLeft: {
    marginRight: 8
  },
  iconRight: {
    marginLeft: 8
  },
  errorText: {
    fontSize: 12,
    color: "#C41E1E",
    marginTop: 4
  }
});
