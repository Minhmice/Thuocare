import { NativeTabs } from "expo-router/unstable-native-tabs";

import { useCapabilities } from "@/core/access/useCapabilities";

export default function TabLayout() {
  const { visibleTabs } = useCapabilities();
  const canAccessPeople = visibleTabs.includes("people");

  return (
    <NativeTabs
      tintColor="#0058BC"
      iconColor={{
        default: "#717786",
        selected: "#0058BC",
      }}
      labelStyle={{
        default: { fontSize: 10, fontWeight: "700" },
        selected: { fontSize: 10, fontWeight: "700" },
      }}
      disableTransparentOnScrollEdge
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Hôm Nay</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          md="home"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="meds">
        <NativeTabs.Trigger.Label>Thuốc</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "pills", selected: "pills.fill" }}
          md="medication"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="people" hidden={!canAccessPeople}>
        <NativeTabs.Trigger.Label>Gia Đình</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "person.2", selected: "person.2.fill" }}
          md="groups"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="me">
        <NativeTabs.Trigger.Label>Tôi</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "person", selected: "person.fill" }}
          md="person"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
