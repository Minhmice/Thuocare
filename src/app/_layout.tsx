import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../lib/auth/AuthProvider";
import { AndroidNavigationBar } from "../lib/system/AndroidNavigationBar";
import { paperTheme } from "../theme/paperTheme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PaperProvider theme={paperTheme}>
          <StatusBar style="dark" />
          <AndroidNavigationBar />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: paperTheme.colors.surface } }} />
        </PaperProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
