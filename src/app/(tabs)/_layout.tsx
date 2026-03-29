import { Tabs } from "expo-router";
import { MainTabBar } from "../../features/components/composed/main-tab-bar";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import { UIProvider } from "../../lib/ui-context";

export default function TabsLayout() {
  const { t } = useLanguage();

  return (
    <UIProvider>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={() => null}
      >
        <Tabs.Screen name="home" options={{ title: t("tab_home") }} />
        <Tabs.Screen name="meds" options={{ title: t("tab_meds") }} />
        <Tabs.Screen name="me" options={{ title: t("tab_me") }} />
        <Tabs.Screen
          name="lab"
          options={{
            title: t("tab_lab"),
            // Hidden in production — visible in dev builds only
            tabBarButton: __DEV__ ? undefined : () => null,
          }}
        />
      </Tabs>
    </UIProvider>
  );
}
