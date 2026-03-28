import { useState } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { paperTheme } from "../../theme/paperTheme";
import { AppText } from "./AppText";

// Use ViewStyle for `style` so callers can set margins on the container
type AppTextFieldProps = Omit<TextInputProps, "style"> & {
  label?: string;
  style?: StyleProp<ViewStyle>;
};

export function AppTextField({
  label,
  style,
  editable = true,
  onFocus,
  onBlur,
  ...rest
}: AppTextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={style}>
      {label != null ? (
        <AppText
          variant="labelMedium"
          style={{
            marginBottom: 6,
            marginLeft: 4,
            color: focused
              ? paperTheme.colors.primary
              : paperTheme.colors.onSurfaceVariant,
          }}
        >
          {label}
        </AppText>
      ) : null}
      <TextInput
        {...rest}
        // textContentType="none" placed after rest so it always wins on iOS.
        // This prevents yellow autofill highlight and locked-field behavior.
        textContentType="none"
        editable={editable}
        style={[
          styles.input,
          focused && styles.inputFocused,
          !editable && styles.inputDisabled,
        ]}
        placeholderTextColor="rgba(95, 102, 115, 0.5)"
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 56,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: paperTheme.colors.outline,
    paddingHorizontal: 16,
    fontSize: 16,
    color: paperTheme.colors.onSurface,
    backgroundColor: "#FFFFFF",
  },
  inputFocused: {
    borderColor: paperTheme.colors.primary,
  },
  inputDisabled: {
    backgroundColor: "#F5F5F5",
    opacity: 0.6,
  },
});
