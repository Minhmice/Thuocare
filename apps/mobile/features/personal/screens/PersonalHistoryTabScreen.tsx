import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";

import { PersonalHistoryDayGroup } from "@/features/personal/components/PersonalHistoryDayGroup";
import { usePersonalHistoryRange } from "@/lib/personal/use-personal-history-range";
import type { PersonalDailyTimelineVM, PersonalDoseStatus, PersonalDoseVM } from "@thuocare/personal";

type StatusFilter = "all" | PersonalDoseStatus;

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "taken", label: "Đã uống" },
  { key: "missed", label: "Quên" },
  { key: "skipped", label: "Bỏ qua" },
  { key: "scheduled", label: "Chưa ghi" },
];

function filterDoses(
  doses: PersonalDoseVM[],
  medId: string | null,
  status: StatusFilter,
): PersonalDoseVM[] {
  let out = doses;
  if (medId) out = out.filter((d) => d.personalMedicationId === medId);
  if (status !== "all") out = out.filter((d) => d.status === status);
  return out;
}

export function PersonalHistoryTabScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isFetching } = usePersonalHistoryRange(14);
  const [medFilter, setMedFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const medOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const day of data ?? []) {
      for (const d of day.doses ?? []) {
        if (!map.has(d.personalMedicationId)) map.set(d.personalMedicationId, d.medicationName);
      }
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "vi"));
  }, [data]);

  const filteredDays = useMemo(() => {
    if (!data) return [];
    const out: PersonalDailyTimelineVM[] = [];
    for (const day of data) {
      const doses = filterDoses(day.doses ?? [], medFilter, statusFilter);
      if (doses.length === 0) continue;
      const resolved = doses.filter((d) => d.status !== "scheduled");
      const taken = resolved.filter((d) => d.status === "taken").length;
      const adherenceRate = resolved.length > 0 ? taken / resolved.length : null;
      out.push({ ...day, doses, adherenceRate });
    }
    return out;
  }, [data, medFilter, statusFilter]);

  const stats = useMemo(() => {
    let taken = 0;
    let missed = 0;
    let skipped = 0;
    let scheduled = 0;
    for (const day of filteredDays) {
      for (const d of day.doses) {
        if (d.status === "taken") taken++;
        else if (d.status === "missed") missed++;
        else if (d.status === "skipped") skipped++;
        else if (d.status === "scheduled") scheduled++;
      }
    }
    const resolved = taken + missed + skipped;
    const adherencePct = resolved > 0 ? Math.round((taken / resolved) * 100) : null;
    return { taken, missed, skipped, scheduled, adherencePct, resolved };
  }, [filteredDays]);

  const onMedPress = (id: string) => {
    router.push(`/(personal)/medication/${id}` as never);
  };

  if (isLoading && !data) {
    return (
      <View style={styles.centerMode}>
        <ActivityIndicator size="large" color="#4a6670" />
        <Text style={styles.loadingText}>Đang tải lịch sử…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerMode}>
        <Text style={styles.errorText}>Không tải được lịch sử cá nhân.</Text>
        <Text onPress={() => refetch()} style={styles.retryButton}>
          Thử lại
        </Text>
      </View>
    );
  }

  const rawDaysWithData = data?.filter((day) => day.doses && day.doses.length > 0) ?? [];

  if (rawDaysWithData.length === 0) {
    return (
      <View style={styles.centerMode}>
        <Text style={styles.emptyTitle}>Chưa có lịch sử</Text>
        <Text style={styles.emptyDesc}>
          Khi bạn đánh dấu đã uống hoặc bỏ qua liều, lịch sử hiển thị tại đây.
        </Text>
        <Text onPress={() => refetch()} style={styles.retryButton}>
          Làm mới
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredDays}
        keyExtractor={(item) => item.date}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <Text style={styles.personalHeaderTitle}>Lịch sử liều</Text>
            <Text style={styles.personalHeaderSub}>14 ngày gần nhất · lọc theo thuốc và trạng thái</Text>

            <View style={styles.statsRow}>
              <StatPill label="Đã uống" value={String(stats.taken)} />
              <StatPill label="Quên" value={String(stats.missed)} />
              <StatPill label="Bỏ qua" value={String(stats.skipped)} />
            </View>
            {stats.resolved > 0 && stats.adherencePct !== null ? (
              <Text style={styles.adherenceText}>
                Tỷ lệ ghi nhận (đã uống / đã xử lý): {stats.adherencePct}%
              </Text>
            ) : (
              <Text style={styles.adherenceMuted}>
                Chưa đủ sự kiện đã xử lý để tính phần trăm ý nghĩa.
              </Text>
            )}

            <Text style={styles.filterLabel}>Thuốc</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              <FilterChip
                label="Tất cả thuốc"
                selected={medFilter === null}
                onPress={() => setMedFilter(null)}
              />
              {medOptions.map(([id, name]) => (
                <FilterChip
                  key={id}
                  label={name}
                  selected={medFilter === id}
                  onPress={() => setMedFilter(id)}
                />
              ))}
            </ScrollView>

            <Text style={styles.filterLabel}>Trạng thái</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {STATUS_FILTERS.map((f) => (
                <FilterChip
                  key={f.key}
                  label={f.label}
                  selected={statusFilter === f.key}
                  onPress={() => setStatusFilter(f.key)}
                />
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyFilter}>
            <Text style={styles.emptyFilterText}>Không có sự kiện khớp bộ lọc.</Text>
            <Pressable
              onPress={() => {
                setMedFilter(null);
                setStatusFilter("all");
              }}
            >
              <Text style={styles.resetLink}>Xóa lọc</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <PersonalHistoryDayGroup dayInfo={item} onPressMedication={onMedPress} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={() => refetch()} />}
      />
    </View>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.filterChip, selected && styles.filterChipSelected]}
    >
      <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f5" },
  listContent: { paddingBottom: 40 },
  headerBlock: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  personalHeaderTitle: { fontSize: 18, fontWeight: "700", color: "#1c2a24" },
  personalHeaderSub: { fontSize: 13, color: "#5c6f66", marginTop: 4, lineHeight: 18 },
  statsRow: { flexDirection: "row", gap: 10, marginTop: 14, flexWrap: "wrap" },
  statPill: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#e2e8e4",
    minWidth: 88,
  },
  statValue: { fontSize: 18, fontWeight: "700", color: "#1c2a24" },
  statLabel: { fontSize: 11, color: "#5c6f66", marginTop: 2 },
  adherenceText: { fontSize: 13, color: "#374942", marginTop: 12, fontWeight: "600" },
  adherenceMuted: { fontSize: 12, color: "#7a8a82", marginTop: 12, lineHeight: 18 },
  filterLabel: { fontSize: 12, fontWeight: "700", color: "#5c6f66", marginTop: 16, marginBottom: 8 },
  chipScroll: { flexGrow: 0 },
  filterChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d8e0dc",
    marginRight: 8,
    marginBottom: 4,
  },
  filterChipSelected: { backgroundColor: "#3d5248", borderColor: "#3d5248" },
  filterChipText: { fontSize: 13, color: "#374942", fontWeight: "600" },
  filterChipTextSelected: { color: "#fff" },
  emptyFilter: { padding: 32, alignItems: "center" },
  emptyFilterText: { fontSize: 14, color: "#5c6f66", textAlign: "center" },
  resetLink: { marginTop: 10, fontSize: 14, fontWeight: "700", color: "#4a6670" },
  centerMode: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f4f6f5",
    padding: 24,
  },
  loadingText: { marginTop: 12, color: "#5c6f66", fontSize: 14 },
  errorText: { color: "#b45309", fontSize: 16, textAlign: "center", marginBottom: 12 },
  retryButton: { color: "#4a6670", fontSize: 16, fontWeight: "700", padding: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#374942", marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: "#5c6f66", textAlign: "center", marginBottom: 16, lineHeight: 21 },
});
