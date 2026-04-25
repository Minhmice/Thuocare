import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CheckboxProps } from "./types";

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onCheckedChange,
  label,
  disabled = false,
  style,
  labelStyle,
  ...props
}) => {
  const handlePress = () => {
    if (!disabled) {
      onCheckedChange(!checked);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled}
      onPress={handlePress}
      style={[styles.container, disabled && styles.disabled, style]}
      {...props}
    >
      <View style={[styles.checkbox, checked && styles.checked]}>
        {checked && (
          <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
        )}
      </View>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10
  },
  checked: {
    backgroundColor: "#0058BC",
    borderColor: "#0058BC"
  },
  label: {
    fontSize: 16,
    color: "#374151"
  },
  disabled: {
    opacity: 0.5
  }
});
