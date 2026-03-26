import { Pressable, View } from "react-native";
import { SymbolView } from "expo-symbols";

import type { Med } from "@/shared/types/meds";
import { Text } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";

export function MedRow({ med, onPress }: { med: Med; onPress: () => void }) {
  const statusLabel = med.status === "active" ? "Đang dùng" : med.status === "paused" ? "Tạm dừng" : "Đã dừng";
  const statusClass =
    med.status === "active"
      ? "bg-primary/10 text-primary"
      : med.status === "paused"
        ? "bg-surface-low text-text-variant"
        : "bg-error/10 text-error";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="rounded-3xl border border-border bg-surface px-4 py-3 active:bg-surface-low"
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text variant="bodyMedium" className="text-text">
            {med.strengthText ? `${med.displayName} ${med.strengthText}` : med.displayName}
          </Text>
          <Text variant="bodySmall" className="text-text-variant">
            {med.scheduleTimes.length > 0 ? med.scheduleTimes.join(" • ") : "Chưa có lịch uống"}
          </Text>
        </View>

        <View className={cn("flex-row items-center gap-2 rounded-full px-3 py-1.5", statusClass)}>
          <SymbolView
            name={{
              ios: med.status === "active" ? "pills.fill" : med.status === "paused" ? "pause.circle.fill" : "xmark.circle.fill",
              android: med.status === "active" ? "medication" : med.status === "paused" ? "pause_circle" : "cancel",
              web: "medication",
            }}
            tintColor={med.status === "active" ? "#0058BC" : med.status === "stopped" ? "#C2410C" : "#717786"}
            size={16}
          />
          <Text variant="bodySmall" className={cn("font-medium", statusClass)}>
            {statusLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

