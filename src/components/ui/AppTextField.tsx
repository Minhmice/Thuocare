import type { ReactNode } from "react";
import { useState } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle
} from "react-native";
import { paperTheme } from "../../theme/paperTheme";
import { AppText } from "./AppText";

// Use ViewStyle for `style` so callers can set margins on the container
type AppTextFieldProps = Omit<TextInputProps, "style"> & {
  label?: string;
  style?: StyleProp<ViewStyle>;
  /** Unfocused border color (defaults to theme outline) */
  outlineColor?: string;
  /** Focused border and focused label color (defaults to theme primary) */
  accentColor?: string;
  /** Renders inside the input row, vertically centered (e.g. password visibility icon). */
  rightAccessory?: ReactNode;
};

export function AppTextField({
  label,
  style,
  editable = true,
  outlineColor,
  accentColor,
  rightAccessory,
  onFocus,
  onBlur,
  ...rest
}: AppTextFieldProps) {
  const [focused, setFocused] = useState(false);
  const outline = outlineColor ?? paperTheme.colors.outline;
  const accent = accentColor ?? paperTheme.colors.primary;

  return (
    <View style={style}>
      {label != null ? (
        <AppText
          variant="labelMedium"
          style={{
            marginBottom: 6,
            marginLeft: 4,
            color: focused ? accent : paperTheme.colors.onSurfaceVariant
          }}
        >
          {label}
        </AppText>
      ) : null}
      <View style={styles.inputShell}>
        <TextInput
          {...rest}
          // textContentType="none" placed after rest so it always wins on iOS.
          // This prevents yellow autofill highlight and locked-field behavior.
          textContentType="none"
          editable={editable}
          style={[
            styles.input,
            { borderColor: focused ? accent : outline },
            !editable && styles.inputDisabled,
            rightAccessory != null && styles.inputWithRightAccessory
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
        {rightAccessory != null ? (
          <View style={styles.rightAccessorySlot} pointerEvents="box-none">
            {rightAccessory}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputShell: {
    position: "relative",
    alignSelf: "stretch"
  },
  input: {
    height: 56,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    color: paperTheme.colors.onSurface,
    backgroundColor: "#FFFFFF"
  },
  inputWithRightAccessory: {
    paddingRight: 48
  },
  rightAccessorySlot: {
    position: "absolute",
    right: 4,
    top: 0,
    bottom: 0,
    width: 44,
    justifyContent: "center",
    alignItems: "center"
  },
  inputDisabled: {
    backgroundColor: "#F5F5F5",
    opacity: 0.6
  }
});
