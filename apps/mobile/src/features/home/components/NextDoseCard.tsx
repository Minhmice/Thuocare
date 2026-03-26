import { Pressable, View } from "react-native";
import { SymbolView } from "expo-symbols";

import { Text } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";

export type NextDoseMedModel = {
  id: string;
  title: string;
  subtitle?: string;
};

export type NextDoseCardProps = {
  countdownLabel: string;
  title: string;
  timeHint?: string;
  meds: NextDoseMedModel[];
  onPressCard: () => void;
  onPressEditMed: (medId: string) => void;
};

function MedRow({
  med,
  onPressEdit,
}: {
  med: NextDoseMedModel;
  onPressEdit: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <View className="flex-row items-center gap-3 flex-1 pr-2">
        <View className="h-9 w-9 items-center justify-center rounded-2xl bg-primary/10">
          <SymbolView name={{ ios: "pills.fill", android: "medication", web: "medication" }} tintColor="#0058BC" size={18} />
        </View>
        <View className="flex-1">
          <Text variant="bodyMedium" className="text-text">
            {med.title}
          </Text>
          {med.subtitle ? (
            <Text variant="bodySmall" className="text-text-variant">
              {med.subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onPressEdit}
        className={cn(
          "h-10 w-10 items-center justify-center rounded-2xl",
          "bg-surface-low active:bg-primary/10"
        )}
      >
        <SymbolView name={{ ios: "pencil", android: "edit", web: "edit" }} tintColor="#0058BC" size={18} />
      </Pressable>
    </View>
  );
}

export function NextDoseCard({
  countdownLabel,
  title,
  timeHint,
  meds,
  onPressCard,
  onPressEditMed,
}: NextDoseCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPressCard}
      className={cn(
        "rounded-[28px] border border-border bg-surface px-4 py-4",
        "active:bg-surface-low"
      )}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text
            variant="display"
            className="text-text leading-[44px]"
          >
            {countdownLabel}
          </Text>
          <Text variant="h3" className="mt-2 text-text">
            {title}
          </Text>
          {timeHint ? (
            <Text variant="bodySmall" className="mt-0.5 text-text-variant">
              {timeHint}
            </Text>
          ) : null}
        </View>

        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
          <SymbolView name={{ ios: "timer", android: "timer", web: "timer" }} tintColor="#0058BC" size={20} />
        </View>
      </View>

      <View className="mt-3 border-t border-border pt-2">
        {meds.map((m) => (
          <MedRow key={m.id} med={m} onPressEdit={() => onPressEditMed(m.id)} />
        ))}
      </View>
    </Pressable>
  );
}

