import { View } from "react-native";

import { Text } from "@/shared/ui";
import { TodayScheduleRow, type TodayScheduleRowModel } from "@/features/home/components/TodayScheduleRow";

export type TodayScheduleSectionProps = {
  title: string;
  subtitle?: string;
  rows: TodayScheduleRowModel[];
  onPressRow: (rowId: string) => void;
  onLongPressRow?: (rowId: string) => void;
};

export function TodayScheduleSection({ title, subtitle, rows, onPressRow, onLongPressRow }: TodayScheduleSectionProps) {
  return (
    <View>
      <View className="mb-2 flex-row items-end justify-between">
        <Text variant="h3" className="text-text">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodySmall" className="text-text-variant">
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View className="gap-3">
        {rows.map((row) => (
          <TodayScheduleRow
            key={row.id}
            row={row}
            onPress={() => onPressRow(row.id)}
            onLongPress={onLongPressRow ? () => onLongPressRow(row.id) : undefined}
          />
        ))}
      </View>
    </View>
  );
}

