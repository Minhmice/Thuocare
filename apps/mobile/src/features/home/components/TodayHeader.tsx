import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";

import { Text } from "@/shared/ui";

export type TodayHeaderProps = {
  dayLabel: string;
  dateLabel: string;
  timeLabel: string;
};

export function TodayHeader({ dayLabel, dateLabel, timeLabel }: TodayHeaderProps) {
  const router = useRouter();

  return (
    <View className="flex-row items-start justify-between">
      <View>
        <Text variant="h2" className="text-text">
          {dayLabel}
        </Text>
        <Text variant="bodySmall" className="mt-0.5 text-text-variant">
          {dateLabel}
        </Text>
      </View>

      <View className="flex-row items-center gap-2">
        <View className="rounded-full bg-surface-low px-3 py-2 border border-border">
          <Text variant="bodySmall" className="text-text">
            {timeLabel}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mở menu"
          onPress={() => router.push("/modal?screen=actions")}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface-low border border-border active:opacity-90"
        >
          <SymbolView name={{ ios: "gearshape.fill", android: "settings", web: "settings" }} tintColor="#717786" size={18} />
        </Pressable>
      </View>
    </View>
  );
}

