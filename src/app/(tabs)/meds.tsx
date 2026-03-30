import { useCallback, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button, Dialog, Portal } from "react-native-paper";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { AppText } from "../../components/ui/AppText";
import { EmptyState } from "../../features/components/composed/empty-state";
import { MainTabBar } from "../../features/components/composed/main-tab-bar";
import { MedicationTile } from "../../features/components/composed/medication-tile";
import { ScreenHeader } from "../../features/components/composed/screen-header";
import { SummaryStatsCard } from "../../features/components/composed/summary-stats-row/card";
import { getMedications } from "../../features/meds/repository";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import {
  isLocalMedicationId,
  removeLocalMedication,
  takePendingHighlightId,
} from "../../lib/meds/localMedsStore";
import { paperTheme } from "../../theme/paperTheme";
import type { Medication } from "../../types/medication";

const LOW_STOCK_THRESHOLD = 5;

function medScheduleLine(item: Medication): string {
  const base = item.schedule.trim();
  const extra: string[] = [];
  if (item.scheduledAt) extra.push(item.scheduledAt);
  if (item.period) extra.push(item.period);
  if (item.doseStatus && item.doseStatus !== "upcoming") {
    extra.push(item.doseStatus);
  }
  if (item.takenAt) extra.push(item.takenAt);
  return extra.length > 0 ? `${base} · ${extra.join(" · ")}` : base;
}

type MedsDialog =
  | null
  | { kind: "demo" }
  | { kind: "delete"; id: string };

export default function MedsScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Medication[]>([]);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const [medDialog, setMedDialog] = useState<MedsDialog>(null);
  const listRef = useRef<FlatList<Medication> | null>(null);
  const hasLoadedRef = useRef(false);

  const load = useCallback(async (): Promise<Medication[]> => {
    try {
      setError(null);
      if (!hasLoadedRef.current) setLoading(true);
      const data = await getMedications();
      const list = data ?? [];
      hasLoadedRef.current = true;
      setItems(list);
      return list;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load medications");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let clearHighlight: ReturnType<typeof setTimeout> | null = null;

      void load().then((list) => {
        const highlightId = takePendingHighlightId();
        if (!highlightId) return;

        setActiveHighlightId(highlightId);

        setTimeout(() => {
          const index = list.findIndex((m) => m.id === highlightId);
          if (index >= 0) {
            listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.1 });
          }
        }, 150);

        clearHighlight = setTimeout(() => setActiveHighlightId(null), 1500);
      });

      return () => {
        if (clearHighlight != null) clearTimeout(clearHighlight);
      };
    }, [load])
  );

  if (loading && !hasLoadedRef.current) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const dashboard = {
    total: items.length,
    activeToday: items.filter((m) => {
      const s = m.schedule.trim();
      return s.length > 0 && s !== "—";
    }).length,
    needRefill: items.filter((m) => {
      const stock = m.remainingDoses;
      return stock != null && stock <= LOW_STOCK_THRESHOLD;
    }).length,
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <FlatList
        ref={(r) => {
          listRef.current = r;
        }}
        data={items}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeader
              title={t("meds_title")}
              subtitle={t("meds_subtitle")}
              style={styles.screenHeader}
            />

            <SummaryStatsCard
              items={[
                { label: t("meds_total"), value: dashboard.total, emphasize: true },
                { label: t("meds_activeToday"), value: dashboard.activeToday },
                {
                  label: t("meds_needRefill"),
                  value: dashboard.needRefill,
                  color: dashboard.needRefill > 0 ? "#A86700" : paperTheme.colors.onSurface,
                },
              ]}
            />

            <Pressable
              onPress={() => router.push("/meds/add" as never)}
              accessibilityRole="button"
              accessibilityLabel={t("meds_addRow")}
              style={({ pressed }) => [
                styles.addMedicationBar,
                pressed && styles.addMedicationBarPressed,
              ]}
            >
              <MaterialCommunityIcons
                name="plus"
                size={20}
                color={paperTheme.colors.primary}
              />
              <AppText style={styles.addMedicationLabel}>
                {t("meds_addRow")}
              </AppText>
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="pill"
            title={t("meds_emptyTitle")}
            description={t("meds_emptyDescription")}
            actionLabel={t("meds_add")}
            onAction={() => router.push("/meds/add" as never)}
          />
        }
        renderItem={({ item }) => (
          <MedicationTile
            name={item.name}
            dosage={item.dosage}
            schedule={medScheduleLine(item)}
            remaining={item.remainingDoses}
            lowStock={
              item.remainingDoses != null &&
              item.remainingDoses > 0 &&
              item.remainingDoses <= LOW_STOCK_THRESHOLD
            }
            outOfStock={item.remainingDoses != null && item.remainingDoses === 0}
            highlighted={activeHighlightId === item.id}
            stockLabel={
              item.remainingDoses == null
                ? null
                : item.remainingDoses === 0
                ? t("meds_outOfStock")
                : t("meds_remaining", { count: item.remainingDoses })
            }
            showMenu
            onEditPress={() =>
              router.push({
                pathname: "/meds/add",
                params: { editId: item.id },
              } as never)
            }
            onDeletePress={() => {
              if (!isLocalMedicationId(item.id)) {
                setMedDialog({ kind: "demo" });
                return;
              }
              setMedDialog({ kind: "delete", id: item.id });
            }}
          />
        )}
        onScrollToIndexFailed={({ index }) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.1 });
          }, 250);
        }}
      />
      <MainTabBar />

      <Portal>
        <Dialog
          visible={medDialog != null}
          onDismiss={() => setMedDialog(null)}
          style={styles.medDialog}
        >
          {medDialog?.kind === "demo" ? (
            <>
              <Dialog.Content style={styles.medDialogContent}>
                <AppText variant="titleMedium" style={styles.medDialogTitle}>
                  {t("meds_deleteDemoTitle")}
                </AppText>
                <AppText variant="bodyMedium" style={styles.medDialogSubtitle}>
                  {t("meds_deleteDemoMessage")}
                </AppText>
              </Dialog.Content>
              <Dialog.Actions style={styles.medDialogActions}>
                <Button mode="text" onPress={() => setMedDialog(null)} textColor={paperTheme.colors.primary}>
                  {t("common_ok")}
                </Button>
              </Dialog.Actions>
            </>
          ) : null}

          {medDialog?.kind === "delete" ? (
            <>
              <Dialog.Content style={styles.medDialogContent}>
                <AppText variant="titleMedium" style={styles.medDialogTitle}>
                  {t("meds_deleteConfirmTitle")}
                </AppText>
                <AppText variant="bodyMedium" style={styles.medDialogSubtitle}>
                  {t("meds_deleteConfirmMessage")}
                </AppText>
              </Dialog.Content>
              <Dialog.Actions style={styles.medDialogActions}>
                <Button mode="text" onPress={() => setMedDialog(null)} textColor={paperTheme.colors.onSurfaceVariant}>
                  {t("common_cancel")}
                </Button>
                <Button
                  mode="text"
                  textColor={paperTheme.colors.error}
                  onPress={() => {
                    removeLocalMedication(medDialog.id);
                    void load();
                    setMedDialog(null);
                  }}
                >
                  {t("meds_deleteConfirmDelete")}
                </Button>
              </Dialog.Actions>
            </>
          ) : null}
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 128,
    gap: 12,
  },
  header: {
    gap: 12,
    paddingBottom: 4,
  },
  screenHeader: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  addMedicationBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    minHeight: 38,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: paperTheme.colors.outline,
    backgroundColor: "#FFFFFF",
  },
  addMedicationBarPressed: {
    opacity: 0.88,
  },
  addMedicationLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: paperTheme.colors.primary,
  },
  medDialog: {
    borderRadius: 16,
    backgroundColor: paperTheme.colors.surface,
    marginHorizontal: 28,
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
  },
  medDialogContent: {
    paddingTop: 20,
    paddingBottom: 4,
  },
  medDialogTitle: {
    color: paperTheme.colors.onSurface,
    fontWeight: "600",
    marginBottom: 8,
  },
  medDialogSubtitle: {
    color: paperTheme.colors.onSurfaceVariant,
    lineHeight: 22,
  },
  medDialogActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 0,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
});
