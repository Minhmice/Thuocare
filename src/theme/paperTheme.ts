import { MD3LightTheme, type MD3Theme } from "react-native-paper";

export const paperTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 24,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#0058BC",
    secondary: "#3A6EA5",
    tertiary: "#C84F3D",
    error: "#C41E1E",
    background: "#F9F9FE",
    surface: "#F9F9FE",
    surfaceVariant: "#ECECF4",
    surfaceDisabled: "#E7EAF0",
    onSurface: "#1A1C1F",
    onSurfaceVariant: "#5F6673",
    outline: "rgba(0, 88, 188, 0.22)"
  }
} as any;
