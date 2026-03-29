import { useCallback, useRef, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { AppButton } from "../../components/ui/AppButton";
import { EmptyState } from "../../features/components/composed/empty-state";
import { MedicationTile } from "../../features/components/composed/medication-tile";
import { ScreenHeader } from "../../features/components/composed/screen-header";
import { SummaryStatsCard } from "../../features/components/composed/summary-stats-row/card";
import { getMedications } from "../../features/meds/repository";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import { takePendingHighlightId } from "../../lib/meds/localMedsStore";
import { paperTheme } from "../../theme/paperTheme";
import type { Medication } from "../../types/medication";

const LOW_STOCK_THRESHOLD = 5;

import { MainTabBar } from "../../features/components/composed/main-tab-bar";

export default function MedsScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Medication[]>([]);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
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
              rightSlot={
                <AppButton
                  mode="outlined"
                  compact
                  onPress={() => router.push("/meds/add" as never)}
                >
                  {t("meds_add")}
                </AppButton>
              }
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
            schedule={item.schedule}
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
          />
        )}
        onScrollToIndexFailed={({ index }) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.1 });
          }, 250);
        }}
      />
      <MainTabBar />
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
});
