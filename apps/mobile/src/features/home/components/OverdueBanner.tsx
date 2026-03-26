import { Pressable, View } from "react-native";
import { SymbolView } from "expo-symbols";

import { Button, Text } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";

export type OverdueBannerProps = {
  visible?: boolean;
  title: string;
  description?: string;
  ctaLabel: string;
  onPressCta: () => void;
  onPressDismiss?: () => void;
};

export function OverdueBanner({
  visible = true,
  title,
  description,
  ctaLabel,
  onPressCta,
  onPressDismiss,
}: OverdueBannerProps) {
  if (!visible) return null;

  return (
    <View className="rounded-3xl border border-error/20 bg-error/10 px-4 py-4">
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-error/15">
          <SymbolView
            name={{ ios: "exclamationmark.triangle.fill", android: "warning", web: "warning" }}
            tintColor="#C2410C"
            size={20}
          />
        </View>

        <View className="flex-1">
          <Text variant="h3" className="text-text">
            {title}
          </Text>
          {description ? (
            <Text variant="bodySmall" className="mt-1 text-text-variant">
              {description}
            </Text>
          ) : null}

          <View className="mt-3 flex-row items-center gap-3">
            <Button
              label={ctaLabel}
              variant="default"
              size="sm"
              onPress={onPressCta}
              className="bg-error rounded-2xl"
            />

            {onPressDismiss ? (
              <Pressable
                accessibilityRole="button"
                onPress={onPressDismiss}
                className={cn(
                  "h-10 w-10 items-center justify-center rounded-2xl bg-transparent",
                  "active:bg-error/10"
                )}
              >
                <SymbolView
                  name={{ ios: "xmark", android: "close", web: "close" }}
                  tintColor="#C2410C"
                  size={18}
                />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

