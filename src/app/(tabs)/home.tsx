import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { AppText } from "../../components/ui/AppText";
import { AlertBanner } from "../../features/components/composed/alert-banner";
import { ScreenHeader } from "../../features/components/composed/screen-header";
import { SummaryStatsCard } from "../../features/components/composed/summary-stats-row/card";
import { ReminderExperience } from "../../features/components/composed/reminder-experience";
import { getHomeData } from "../../features/home/repository";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import { useUIState } from "../../lib/ui-context";
import { MainTabBar } from "../../features/components/composed/main-tab-bar";
import type {
  DosePeriod,
  HomeData,
  ScheduledDose,
} from "../../types/home";

const PRIMARY = "#0058BC";
const ERROR = "#C41E1E";
const ON_SURFACE = "#1A1C1F";
const ON_SURFACE_VARIANT = "#5F6673";
const SURFACE_LOW = "#F3F3F8";

function getGreeting(t: (key: any) => string): string {
  const h = new Date().getHours();
  if (h < 12) return t("home_greetingMorning");
  if (h < 17) return t("home_greetingAfternoon");
  return t("home_greetingEvening");
}

function formatToday(locale: string): string {
  return new Date().toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

const PERIOD_ORDER: DosePeriod[] = ["morning", "afternoon", "evening", "night"];

function groupSchedule(doses: ScheduledDose[]) {
  const groups = new Map<DosePeriod, ScheduledDose[]>();
  for (const dose of doses) {
    const existing = groups.get(dose.period);
    if (existing) {
      existing.push(dose);
    } else {
      groups.set(dose.period, [dose]);
    }
  }
  return PERIOD_ORDER.filter((p) => groups.has(p)).map((p) => ({
    period: p,
    doses: groups.get(p) as ScheduledDose[],
  }));
}

function GreetingHeader({
  userName,
  greeting,
  dateLabel,
}: {
  readonly userName: string;
  readonly greeting: string;
  readonly dateLabel: string;
}) {
  return (
    <ScreenHeader
      title={`${greeting}, ${userName}`}
      subtitle={dateLabel}
      style={styles.screenHeader}
    />
  );
}

function StatsDashboard({
  taken,
  remaining,
  missed,
  t,
}: {
  readonly taken: number;
  readonly remaining: number;
  readonly missed: number;
  readonly t: (key: any) => string;
}) {
  return (
    <SummaryStatsCard
      items={[
        { label: t("home_taken"), value: taken, color: PRIMARY, emphasize: true },
        { label: t("home_remaining"), value: remaining },
        {
          label: t("home_missed"),
          value: missed,
          color: missed > 0 ? ERROR : ON_SURFACE_VARIANT,
        },
      ]}
    />
  );
}

function AllSetCard({ t }: { readonly t: (key: any) => string }) {
  return (
    <View style={styles.allSetCard}>
      <View style={styles.allSetIconWrap}>
        <MaterialCommunityIcons
          name="check-circle-outline"
          size={36}
          color={PRIMARY}
        />
      </View>
      <AppText variant="titleLarge" style={styles.allSetTitle}>
        {t("home_allSetTitle")}
      </AppText>
      <AppText variant="bodyMedium" style={styles.allSetSubtitle}>
        {t("home_allSetSubtitle")}
      </AppText>
    </View>
  );
}

function TodayScheduleSection({
  schedule,
  t,
}: {
  readonly schedule: ScheduledDose[];
  readonly t: (key: any, params?: Record<string, string | number>) => string;
}) {
  const groups = groupSchedule(schedule);
  const periodLabel: Record<DosePeriod, string> = {
    morning: t("home_period_morning"),
    afternoon: t("home_period_afternoon"),
    evening: t("home_period_evening"),
    night: t("home_period_night"),
  };
  if (groups.length === 0) return null;

  return (
    <View style={{ gap: 20 }}>
      <AppText variant="titleLarge" style={styles.scheduleTitle}>
        {t("home_scheduleTitle")}
      </AppText>

      {groups.map(({ period, doses }) => (
        <View key={period} style={{ gap: 16 }}>
          <View style={styles.periodHeader}>
            <AppText variant="labelSmall" style={styles.periodLabel}>
              {periodLabel[period]}
            </AppText>
            <View style={styles.periodDivider} />
          </View>

          {doses.map((dose) => (
            <DoseRow key={dose.id} dose={dose} t={t} />
          ))}
        </View>
      ))}
    </View>
  );
}

function DoseRow({
  dose,
  t,
}: {
  readonly dose: ScheduledDose;
  readonly t: (key: any, params?: Record<string, string | number>) => string;
}) {
  const taken = dose.status === "taken";
  const missed = dose.status === "missed";

  const timeColor = missed ? ERROR : taken ? ON_SURFACE_VARIANT : PRIMARY;
  const nameColor = taken ? ON_SURFACE_VARIANT : ON_SURFACE;
  const detailText =
    taken && dose.takenAt
      ? t("home_takenAt", { dosage: dose.dosage, time: dose.takenAt })
      : missed
        ? t("home_missedDetail", { dosage: dose.dosage })
        : dose.instruction;
  const detailColor = missed ? ERROR : ON_SURFACE_VARIANT;

  return (
    <View style={styles.doseRow}>
      <View style={styles.doseRowLeft}>
        <AppText
          variant="bodySmall"
          style={[styles.doseTime, { color: timeColor }]}
        >
          {dose.scheduledAt}
        </AppText>

        <View style={styles.doseTextWrap}>
          <AppText
            variant="bodyLarge"
            style={[
              styles.doseName,
              {
                color: nameColor,
                textDecorationLine: taken ? "line-through" : "none",
                opacity: taken ? 0.5 : 1,
              },
            ]}
          >
            {dose.medicationName}
          </AppText>
          <AppText
            variant="bodySmall"
            style={{ color: detailColor, opacity: taken ? 0.5 : 0.7, marginTop: 1 }}
          >
            {detailText}
          </AppText>
        </View>
      </View>

      {taken && (
        <MaterialCommunityIcons name="check-circle" size={22} color={PRIMARY} />
      )}
      {missed && (
        <MaterialCommunityIcons
          name="close-circle"
          size={22}
          color="rgba(196, 30, 30, 0.3)"
        />
      )}
      {!taken && !missed && <View style={styles.dosePending} />}
    </View>
  );
}

function PhotoConfirmationStub({ t }: { readonly t: (key: any) => string }) {
  return (
    <View style={styles.photoStub}>
      <MaterialCommunityIcons
        name="camera-outline"
        size={28}
        color={ON_SURFACE_VARIANT}
      />
      <AppText variant="bodyMedium" style={styles.photoStubTitle}>
        {t("home_verifyPhoto")}
      </AppText>
      <View style={styles.photoStubBadge}>
        <AppText variant="labelSmall" style={styles.photoStubBadgeText}>
          {t("common_comingSoon")}
        </AppText>
      </View>
    </View>
  );
}
export default function HomeScreen() {
  const { locale, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [data, setData] = useState<HomeData | null>(null);
  const [allSet, setAllSet] = useState(false);
  const hasLoadedRef = useRef(false);
  const { height: viewportHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { homeScrollY, setHomeReminderActive } = useUIState();

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      if (!hasLoadedRef.current) {
        setLoading(true);
      }
      const result = await getHomeData();
      hasLoadedRef.current = true;
      setData(result);
      setAllSet(result.allSetToday);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );


  const showReminder = !allSet && data?.nextDose != null;

  useEffect(() => {
    setHomeReminderActive(showReminder);
  }, [showReminder, setHomeReminderActive]);

  if (loading && !hasLoadedRef.current) return <LoadingState />;
  if (loadError) return <ErrorState message={loadError} onRetry={load} />;
  if (!data) return <LoadingState />;

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <View style={{ flex: 1, zIndex: 2 }} pointerEvents="box-none">
        {showReminder && data.nextDose != null ? (
          <ReminderExperience
            nextDose={data.nextDose}
            viewportHeight={viewportHeight}
            topInset={insets.top}
            scrollY={homeScrollY}
            onConfirm={() => setAllSet(true)}
          >
            <TodayScheduleSection schedule={data.schedule} t={t} />
            <PhotoConfirmationStub t={t} />
          </ReminderExperience>
        ) : (
          <Animated.ScrollView
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: 120 }
            ]}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: homeScrollY } } }],
              { useNativeDriver: true }
            )}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topSection}>
              <GreetingHeader
                userName={data.userName}
                greeting={getGreeting(t)}
                dateLabel={formatToday(locale)}
              />

              <StatsDashboard
                taken={data.stats.taken}
                remaining={data.stats.remaining}
                missed={data.stats.missed}
                t={t}
              />

              {data.missedDoseAlert != null && (
                <AlertBanner
                  variant="warning"
                  icon="alert-circle"
                  title={t("home_missedBannerTitle", { name: data.missedDoseAlert.medicationName })}
                  description={t("home_missedBannerDescription")}
                  actionLabel={t("home_takeNow")}
                  onAction={() => undefined}
                />
              )}

              {data.stockWarning != null && (
                <AlertBanner
                  variant="info"
                  icon="package-variant"
                  title={t("home_stockTitle", { name: data.stockWarning.medicationName })}
                  description={t("home_stockDescription", { days: data.stockWarning.daysLeft })}
                />
              )}
            </View>

            <AllSetCard t={t} />
            <TodayScheduleSection schedule={data.schedule} t={t} />
            <PhotoConfirmationStub t={t} />
          </Animated.ScrollView>
        )}
      </View>

      {/* 
        LAYER 3 (Top-most): The Navigation Bar 
        We animate its translateY so it slides UP only when scrolling down.
        If showReminder is FALSE, we keep it visible (translateY: 0).
      */}
      <Animated.View 
        style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          zIndex: 100,
          transform: [{
            translateY: showReminder 
              ? homeScrollY.interpolate({
                  inputRange: [0, 80, 240],
                  outputRange: [120, 120, 0],
                  extrapolate: 'clamp'
                })
              : 0
          }]
        }}
      >
        <MainTabBar />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 48,
    gap: 16,
  },
  screenHeader: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  topSection: {
    gap: 16,
  },
  statsCard: {
    backgroundColor: SURFACE_LOW,
    borderRadius: 24,
    overflow: "hidden",
  },
  allSetCard: {
    backgroundColor: SURFACE_LOW,
    borderRadius: 28,
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  allSetIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0, 88, 188, 0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  allSetTitle: {
    fontWeight: "700",
    color: ON_SURFACE,
    textAlign: "center",
  },
  allSetSubtitle: {
    color: ON_SURFACE_VARIANT,
    textAlign: "center",
  },
  scheduleTitle: {
    fontWeight: "800",
    color: ON_SURFACE,
    letterSpacing: -0.3,
  },
  periodHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  periodLabel: {
    color: ON_SURFACE_VARIANT,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    opacity: 0.5,
  },
  periodDivider: {
    flex: 1,
    height: 0.5,
    backgroundColor: "rgba(0, 88, 188, 0.12)",
  },
  doseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  doseRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    flex: 1,
  },
  doseTime: {
    fontWeight: "700",
    width: 40,
  },
  doseTextWrap: {
    flex: 1,
  },
  doseName: {
    fontWeight: "700",
  },
  dosePending: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(0, 88, 188, 0.25)",
  },
  photoStub: {
    borderRadius: 20,
    backgroundColor: SURFACE_LOW,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 8,
    opacity: 0.55,
  },
  photoStubTitle: {
    fontWeight: "600",
    color: ON_SURFACE_VARIANT,
  },
  photoStubBadge: {
    backgroundColor: "rgba(0, 88, 188, 0.10)",
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  photoStubBadgeText: {
    color: PRIMARY,
    letterSpacing: 0.5,
  },
});
