import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../lib/auth/AuthProvider";
import { LanguageProvider } from "../lib/i18n/LanguageProvider";
import { MedicationsProvider } from "../lib/meds/MedicationsProvider";
import { AndroidNavigationBar } from "../lib/system/AndroidNavigationBar";
import { paperTheme } from "../theme/paperTheme";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LanguageProvider>
          <AuthProvider>
            <PaperProvider theme={paperTheme}>
              <MedicationsProvider>
                <StatusBar style="dark" />
                <AndroidNavigationBar />
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: paperTheme.colors.surface } }} />
              </MedicationsProvider>
            </PaperProvider>
          </AuthProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
