import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";

import { Text } from "@/shared/ui";

type ActionRowProps = {
  title: string;
  subtitle?: string;
  iconIos: string;
  iconAndroid: string;
  onPress: () => void;
};

function ActionRow({ title, subtitle, iconIos, iconAndroid, onPress }: ActionRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl px-3 py-3 active:bg-surface-low"
    >
      <View className="h-10 w-10 items-center justify-center rounded-2xl bg-surface-low">
        <SymbolView name={{ ios: iconIos as never, android: iconAndroid as never, web: iconAndroid as never }} tintColor="#0058BC" size={18} />
      </View>
      <View className="flex-1">
        <Text variant="bodyMedium" className="text-text">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodySmall" className="text-text-variant">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <SymbolView name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }} tintColor="#717786" size={16} />
    </Pressable>
  );
}

export function ActionMenuModal() {
  const router = useRouter();

  function closeThenNavigate(href: string) {
    router.back();
    // Defer navigation until after modal is dismissed.
    setTimeout(() => {
      router.push(href);
    }, 0);
  }

  return (
    <View className="flex-1 bg-black/30">
      <Pressable accessibilityRole="button" onPress={() => router.back()} className="flex-1" />

      <View className="rounded-t-3xl bg-surface px-5 pt-4 pb-6 border border-border">
        <View className="items-center">
          <View className="h-1.5 w-12 rounded-full bg-border" />
        </View>

        <View className="mt-3 flex-row items-center justify-between">
          <Text variant="h3" className="text-text">
            Thao tác
          </Text>
          <Pressable accessibilityRole="button" onPress={() => router.back()} className="rounded-full bg-surface-low px-3 py-2 active:opacity-90">
            <Text variant="bodySmall" className="text-text">
              Đóng
            </Text>
          </Pressable>
        </View>

        <View className="mt-3 gap-1">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace("/modal?screen=med-form")}
            className="rounded-2xl bg-primary px-4 py-3 active:opacity-90"
          >
            <Text variant="bodyMedium" className="text-white text-center">
              Thêm thuốc
            </Text>
          </Pressable>

          <ActionRow
            title="Thêm thuốc"
            subtitle="Tạo thuốc mới và giờ uống"
            iconIos="plus.circle.fill"
            iconAndroid="add_circle"
            onPress={() => router.replace("/modal?screen=med-form")}
          />
          <ActionRow
            title="Đến tab Thuốc"
            subtitle="Xem danh sách và chỉnh sửa"
            iconIos="pills.fill"
            iconAndroid="medication"
            onPress={() => closeThenNavigate("/(tabs)/meds")}
          />
        </View>
      </View>
    </View>
  );
}

