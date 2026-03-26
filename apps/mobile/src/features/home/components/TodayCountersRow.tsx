import { Pressable, View } from "react-native";

import { Text } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";

export type TodayCounterTone = "good" | "neutral" | "danger";

export type TodayCounterItem = {
  label: string;
  value: number;
  tone?: TodayCounterTone;
};

export type TodayCountersRowProps = {
  items: readonly [TodayCounterItem, TodayCounterItem, TodayCounterItem];
  onPressTaken: () => void;
  onPressRemaining: () => void;
  onPressMissed: () => void;
};

function toneClasses(tone: TodayCounterTone | undefined) {
  switch (tone) {
    case "good":
      return {
        dot: "bg-primary/20",
        dotInner: "bg-primary",
      };
    case "danger":
      return {
        dot: "bg-error/15",
        dotInner: "bg-error",
      };
    default:
      return {
        dot: "bg-surface-low",
        dotInner: "bg-text-variant/60",
      };
  }
}

function CounterCard({
  item,
  onPress,
}: {
  item: TodayCounterItem;
  onPress: () => void;
}) {
  const t = toneClasses(item.tone);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-1 rounded-3xl border border-border bg-surface px-4 py-3 active:bg-surface-low"
    >
      <View className="flex-row items-center justify-between">
        <View>
          <Text variant="h2" className="text-text">
            {item.value}
          </Text>
          <Text variant="label" className="mt-1">
            {item.label}
          </Text>
        </View>

        <View className={cn("h-10 w-10 items-center justify-center rounded-2xl", t.dot)}>
          <View className={cn("h-3.5 w-3.5 rounded-full", t.dotInner)} />
        </View>
      </View>
    </Pressable>
  );
}

export function TodayCountersRow({ items, onPressTaken, onPressRemaining, onPressMissed }: TodayCountersRowProps) {
  return (
    <View className="flex-row gap-3">
      <CounterCard item={items[0]} onPress={onPressTaken} />
      <CounterCard item={items[1]} onPress={onPressRemaining} />
      <CounterCard item={items[2]} onPress={onPressMissed} />
    </View>
  );
}

