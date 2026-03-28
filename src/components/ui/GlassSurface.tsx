import { BlurView, type BlurTint } from "expo-blur";
import type { PropsWithChildren } from "react";
import { Platform, View, type StyleProp, type ViewStyle } from "react-native";

type GlassSurfaceProps = PropsWithChildren<{
  intensity?: number;
  style?: StyleProp<ViewStyle>;
  tint?: BlurTint;
}>;

export function GlassSurface({
  children,
  intensity = 75,
  style,
  tint = Platform.OS === "ios" ? "systemChromeMaterial" : "light"
}: GlassSurfaceProps) {
  if (Platform.OS === "web") {
    return <View style={[{ backgroundColor: "rgba(255, 255, 255, 0.92)" }, style]}>{children}</View>;
  }

  return (
    <BlurView
      intensity={intensity}
      tint={tint}
      style={[
        {
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.6)",
          backgroundColor: Platform.OS === "android" ? "rgba(255, 255, 255, 0.72)" : "rgba(255, 255, 255, 0.16)"
        },
        style
      ]}
    >
      {children}
    </BlurView>
  );
}
