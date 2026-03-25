import React from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { localIsoDate } from "@/lib/adherence/history-window";
import { useTodayTimeline } from "@/features/patient-timeline/hooks/useTodayTimeline";
import { useMyActivePrescriptions } from "@/lib/prescription/use-my-active-prescriptions";
import { useNearDepletion } from "@/lib/refill/use-near-depletion";
import { usePatientRefillRequests } from "@/lib/refill/use-patient-refill-requests";

type HospitalHomeScreenProps = {
  lane: "hospital" | "unknown";
};

const TODAY = localIsoDate();

export function HospitalHomeScreen({ lane }: HospitalHomeScreenProps) {
  const timeline = useTodayTimeline(TODAY);
  const prescriptions = useMyActivePrescriptions();
  const nearDepletion = useNearDepletion();
  const refillRequests = usePatientRefillRequests();

  const isRefreshing =
    timeline.isRefetching ||
    prescriptions.isFetching ||
    nearDepletion.isFetching ||
    refillRequests.isFetching;

  const isLoading =
    timeline.isLoading ||
    prescriptions.isLoading ||
    nearDepletion.isLoading ||
    refillRequests.isLoading;

  const doses = timeline.data?.doses ?? [];
  const scheduledCount = doses.filter((dose) => dose.status === "scheduled").length;
  const takenCount = doses.filter((dose) => dose.status === "taken").length;
  const nextDose = doses.find((dose) => dose.status === "scheduled") ?? null;
  const pendingRefills = refillRequests.requests.filter((request) =>
    ["submitted", "triaging", "awaiting_doctor_review"].includes(request.status),
  ).length;

  const onRefresh = () => {
    void timeline.refetch();
    void prescriptions.refetch();
    void nearDepletion.refetch();
    void refillRequests.refetch();
  };

  if (isLoading && doses.length === 0 && prescriptions.prescriptions.length === 0) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="small" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>
          {lane === "unknown" ? "Hospital lane fallback" : "Hospital lane"}
        </Text>
        <Text style={styles.title}>Theo doi dieu tri hang ngay</Text>
        <Text style={styles.body}>
          Home tab gio phan anh dung workflow hospital/patient: lich uong hom nay, don dang
          hieu luc, refill va nguy co het thuoc.
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard label="Lieu hom nay" value={String(doses.length)} />
        <StatCard label="Chua uong" value={String(scheduledCount)} accent="#d97706" />
        <StatCard label="Da uong" value={String(takenCount)} accent="#16a34a" />
        <StatCard
          label="Don dang hieu luc"
          value={String(prescriptions.prescriptions.length)}
          accent="#2563eb"
        />
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          label="Can refill som"
          value={String(nearDepletion.items.length)}
          accent="#dc2626"
        />
        <StatCard
          label="Yeu cau refill mo"
          value={String(pendingRefills)}
          accent="#7c3aed"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Lieu tiep theo</Text>
        {nextDose ? (
          <>
            <Text style={styles.primaryLine}>{nextDose.medicationName ?? "Medication"}</Text>
            <Text style={styles.secondaryLine}>{nextDose.scheduledTime}</Text>
            {nextDose.patientInstruction ? (
              <Text style={styles.tertiaryLine}>{nextDose.patientInstruction}</Text>
            ) : null}
          </>
        ) : (
          <Text style={styles.secondaryLine}>Khong con lieu nao cho xu ly hom nay.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Care continuity</Text>
        <Text style={styles.secondaryLine}>
          Prescription, adherence, refill va follow-up da duoc noi thanh mot workflow thong
          nhat thay vi de Home tab lam QA shell.
        </Text>
      </View>
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  accent = "#111827",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  loaderWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: {
    backgroundColor: "#eff6ff",
    borderRadius: 18,
    padding: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  eyebrow: {
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  title: {
    color: "#111827",
    fontSize: 24,
    fontWeight: "700",
  },
  body: {
    color: "#4b5563",
    fontSize: 14,
    lineHeight: 21,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  statLabel: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  cardTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
  primaryLine: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "600",
  },
  secondaryLine: {
    color: "#4b5563",
    fontSize: 14,
    lineHeight: 20,
  },
  tertiaryLine: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 18,
  },
});
