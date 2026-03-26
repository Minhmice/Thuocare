import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { ScrollView, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";

import { Text } from "@/shared/ui";
import { MedRow } from "@/features/meds/components/MedRow";
import { useMedsList } from "@/features/meds/data/use-meds";
import { Pressable } from "react-native";
import type { MedStatus } from "@/shared/types/meds";
import { extractApiErrorMessage } from "@/shared/lib/api-error-message";
import { cn } from "@/shared/lib/utils";

type StatusFilter = "default" | "all" | MedStatus;

export function MedsListScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("default");
  const listStatus = statusFilter === "default" ? (["active", "paused"] as MedStatus[]) : statusFilter;
  const { data = [], isLoading, error, refetch, isRefetching } = useMedsList({ q: query, status: listStatus });

  const goCreate = useCallback(() => {
    router.push("/modal?screen=med-form");
  }, [router]);

  useLayoutEffect(() => {
    // NativeTabs doesn't expose per-tab header; keep in-screen CTA for now.
  }, []);

  const filtered = useMemo(() => data, [data]);
  const hasError = Boolean(error);
  const errorMessage = extractApiErrorMessage(error) ?? "Không thể tải danh sách thuốc. Vui lòng thử lại.";

  return (
    <View className="flex-1 bg-surface">
      <ScrollView
        className="flex-1"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-3">
          <View className="flex-row items-start justify-between">
            <View>
              <Text variant="h2" className="text-text">
                Thuốc
              </Text>
              <Text variant="bodySmall" className="mt-1 text-text-variant">
                Quản lý thuốc và lịch uống của bạn
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Thêm thuốc"
              onPress={goCreate}
              className="h-10 w-10 items-center justify-center rounded-2xl bg-surface border border-border active:bg-surface-low"
            >
              <SymbolView name={{ ios: "plus", android: "add", web: "add" }} tintColor="#0058BC" size={18} />
            </Pressable>
          </View>
        </View>

        <View className="mt-4 px-5 gap-3">
          <View className="rounded-3xl border border-border bg-surface px-4 py-3">
            <Text variant="label" className="text-text-variant">
              Tìm kiếm
            </Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Nhập tên thuốc..."
              className="mt-1 text-[16px] text-text"
              placeholderTextColor="#717786"
            />
            <View className="mt-3 flex-row gap-2">
              {([
                { id: "default", label: "Đang theo dõi" },
                { id: "all", label: "Tất cả" },
                { id: "active", label: "Đang dùng" },
                { id: "paused", label: "Tạm dừng" },
                { id: "stopped", label: "Đã dừng" },
              ] as const satisfies Array<{ id: StatusFilter; label: string }>).map((f) => (
                <Pressable
                  key={f.id}
                  accessibilityRole="button"
                  onPress={() => setStatusFilter(f.id)}
                  className={cn(
                    "rounded-full px-3 py-2",
                    f.id === statusFilter ? "bg-primary/10" : "bg-surface-low",
                  )}
                >
                  <Text
                    variant="bodySmall"
                    className={cn(f.id === statusFilter ? "font-medium text-primary" : "text-text-variant")}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {isLoading ? (
            <View className="rounded-3xl border border-border bg-surface px-5 py-6">
              <Text variant="bodyMedium" className="text-text">
                Đang tải danh sách thuốc...
              </Text>
            </View>
          ) : hasError ? (
            <View className="rounded-3xl border border-error/30 bg-error/5 px-5 py-6">
              <Text variant="bodyMedium" className="text-error">
                {errorMessage}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  void refetch();
                }}
                className="mt-4 rounded-2xl bg-error px-4 py-3 active:opacity-90"
              >
                <Text variant="bodyMedium" className="text-center text-white">
                  Thử lại
                </Text>
              </Pressable>
            </View>
          ) : filtered.length === 0 ? (
            <View className="rounded-3xl border border-border bg-surface px-5 py-6">
              <Text variant="bodyMedium" className="text-text">
                Không có thuốc phù hợp
              </Text>
              <Text variant="bodySmall" className="mt-1 text-text-variant">
                Thử đổi bộ lọc hoặc thêm thuốc mới.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={goCreate}
                className="mt-4 rounded-2xl bg-primary px-4 py-3 active:opacity-90"
              >
                <Text variant="bodyMedium" className="text-white text-center">
                  Thêm thuốc
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-3">
              {filtered.map((med) => (
                <MedRow key={med.id} med={med} onPress={() => router.push(`/modal?screen=med-form&id=${encodeURIComponent(med.id)}`)} />
              ))}
            </View>
          )}

          {isRefetching && !isLoading && !hasError ? (
            <Text variant="bodySmall" className="text-center text-text-variant">
              Đang cập nhật...
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
