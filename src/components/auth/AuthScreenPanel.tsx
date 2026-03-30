import type { PropsWithChildren } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

/** Hairline border aligned with brand primary `#0058BC` */
export const AUTH_PANEL_BORDER = "rgba(0, 88, 188, 0.12)";
export const AUTH_PANEL_RADIUS = 18;

/**
 * Vertical offset for password visibility control when absolutely positioned
 * next to auth text fields (e.g. `AppTextField` row height 56).
 */
export const AUTH_PASSWORD_TOGGLE_TOP = 0;

const panelBase: ViewStyle = {
  backgroundColor: "#FFFFFF",
  borderRadius: AUTH_PANEL_RADIUS,
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: AUTH_PANEL_BORDER
};

type AuthScreenPanelProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

/** Single white form surface for sign-in / sign-up (no MD3 contained elevation). */
export function AuthScreenPanel({ children, style }: AuthScreenPanelProps) {
  return <View style={[panelBase, { padding: 24 }, style]}>{children}</View>;
}

type AuthModalPanelProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

/** White dialog body for auth modals (forgot password, legal). */
export function AuthModalPanel({ children, style }: AuthModalPanelProps) {
  return (
    <View
      style={[
        panelBase,
        {
          padding: 24,
          marginHorizontal: 20,
          width: "100%",
          maxWidth: 420
        },
        style
      ]}
    >
      {children}
    </View>
  );
}
