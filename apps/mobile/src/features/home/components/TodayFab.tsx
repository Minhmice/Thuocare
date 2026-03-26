import { Pressable, View } from "react-native";
import { SymbolView } from "expo-symbols";

import { cn } from "@/shared/lib/utils";

export type TodayFabProps = {
  onPress: () => void;
  bottomOffset?: number;
  accessibilityLabel?: string;
};

export function TodayFab({ onPress, bottomOffset = 22, accessibilityLabel = "Thêm" }: TodayFabProps) {
  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 bottom-0"
      style={{ paddingBottom: bottomOffset }}
    >
      <View pointerEvents="box-none" className="items-end px-5">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          onPress={onPress}
          className={cn(
            "h-14 w-14 items-center justify-center rounded-2xl bg-primary",
            "shadow-sm active:opacity-90"
          )}
        >
          <SymbolView name={{ ios: "plus", android: "add", web: "add" }} tintColor="#FFFFFF" size={22} />
        </Pressable>
      </View>
    </View>
  );
}

