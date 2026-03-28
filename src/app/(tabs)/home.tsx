import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, PanResponder, View } from "react-native";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { AppScreen } from "../../components/ui/AppScreen";
import { AppText } from "../../components/ui/AppText";
import { getHomeData } from "../../features/home/repository";
import type {
  DosePeriod,
  HomeData,
  HomeStats,
  NextDoseGroup,
  ScheduledDose,
} from "../../types/home";

// ── palette ──────────────────────────────────────────────────────────────────

const PRIMARY = "#0058BC";
const ERROR = "#C41E1E";
const ON_SURFACE = "#1A1C1F";
const ON_SURFACE_VARIANT = "#5F6673";
const SURFACE_LOW = "#F3F3F8";

// ── helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatToday(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

const PERIOD_ORDER: DosePeriod[] = ["morning", "afternoon", "evening", "night"];

const PERIOD_LABEL: Record<DosePeriod, string> = {
  morning: "MORNING",
  afternoon: "AFTERNOON",
  evening: "EVENING",
  night: "NIGHT",
};

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

// ── Greeting ─────────────────────────────────────────────────────────────────

function GreetingHeader({ userName }: { readonly userName: string }) {
  return (
    <View>
      <AppText
        variant="headlineMedium"
        style={{ fontWeight: "700", color: ON_SURFACE, letterSpacing: -0.5 }}
      >
        {getGreeting()}, {userName}
      </AppText>
      <AppText variant="bodyMedium" style={{ color: ON_SURFACE_VARIANT, marginTop: 2 }}>
        {formatToday()}
      </AppText>
    </View>
  );
}

// ── Missed dose alert ─────────────────────────────────────────────────────────

function MissedDoseAlert({ medicationName }: { readonly medicationName: string }) {
  return (
    <View
      style={{
        backgroundColor: "rgba(196, 30, 30, 0.06)",
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
        <MaterialCommunityIcons name="alert-circle" size={20} color={ERROR} />
        <AppText variant="bodySmall" style={{ color: ON_SURFACE_VARIANT, flex: 1 }}>
          {"You missed "}
          <AppText variant="bodySmall" style={{ fontWeight: "700", color: ERROR }}>
            {medicationName}
          </AppText>
          {" this morning"}
        </AppText>
      </View>
      <AppText
        variant="labelSmall"
        style={{
          color: ERROR,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: 0.8,
          marginLeft: 12,
        }}
      >
        Take now
      </AppText>
    </View>
  );
}

// ── Stock warning ─────────────────────────────────────────────────────────────

function StockWarningBanner({
  medicationName,
  daysLeft,
}: {
  readonly medicationName: string;
  readonly daysLeft: number;
}) {
  return (
    <View
      style={{
        backgroundColor: "rgba(0, 88, 188, 0.06)",
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <MaterialCommunityIcons name="package-variant" size={18} color={PRIMARY} />
      <AppText variant="bodySmall" style={{ color: ON_SURFACE_VARIANT, flex: 1 }}>
        <AppText variant="bodySmall" style={{ fontWeight: "600", color: ON_SURFACE }}>
          {medicationName}
        </AppText>
        {` is running low — ${daysLeft} days left`}
      </AppText>
    </View>
  );
}

// ── Stats dashboard ───────────────────────────────────────────────────────────

function StatsDashboard({ stats }: { readonly stats: HomeStats }) {
  return (
    <View style={{ flexDirection: "row", paddingVertical: 8 }}>
      <StatColumn label="Taken" value={stats.taken} valueColor={PRIMARY} />
      <View
        style={{
          width: 1,
          backgroundColor: "rgba(0, 88, 188, 0.10)",
          marginVertical: 4,
        }}
      />
      <StatColumn label="Remaining" value={stats.remaining} valueColor={ON_SURFACE} />
      <View
        style={{
          width: 1,
          backgroundColor: "rgba(0, 88, 188, 0.10)",
          marginVertical: 4,
        }}
      />
      <StatColumn
        label="Missed"
        value={stats.missed}
        valueColor={stats.missed > 0 ? ERROR : ON_SURFACE_VARIANT}
      />
    </View>
  );
}

function StatColumn({
  label,
  value,
  valueColor,
}: {
  readonly label: string;
  readonly value: number;
  readonly valueColor: string;
}) {
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 2 }}>
      <AppText
        variant="labelSmall"
        style={{
          color: ON_SURFACE_VARIANT,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          opacity: 0.6,
        }}
      >
        {label}
      </AppText>
      <AppText
        variant="headlineMedium"
        style={{ fontWeight: "800", color: valueColor, letterSpacing: -0.5 }}
      >
        {String(value)}
      </AppText>
    </View>
  );
}

// ── Slide to confirm ──────────────────────────────────────────────────────────

const THUMB_SIZE = 56;
const TRACK_PADDING = 6;

function SlideToConfirm({ onConfirm }: { readonly onConfirm: () => void }) {
  const trackWidthRef = useRef(0);
  const thumbAnim = useRef(new Animated.Value(0)).current;

  const getMaxX = useCallback(
    () => Math.max(0, trackWidthRef.current - THUMB_SIZE - TRACK_PADDING * 2),
    []
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        thumbAnim.stopAnimation();
      },
      onPanResponderMove: (_, gs) => {
        const maxX = Math.max(0, trackWidthRef.current - THUMB_SIZE - TRACK_PADDING * 2);
        thumbAnim.setValue(Math.max(0, Math.min(gs.dx, maxX)));
      },
      onPanResponderRelease: (_, gs) => {
        const maxX = Math.max(0, trackWidthRef.current - THUMB_SIZE - TRACK_PADDING * 2);
        if (gs.dx >= maxX * 0.75) {
          Animated.timing(thumbAnim, {
            toValue: maxX,
            duration: 120,
            useNativeDriver: false,
          }).start(() => {
            onConfirm();
            setTimeout(() => {
              Animated.spring(thumbAnim, {
                toValue: 0,
                useNativeDriver: false,
                tension: 80,
                friction: 8,
              }).start();
            }, 250);
          });
        } else {
          Animated.spring(thumbAnim, {
            toValue: 0,
            useNativeDriver: false,
            tension: 80,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  const labelOpacity = thumbAnim.interpolate({
    inputRange: [0, 70],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <View
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.15)",
        borderRadius: 9999,
        padding: TRACK_PADDING,
        flexDirection: "row",
        alignItems: "center",
        height: THUMB_SIZE + TRACK_PADDING * 2,
      }}
      onLayout={(e) => {
        trackWidthRef.current = e.nativeEvent.layout.width;
      }}
    >
      {/* Centered label — fades as thumb advances */}
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "center",
          opacity: labelOpacity,
        }}
      >
        <AppText
          variant="labelSmall"
          style={{
            color: "rgba(255, 255, 255, 0.9)",
            textTransform: "uppercase",
            letterSpacing: 2.5,
            fontWeight: "800",
          }}
        >
          Slide to confirm
        </AppText>
      </Animated.View>

      {/* Draggable thumb */}
      <Animated.View
        style={{
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          borderRadius: THUMB_SIZE / 2,
          backgroundColor: "#FFFFFF",
          alignItems: "center",
          justifyContent: "center",
          transform: [{ translateX: thumbAnim }],
          shadowColor: "#000000",
          shadowOpacity: 0.15,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 4,
          zIndex: 1,
        }}
        {...panResponder.panHandlers}
      >
        <MaterialCommunityIcons name="chevron-right" size={28} color={PRIMARY} />
      </Animated.View>
    </View>
  );
}

// ── Next dose hero ────────────────────────────────────────────────────────────

function NextDoseHero({
  nextDose,
  onConfirm,
}: {
  readonly nextDose: NextDoseGroup;
  readonly onConfirm: () => void;
}) {
  const badgeLabel =
    nextDose.minutesLate > 0 ? `${nextDose.minutesLate} min overdue` : "Up next";

  return (
    <View
      style={{
        backgroundColor: PRIMARY,
        borderRadius: 28,
        padding: 24,
        shadowColor: PRIMARY,
        shadowOpacity: 0.3,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 12 },
        elevation: 8,
      }}
    >
      {/* Status badge */}
      <View
        style={{
          alignSelf: "flex-start",
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          borderRadius: 9999,
          paddingHorizontal: 12,
          paddingVertical: 4,
          marginBottom: 16,
        }}
      >
        <AppText
          variant="labelSmall"
          style={{
            color: "rgba(255, 255, 255, 0.95)",
            textTransform: "uppercase",
            letterSpacing: 1.2,
            fontWeight: "700",
          }}
        >
          {badgeLabel}
        </AppText>
      </View>

      {/* Scheduled time */}
      <AppText
        variant="displayLarge"
        style={{
          color: "#FFFFFF",
          fontWeight: "800",
          letterSpacing: -1.5,
          lineHeight: 68,
          marginBottom: 20,
        }}
      >
        {nextDose.scheduledAt}
      </AppText>

      {/* Medication list */}
      <View>
        {nextDose.medications.map((med, i) => (
          <View
            key={med.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 13,
              borderBottomWidth: i < nextDose.medications.length - 1 ? 0.5 : 0,
              borderBottomColor: "rgba(255, 255, 255, 0.15)",
            }}
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <AppText
                variant="titleMedium"
                style={{ color: "#FFFFFF", fontWeight: "700", lineHeight: 20 }}
                numberOfLines={2}
              >
                {med.name}
              </AppText>
              <AppText
                variant="bodySmall"
                style={{ color: "rgba(255, 255, 255, 0.6)", marginTop: 2 }}
              >
                {med.instruction}
              </AppText>
            </View>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialCommunityIcons name="pill" size={18} color="#FFFFFF" />
            </View>
          </View>
        ))}
      </View>

      {/* Slider */}
      <View style={{ marginTop: 24 }}>
        <SlideToConfirm onConfirm={onConfirm} />
      </View>
    </View>
  );
}

// ── All set card ──────────────────────────────────────────────────────────────

function AllSetCard() {
  return (
    <View
      style={{
        backgroundColor: SURFACE_LOW,
        borderRadius: 28,
        padding: 32,
        alignItems: "center",
        gap: 12,
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: "rgba(0, 88, 188, 0.10)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MaterialCommunityIcons name="check-circle-outline" size={36} color={PRIMARY} />
      </View>
      <AppText
        variant="titleLarge"
        style={{ fontWeight: "700", color: ON_SURFACE, textAlign: "center" }}
      >
        {"You're all set today"}
      </AppText>
      <AppText
        variant="bodyMedium"
        style={{ color: ON_SURFACE_VARIANT, textAlign: "center" }}
      >
        All doses confirmed. See you tomorrow.
      </AppText>
    </View>
  );
}

// ── Today schedule ────────────────────────────────────────────────────────────

function TodayScheduleSection({ schedule }: { readonly schedule: ScheduledDose[] }) {
  const groups = groupSchedule(schedule);
  if (groups.length === 0) return null;

  return (
    <View style={{ gap: 20 }}>
      <AppText
        variant="titleLarge"
        style={{ fontWeight: "800", color: ON_SURFACE, letterSpacing: -0.3 }}
      >
        {"Today's schedule"}
      </AppText>

      {groups.map(({ period, doses }) => (
        <View key={period} style={{ gap: 16 }}>
          {/* Period divider */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <AppText
              variant="labelSmall"
              style={{
                color: ON_SURFACE_VARIANT,
                textTransform: "uppercase",
                letterSpacing: 1.2,
                opacity: 0.5,
              }}
            >
              {PERIOD_LABEL[period]}
            </AppText>
            <View
              style={{ flex: 1, height: 0.5, backgroundColor: "rgba(0, 88, 188, 0.12)" }}
            />
          </View>

          {/* Dose rows */}
          {doses.map((dose) => (
            <DoseRow key={dose.id} dose={dose} />
          ))}
        </View>
      ))}
    </View>
  );
}

function DoseRow({ dose }: { readonly dose: ScheduledDose }) {
  const taken = dose.status === "taken";
  const missed = dose.status === "missed";

  const timeColor = missed ? ERROR : taken ? ON_SURFACE_VARIANT : PRIMARY;
  const nameColor = taken ? ON_SURFACE_VARIANT : ON_SURFACE;
  const detailText = taken && dose.takenAt
    ? `${dose.dosage} · Taken at ${dose.takenAt}`
    : missed
      ? `${dose.dosage} · Missed`
      : dose.instruction;
  const detailColor = missed ? ERROR : ON_SURFACE_VARIANT;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 20, flex: 1 }}>
        {/* Time */}
        <AppText
          variant="bodySmall"
          style={{ fontWeight: "700", color: timeColor, width: 40 }}
        >
          {dose.scheduledAt}
        </AppText>

        {/* Name + detail */}
        <View style={{ flex: 1 }}>
          <AppText
            variant="bodyLarge"
            style={{
              fontWeight: "700",
              color: nameColor,
              textDecorationLine: taken ? "line-through" : "none",
              opacity: taken ? 0.5 : 1,
            }}
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

      {/* Status indicator */}
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
      {!taken && !missed && (
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 1.5,
            borderColor: "rgba(0, 88, 188, 0.25)",
          }}
        />
      )}
    </View>
  );
}

// ── Photo confirmation stub ───────────────────────────────────────────────────

function PhotoConfirmationStub() {
  return (
    <View
      style={{
        borderRadius: 20,
        backgroundColor: SURFACE_LOW,
        paddingVertical: 24,
        paddingHorizontal: 20,
        alignItems: "center",
        gap: 8,
        opacity: 0.55,
      }}
    >
      <MaterialCommunityIcons name="camera-outline" size={28} color={ON_SURFACE_VARIANT} />
      <AppText
        variant="bodyMedium"
        style={{ fontWeight: "600", color: ON_SURFACE_VARIANT }}
      >
        Verify with photo
      </AppText>
      <View
        style={{
          backgroundColor: "rgba(0, 88, 188, 0.10)",
          borderRadius: 9999,
          paddingHorizontal: 10,
          paddingVertical: 3,
        }}
      >
        <AppText
          variant="labelSmall"
          style={{ color: PRIMARY, letterSpacing: 0.5 }}
        >
          Coming soon
        </AppText>
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [data, setData] = useState<HomeData | null>(null);
  const [allSet, setAllSet] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const result = await getHomeData();
      setData(result);
      setAllSet(result.allSetToday);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingState />;
  if (loadError) return <ErrorState message={loadError} onRetry={load} />;
  if (!data) return <LoadingState />;

  return (
    <AppScreen>
      <GreetingHeader userName={data.userName} />

      {data.missedDoseAlert != null && (
        <MissedDoseAlert medicationName={data.missedDoseAlert.medicationName} />
      )}

      {data.stockWarning != null && (
        <StockWarningBanner
          medicationName={data.stockWarning.medicationName}
          daysLeft={data.stockWarning.daysLeft}
        />
      )}

      <StatsDashboard stats={data.stats} />

      {allSet || data.nextDose == null ? (
        <AllSetCard />
      ) : (
        <NextDoseHero
          nextDose={data.nextDose}
          onConfirm={() => setAllSet(true)}
        />
      )}

      <TodayScheduleSection schedule={data.schedule} />

      <PhotoConfirmationStub />
    </AppScreen>
  );
}
