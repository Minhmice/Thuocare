import { Pressable, View } from "react-native";
import { SymbolView } from "expo-symbols";

import { Text } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";

export type TodayDoseStatus = "taken" | "upcoming" | "overdue" | "missed" | "skipped";

export type TodayScheduleRowModel = {
  id: string;
  timeLabel: string;
  title: string;
  subtitle?: string;
  status: TodayDoseStatus;
};

export type TodayScheduleRowProps = {
  row: TodayScheduleRowModel;
  onPress: () => void;
  onLongPress?: () => void;
};

function statusPill(status: TodayDoseStatus) {
  switch (status) {
    case "taken":
      return { label: "Đã uống", className: "bg-primary/10 text-primary", icon: "checkmark.circle.fill" as const };
    case "missed":
      return { label: "Quên", className: "bg-error/10 text-error", icon: "xmark.circle.fill" as const };
    case "overdue":
      return { label: "Trễ", className: "bg-error/10 text-error", icon: "exclamationmark.circle.fill" as const };
    case "skipped":
      return { label: "Bỏ qua", className: "bg-surface-low text-text-variant", icon: "minus.circle.fill" as const };
    default:
      return { label: "Sắp tới", className: "bg-surface-low text-text-variant", icon: "clock.fill" as const };
  }
}

export function TodayScheduleRow({ row, onPress, onLongPress }: TodayScheduleRowProps) {
  const pill = statusPill(row.status);
  const tint =
    row.status === "taken"
      ? "#0058BC"
      : row.status === "overdue" || row.status === "missed"
        ? "#C2410C"
        : "#717786";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onLongPress={onLongPress}
      className="rounded-3xl border border-border bg-surface px-4 py-3 active:bg-surface-low"
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-row items-center gap-3 flex-1 pr-2">
          <View className="w-[64px]">
            <Text variant="bodyMedium" className="text-text">
              {row.timeLabel}
            </Text>
            <Text variant="label" className="mt-0.5">
              Hôm nay
            </Text>
          </View>

          <View className="flex-1">
            <Text variant="bodyMedium" className="text-text">
              {row.title}
            </Text>
            {row.subtitle ? (
              <Text variant="bodySmall" className="text-text-variant">
                {row.subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        <View className={cn("flex-row items-center gap-2 rounded-full px-3 py-1.5", pill.className)}>
          <SymbolView
            name={{
              ios: pill.icon,
              android:
                row.status === "taken" ? "check_circle" : row.status === "overdue" || row.status === "missed" ? "error" : "schedule",
              web: "schedule",
            }}
            tintColor={tint}
            size={16}
          />
          <Text variant="bodySmall" className={cn("font-medium", pill.className)}>
            {pill.label}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

