import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";

import { localIsoDate } from "@/lib/adherence/history-window";
import { usePersonalMedicationsAll } from "@/lib/personal/use-personal-medications-all";
import { usePersonalTimeline } from "@/lib/personal/use-personal-timeline";
import { PersonalMedicationCard } from "@/features/personal/components/PersonalMedicationCard";
import type { PersonalDoseVM, PersonalMedicationVM } from "@thuocare/personal";

function hhMmFromScheduledIso(iso: string): string {
  const m = /T(\d{2}):(\d{2})/.exec(iso);
  if (m) return `${m[1]}:${m[2]}`;
  return iso.length >= 16 ? iso.slice(11, 16) : iso;
}

/** Earliest ISO scheduled time per medication (today’s timeline, status scheduled only). */
function nextScheduledTodayByMedication(doses: PersonalDoseVM[]): Map<string, string> {
  const nextIso = new Map<string, string>();
  for (const d of doses) {
    if (d.status !== "scheduled") continue;
    const cur = nextIso.get(d.personalMedicationId);
    if (!cur || d.scheduledTime.localeCompare(cur) < 0) {
      nextIso.set(d.personalMedicationId, d.scheduledTime);
    }
  }
  const out = new Map<string, string>();
  for (const [id, iso] of nextIso) {
    out.set(id, hhMmFromScheduledIso(iso));
  }
  return out;
}

function sortActiveByNextDose(
  active: PersonalMedicationVM[],
  timelineDoses: PersonalDoseVM[],
): PersonalMedicationVM[] {
  const nextByMed = new Map<string, string>();
  for (const d of timelineDoses) {
    if (d.status !== "scheduled") continue;
    const cur = nextByMed.get(d.personalMedicationId);
    if (!cur || d.scheduledTime.localeCompare(cur) < 0) {
      nextByMed.set(d.personalMedicationId, d.scheduledTime);
    }
  }
  return [...active].sort((a, b) => {
    const ta = nextByMed.get(a.id);
    const tb = nextByMed.get(b.id);
    if (ta && tb) return ta.localeCompare(tb);
    if (ta) return -1;
    if (tb) return 1;
    return a.displayName.localeCompare(b.displayName, "vi");
  });
}

function filterByDisplayName(items: PersonalMedicationVM[], query: string): PersonalMedicationVM[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((m) => m.displayName.toLowerCase().includes(q));
}

export function PersonalMedicationsTabScreen() {
  const router = useRouter();
  const todayIso = localIsoDate();
  const [searchQuery, setSearchQuery] = useState("");
  const {
    medications,
    isLoading,
    isFetching,
    refetch: refetchMeds,
  } = usePersonalMedicationsAll();
  const {
    data: timeline,
    isFetching: timelineFetching,
    refetch: refetchTimeline,
  } = usePersonalTimeline(todayIso);

  const filteredMedications = useMemo(
    () => filterByDisplayName(medications, searchQuery),
    [medications, searchQuery],
  );

  const nextDoseByMed = useMemo(
    () => nextScheduledTodayByMedication(timeline?.doses ?? []),
    [timeline?.doses],
  );

  const { activeSorted, paused, stopped } = useMemo(() => {
    const active = filteredMedications.filter((m) => m.status === "active");
    const doses = timeline?.doses ?? [];
    return {
      activeSorted: sortActiveByNextDose(active, doses),
      paused: filteredMedications
        .filter((m) => m.status === "paused")
        .sort((a, b) => a.displayName.localeCompare(b.displayName, "vi")),
      stopped: filteredMedications
        .filter((m) => m.status === "stopped")
        .sort((a, b) => a.displayName.localeCompare(b.displayName, "vi")),
    };
  }, [filteredMedications, timeline?.doses]);

  const onRefresh = () => {
    void refetchMeds();
    void refetchTimeline();
  };

  const goDetail = (id: string) => {
    router.push(`/(personal)/medication/${id}` as never);
  };

  const searchActive = searchQuery.trim().length > 0;
  const noSearchResults = searchActive && filteredMedications.length === 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isFetching || timelineFetching} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Thuốc của bạn</Text>
        <Text style={styles.subtitle}>
          Nhấn thẻ để vào trung tâm chi tiết — chỉnh sửa, tạm dừng và lịch sử uống từ đó.
        </Text>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Tìm theo tên thuốc…"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      <Pressable
        onPress={() => router.push("/(personal)/add-medication" as never)}
        style={styles.primaryBtn}
      >
        <Text style={styles.primaryBtnText}>+ Thêm thuốc</Text>
      </Pressable>

      {isLoading ? (
        <ActivityIndicator size="small" color="#4a6670" style={styles.loader} />
      ) : null}

      {noSearchResults ? (
        <Text style={styles.searchEmpty}>Không có thuốc khớp tìm kiếm. Thử từ khóa khác.</Text>
      ) : null}

      <MedicationGroup
        title="Đang dùng"
        count={activeSorted.length}
        items={activeSorted}
        emptyHint="Chưa có thuốc đang dùng. Nhấn «Thêm thuốc» để bắt đầu ghi nhận lịch uống."
        onPressItem={goDetail}
        nextDoseByMed={nextDoseByMed}
      />
      <MedicationGroup
        title="Tạm dừng"
        count={paused.length}
        items={paused}
        emptyHint="Không có thuốc tạm dừng. Dùng «Tạm dừng» trong chỉnh sửa khi cần ẩn nhắc tạm thời (du lịch, hết thuốc…)."
        onPressItem={goDetail}
        nextDoseByMed={nextDoseByMed}
      />
      <MedicationGroup
        title="Đã ngừng"
        count={stopped.length}
        items={stopped}
        emptyHint="Chưa có thuốc đã ngừng. «Ngừng thuốc» kết thúc hẳn lịch — thường chỉ khi không còn dùng nữa."
        onPressItem={goDetail}
        nextDoseByMed={nextDoseByMed}
      />
    </ScrollView>
  );
}

function MedicationGroup({
  title,
  count,
  items,
  emptyHint,
  onPressItem,
  nextDoseByMed,
}: {
  title: string;
  count: number;
  items: PersonalMedicationVM[];
  emptyHint: string;
  onPressItem: (id: string) => void;
  nextDoseByMed: Map<string, string>;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>
        {title}
        <Text style={styles.groupCount}> ({count})</Text>
      </Text>
      {items.length === 0 ? (
        <Text style={styles.emptyHint}>{emptyHint}</Text>
      ) : (
        items.map((m) => (
          <PersonalMedicationCard
            key={m.id}
            medication={m}
            onPress={() => onPressItem(m.id)}
            nextDoseTodayHhMm={m.status === "active" ? nextDoseByMed.get(m.id) ?? null : null}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f5" },
  content: { paddingBottom: 40 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: "700", color: "#1c2a24" },
  subtitle: { fontSize: 13, color: "#5c6f66", marginTop: 6, lineHeight: 19 },
  searchWrap: { paddingHorizontal: 16, marginBottom: 12 },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dce6e1",
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: "#111827",
  },
  searchEmpty: {
    fontSize: 13,
    color: "#7a8a82",
    paddingHorizontal: 20,
    marginBottom: 12,
    lineHeight: 19,
  },
  primaryBtn: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#4a6670",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  loader: { marginVertical: 16 },
  group: { marginTop: 8 },
  groupTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374942",
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 4,
  },
  groupCount: { fontWeight: "600", color: "#7a8a82" },
  emptyHint: {
    fontSize: 13,
    color: "#7a8a82",
    paddingHorizontal: 20,
    marginBottom: 12,
    lineHeight: 20,
  },
});
