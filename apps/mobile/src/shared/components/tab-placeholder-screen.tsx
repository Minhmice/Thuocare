import { View } from "react-native";

import { Text } from "@/shared/ui";

export function TabPlaceholderScreen({ title }: { title: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-surface px-6">
      <Text variant="h2" className="text-center text-text">
        {title}
      </Text>
      <Text variant="bodySmall" className="mt-2 text-center text-text-variant">
        Đang xây dựng
      </Text>
    </View>
  );
}
