import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

import { useMobileAuth } from "@/lib/auth/mobile-auth";
import { localIsoDate } from "@/lib/adherence/history-window";
import { useTodayTimeline } from "@/features/patient-timeline/hooks/useTodayTimeline";
import { useMarkDoseTaken } from "@/features/patient-timeline/hooks/useMarkDoseTaken";
import { useMarkDoseSkipped } from "@/features/patient-timeline/hooks/useMarkDoseSkipped";
import {
  TimelineList,
  type TimelineDoseLike,
} from "@/features/patient-timeline/components/TimelineList";

const todayIso = localIsoDate();

export default function TodayScreen() {
  const { actor, actorStatus, bootstrapStatus } = useMobileAuth();

  // Auth guard — AuthBootGate in _layout.tsx routes away from (tabs) if actor
  // is not ready, so this is a defensive fallback only.
  if (bootstrapStatus !== "ready" || actorStatus !== "ready" || !actor || actor.kind !== "patient") {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color="#2563eb" />
      </View>
    );
  }

  return <TodayScreenContent todayIso={todayIso} />;
}

/** Inner component rendered only after patient actor is confirmed. */
function TodayScreenContent({ todayIso }: { todayIso: string }) {
  const { data, isLoading, isError, refetch, isRefetching } = useTodayTimeline(todayIso);
  const { mutate: takeDose, isPending: isTaking } = useMarkDoseTaken(todayIso);
  const { mutate: skipDose, isPending: isSkipping } = useMarkDoseSkipped(todayIso);

  const isPendingMutations = isTaking || isSkipping;

  const handleTake = (dose: TimelineDoseLike) => {
    takeDose({
      prescriptionItemId: dose.prescriptionItemId,
      scheduledTime: dose.scheduledTime,
    });
  };

  const handleSkip = (dose: TimelineDoseLike) => {
    skipDose({
      prescriptionItemId: dose.prescriptionItemId,
      scheduledTime: dose.scheduledTime,
    });
  };

  if (isLoading) {
    return <ActivityIndicator size="large" color="#2563eb" style={styles.center} />;
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Không thể tải lịch uống thuốc.</Text>
        <Text onPress={() => refetch()} style={styles.retryText}>
          Chạm để thử lại
        </Text>
      </View>
    );
  }

  const doses = data?.doses ?? [];
  const nextDose = doses.find((d) => d.status === "scheduled") ?? null;

  return (
    <View style={styles.container}>
      <TimelineList
        doses={doses}
        nextDose={nextDose}
        isRefetching={isRefetching}
        onRefresh={refetch}
        onTake={handleTake}
        onSkip={handleSkip}
        isPendingMutations={isPendingMutations}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  errorText: { color: "#dc2626", textAlign: "center", fontSize: 16 },
  retryText: { color: "#2563eb", marginTop: 12, fontSize: 16, fontWeight: "bold" },
});
