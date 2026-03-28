import { useCallback, useRef, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { AppText } from "../../components/ui/AppText";
import { getMedications } from "../../features/meds/repository";
import { takePendingHighlightId } from "../../lib/meds/localMedsStore";
import { paperTheme } from "../../theme/paperTheme";
import type { Medication } from "../../types/medication";

const LOW_STOCK_THRESHOLD = 5;

export default function MedsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Medication[]>([]);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const listRef = useRef<FlatList<Medication> | null>(null);
  const hasLoadedRef = useRef(false);

  const load = useCallback(async (): Promise<Medication[]> => {
    try {
      setError(null);
      // Only show full-screen loading on the very first load.
      // On subsequent focus returns the list stays visible while silently reloading.
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

        // Give FlatList time to render the new item before scrolling.
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
      // Only count items where stock is known (not undefined).
      return stock != null && stock <= LOW_STOCK_THRESHOLD;
    }).length,
  };

  return (
    <FlatList
      ref={(r) => {
        listRef.current = r;
      }}
      data={items}
      keyExtractor={(item) => item.id}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <AppText variant="headlineSmall">Meds</AppText>
            <AppButton
              mode="outlined"
              compact
              onPress={() => router.push("/meds/add" as never)}
            >
              + Add
            </AppButton>
          </View>

          <AppCard>
            <View style={styles.dashboardRow}>
              <View style={styles.metric}>
                <AppText variant="titleLarge" style={styles.metricValue}>
                  {dashboard.total}
                </AppText>
                <AppText variant="labelSmall" style={styles.metricLabel}>
                  Total
                </AppText>
              </View>
              <View style={styles.metric}>
                <AppText variant="titleLarge" style={styles.metricValue}>
                  {dashboard.activeToday}
                </AppText>
                <AppText variant="labelSmall" style={styles.metricLabel}>
                  Active today
                </AppText>
              </View>
              <View style={styles.metric}>
                <AppText
                  variant="titleLarge"
                  style={[
                    styles.metricValue,
                    dashboard.needRefill > 0 && { color: "#A86700" },
                  ]}
                >
                  {dashboard.needRefill}
                </AppText>
                <AppText variant="labelSmall" style={styles.metricLabel}>
                  Need refill
                </AppText>
              </View>
            </View>
          </AppCard>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <AppText variant="titleMedium" style={styles.emptyTitle}>
            No medications yet
          </AppText>
          <AppText variant="bodyMedium" style={styles.emptyMessage}>
            Add your first medication to start tracking your routine.
          </AppText>
          <AppButton onPress={() => router.push("/meds/add" as never)}>
            Add medication
          </AppButton>
        </View>
      }
      renderItem={({ item }) => (
        <MedTile item={item} highlighted={activeHighlightId === item.id} />
      )}
      onScrollToIndexFailed={({ index }) => {
        setTimeout(() => {
          listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.1 });
        }, 250);
      }}
    />
  );
}

// ─── Medication tile ──────────────────────────────────────────────────────────

function MedTile({
  item,
  highlighted,
}: {
  item: Medication;
  highlighted: boolean;
}) {
  const isOut = item.remainingDoses != null && item.remainingDoses === 0;
  const isLow =
    item.remainingDoses != null &&
    item.remainingDoses > 0 &&
    item.remainingDoses <= LOW_STOCK_THRESHOLD;

  // Accent bar color communicates stock health at a glance.
  const accentColor = isOut
    ? "#9BA0AD"
    : isLow
    ? "#A86700"
    : paperTheme.colors.primary;

  // Background: highlight tint > out-of-stock muted > normal surface.
  const backgroundColor = highlighted
    ? "rgba(0, 88, 188, 0.08)"
    : isOut
    ? "#E4E4EF"
    : paperTheme.colors.surfaceVariant;

  // Dim the name when a medication is out of stock.
  const nameColor = isOut
    ? paperTheme.colors.onSurfaceVariant
    : paperTheme.colors.onSurface;

  const subColor = paperTheme.colors.onSurfaceVariant;

  const stockLabel =
    item.remainingDoses == null
      ? null
      : item.remainingDoses === 0
      ? "Out of stock"
      : `${item.remainingDoses} remaining`;

  const stockColor = isOut ? "#9F1D1D" : isLow ? "#A86700" : subColor;

  return (
    <View style={[styles.tile, { backgroundColor }]}>
      {/* 4px leading accent bar — clipped by tile's borderRadius */}
      <View style={[styles.tileAccent, { backgroundColor: accentColor }]} />

      <View style={styles.tileBody}>
        <View style={styles.tileNameRow}>
          <AppText
            variant="titleMedium"
            numberOfLines={2}
            style={{ flex: 1, color: nameColor }}
          >
            {item.name}
          </AppText>
          {isOut ? (
            <View style={[styles.badge, styles.badgeOut]}>
              <AppText variant="labelSmall" style={{ color: "#9F1D1D" }}>
                Out
              </AppText>
            </View>
          ) : isLow ? (
            <View style={[styles.badge, styles.badgeLow]}>
              <AppText variant="labelSmall" style={{ color: "#7A4A00" }}>
                Low
              </AppText>
            </View>
          ) : null}
        </View>

        <AppText variant="bodyMedium" style={{ color: subColor, marginTop: 4 }}>
          {item.dosage}
        </AppText>

        <AppText variant="labelMedium" style={{ color: subColor, marginTop: 2 }}>
          {item.schedule}
        </AppText>

        {stockLabel != null && (
          <AppText
            variant="labelMedium"
            style={{ color: stockColor, marginTop: 6 }}
          >
            {stockLabel}
          </AppText>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 128,
    gap: 12,
  },
  header: {
    gap: 12,
    paddingBottom: 4,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dashboardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metric: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
    gap: 2,
  },
  metricValue: {
    fontWeight: "700",
    color: paperTheme.colors.onSurface,
  },
  metricLabel: {
    color: paperTheme.colors.onSurfaceVariant,
    textAlign: "center",
  },
  emptyState: {
    marginTop: 56,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  emptyTitle: {
    color: paperTheme.colors.onSurfaceVariant,
    textAlign: "center",
    marginBottom: 8,
  },
  emptyMessage: {
    color: paperTheme.colors.onSurfaceVariant,
    textAlign: "center",
    marginBottom: 24,
  },
  // Tile
  tile: {
    borderRadius: 20,
    overflow: "hidden",
    flexDirection: "row",
  },
  tileAccent: {
    width: 4,
  },
  tileBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  tileNameRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginTop: 1,
  },
  badgeLow: {
    backgroundColor: "rgba(168, 103, 0, 0.12)",
  },
  badgeOut: {
    backgroundColor: "rgba(159, 29, 29, 0.12)",
  },
});
