import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";

import { useCapabilities } from "@/core/access/useCapabilities";

export default function TabLayoutWeb() {
  const { visibleTabs } = useCapabilities();
  const canAccessPeople = visibleTabs.includes("people");

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0058BC",
        tabBarInactiveTintColor: "#717786",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Hôm Nay",
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: "house", android: "home", web: "home" }} tintColor={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="meds"
        options={{
          title: "Thuốc",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: "pills", android: "medical_services", web: "medication" }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="people"
        options={{
          title: "Gia Đình",
          href: canAccessPeople ? undefined : null,
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: "person.2", android: "groups", web: "groups" }} tintColor={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: "Tôi",
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: "person", android: "person", web: "person" }} tintColor={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}
