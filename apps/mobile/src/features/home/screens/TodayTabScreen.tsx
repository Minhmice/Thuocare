import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, View, type LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { formatCountdownHhMmSs, formatTimeHHmm } from "@/core/personal/time";
import { TodayHeader } from "@/features/home/components/TodayHeader";
import { OverdueBanner } from "@/features/home/components/OverdueBanner";
import { TodayCountersRow } from "@/features/home/components/TodayCountersRow";
import { NextDoseCard } from "@/features/home/components/NextDoseCard";
import { TodayScheduleSection } from "@/features/home/components/TodayScheduleSection";
import {
  formatHomeTimeHint,
  useHomeAutoMissTicker,
  useHomeBanner,
  useHomeMarkDoseSkipped,
  useHomeMarkDoseTaken,
  useHomeNextDose,
  useHomeTodayCounters,
  useHomeTodaySchedule,
  useHomeToggleSkip,
} from "@/features/home/data/use-today-home";

type DoseStatus = "taken" | "upcoming" | "overdue" | "missed" | "skipped";

export type TodayScheduleRowModel = {
  id: string;
  timeLabel: string;
  title: string;
  subtitle?: string;
  status: DoseStatus;
};

export type NextDoseMedModel = {
  id: string;
  title: string;
  subtitle?: string;
};

function getViDayLabel(date: Date) {
  const day = date.getDay(); // 0=Sun..6=Sat
  const map = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  return map[day] ?? "Hôm nay";
}

function getViDateLabel(date: Date) {
  return `${date.getDate()} Tháng ${date.getMonth() + 1}`;
}

function formatTimeGroupSubtitle(rows: { scheduledTime: Date }[]) {
  if (rows.length === 0) return undefined;
  const sorted = [...rows].sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  const start = formatTimeHHmm(sorted[0].scheduledTime);
  const end = formatTimeHHmm(sorted[sorted.length - 1].scheduledTime);
  return `${start} – ${end}`;
}

export function TodayTabScreen() {
  const insets = useSafeAreaInsets();
  const [now, setNow] = useState(() => new Date());
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const [scheduleTopY, setScheduleTopY] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const schedule = useHomeTodaySchedule();
  const counters = useHomeTodayCounters();
  const banner = useHomeBanner();
  const nextDose = useHomeNextDose(now);
  const markTaken = useHomeMarkDoseTaken();
  const markSkipped = useHomeMarkDoseSkipped();
  const toggleSkip = useHomeToggleSkip();

  useHomeAutoMissTicker(now);

  const headerModel = useMemo(() => {
    return {
      dayLabel: getViDayLabel(now),
      dateLabel: getViDateLabel(now),
      timeLabel: formatTimeHHmm(now),
    };
  }, [now]);

  const counterItems = useMemo(() => {
    return [
      { label: "Đã uống", value: counters.taken, tone: "good" as const },
      { label: "Còn lại", value: counters.scheduled, tone: "neutral" as const },
      { label: "Quên", value: counters.missed, tone: "danger" as const },
    ] as const;
  }, [counters.missed, counters.scheduled, counters.taken]);

  const nextDoseModel = useMemo(() => {
    if (!nextDose) return null;
    const msRemaining = nextDose.scheduledTime.getTime() - now.getTime();
    return {
      countdownLabel: formatCountdownHhMmSs(msRemaining),
      timeHint: formatHomeTimeHint(nextDose.scheduledTime),
      meds: nextDose.items.map(
        (item): NextDoseMedModel => ({
          id: item.id,
          title: item.medicationStrengthText
            ? `${item.medicationDisplayName} ${item.medicationStrengthText}`
            : item.medicationDisplayName,
          subtitle: undefined,
        }),
      ),
      scheduledTimeIso: nextDose.scheduledTime.toISOString(),
    };
  }, [nextDose, now]);

  const scheduleSections = useMemo(() => {
    const scheduleItems =
      schedule.kind === "mock" || schedule.kind === "api"
        ? schedule.data
        : schedule.kind === "supabase"
          ? schedule.supa.data ?? []
          : [];

    type BucketKey = "morning" | "afternoon" | "evening";
    const buckets: Record<BucketKey, Array<(typeof scheduleItems)[number]>> = {
      morning: [],
      afternoon: [],
      evening: [],
    };

    for (const item of scheduleItems) {
      const hour = item.scheduledTime.getHours();
      const key: BucketKey = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
      buckets[key].push(item);
    }

    const buildRows = (items: Array<(typeof scheduleItems)[number]>): TodayScheduleRowModel[] => {
      const nowMs = now.getTime();
      return items.map((item) => {
        let status: DoseStatus = "upcoming";
        if (item.status === "taken") status = "taken";
        else if (item.status === "skipped") status = "skipped";
        else if (item.status === "missed") status = "missed";
        else if (item.status === "scheduled" && item.scheduledTime.getTime() < nowMs) status = "overdue";

        return {
          id: item.id,
          timeLabel: formatTimeHHmm(item.scheduledTime),
          title:
            "medicationDisplayName" in item
              ? item.medicationStrengthText
                ? `${item.medicationDisplayName} ${item.medicationStrengthText}`
                : item.medicationDisplayName
              : item.title,
          subtitle: undefined,
          status,
        };
      });
    };

    const sections = [
      {
        id: "morning",
        title: "Sáng",
        items: buckets.morning,
      },
      {
        id: "afternoon",
        title: "Chiều",
        items: buckets.afternoon,
      },
      {
        id: "evening",
        title: "Tối",
        items: buckets.evening,
      },
    ].filter((s) => s.items.length > 0);

    return sections.map((s) => ({
      id: s.id,
      title: s.title,
      subtitle: formatTimeGroupSubtitle(s.items),
      rows: buildRows(s.items),
      items: s.items,
    }));
  }, [now, schedule]);

  const firstOverdue = useMemo(() => {
    const scheduleItems =
      schedule.kind === "mock" || schedule.kind === "api"
        ? schedule.data
        : schedule.kind === "supabase"
          ? schedule.supa.data ?? []
          : [];
    const nowMs = now.getTime();
    return scheduleItems.find((i) => i.status === "scheduled" && i.scheduledTime.getTime() < nowMs) ?? null;
  }, [now, schedule]);

  const bannerModel = useMemo(() => {
    if (banner.kind === "overdue") {
      return {
        visible: true,
        title: `Bạn đang trễ ${banner.overdueCount} liều`,
        description: "Uống thuốc ngay để không bỏ lỡ lịch hôm nay.",
        ctaLabel: "Uống ngay",
      };
    }
    if (banner.kind === "missed") {
      return {
        visible: true,
        title: `Bạn đã quên ${banner.missedCount} liều`,
        description: "Xem lại lịch uống và cập nhật trạng thái liều.",
        ctaLabel: "Xem lịch",
      };
    }
    return { visible: false, title: "", description: "", ctaLabel: "" };
  }, [banner]);

  useEffect(() => {
    setBannerDismissed(false);
  }, [banner.kind]);

  function handleScheduleLayout(e: LayoutChangeEvent) {
    setScheduleTopY(e.nativeEvent.layout.y);
  }

  return (
    <View className="flex-1 bg-surface">
      <ScrollView
        ref={(node) => {
          scrollRef.current = node;
        }}
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5">
          <TodayHeader dayLabel={headerModel.dayLabel} dateLabel={headerModel.dateLabel} timeLabel={headerModel.timeLabel} />
        </View>

        <View className="mt-4 px-5">
          <OverdueBanner
            visible={bannerModel.visible && !bannerDismissed}
            title={bannerModel.title}
            description={bannerModel.description}
            ctaLabel={bannerModel.ctaLabel}
            onPressCta={() => {
              if (banner.kind === "overdue" && firstOverdue) {
                if (markTaken.kind === "mock" || markTaken.kind === "api") {
                  markTaken.mutate(firstOverdue.id);
                } else {
                  if (!("personalMedicationId" in firstOverdue)) return;
                  markTaken.mutate({
                    logId: firstOverdue.id,
                    personalMedicationId: firstOverdue.personalMedicationId,
                    scheduledTime: firstOverdue.scheduledTime.toISOString(),
                    scheduledDate: firstOverdue.scheduledDate,
                  });
                }
              }
              if (banner.kind === "missed" && scheduleTopY !== null) {
                scrollRef.current?.scrollTo({ y: scheduleTopY - 12, animated: true });
              }
            }}
            onPressDismiss={() => setBannerDismissed(true)}
          />
        </View>

        <View className="mt-4 px-5">
          <TodayCountersRow
            items={counterItems}
            onPressTaken={() => {}}
            onPressRemaining={() => {}}
            onPressMissed={() => {}}
          />
        </View>

        <View className="mt-4 px-5">
          <NextDoseCard
            countdownLabel={nextDoseModel?.countdownLabel ?? "--:--:--"}
            title="Liều tiếp theo"
            timeHint={nextDoseModel?.timeHint ?? "Không còn liều hôm nay"}
            meds={nextDoseModel?.meds ?? []}
            onPressCard={() => {
              if (!nextDoseModel || !nextDose) return;
              for (const item of nextDose.items) {
                if (markTaken.kind === "mock" || markTaken.kind === "api") {
                  markTaken.mutate(item.id);
                } else {
                  if (!("personalMedicationId" in item)) continue;
                  markTaken.mutate({
                    logId: item.id,
                    personalMedicationId: item.personalMedicationId,
                    scheduledTime: item.scheduledTime.toISOString(),
                    scheduledDate: item.scheduledDate,
                  });
                }
              }
            }}
            onPressEditMed={() => {}}
          />
        </View>

        <View className="mt-5 px-5 pb-2" onLayout={handleScheduleLayout}>
          {scheduleSections.map((section) => (
            <View key={section.id} className="mb-4">
              <TodayScheduleSection
                title={section.title}
                subtitle={section.subtitle}
                rows={section.rows}
                onPressRow={(rowId) => {
                  const item = section.items.find((i) => i.id === rowId);
                  if (!item) return;

                  if (item.status === "taken") return;
                  if (item.status === "skipped") {
                    if (markTaken.kind === "mock" || markTaken.kind === "api") {
                      markTaken.mutate(item.id);
                    } else {
                      if (!("personalMedicationId" in item)) return;
                      markTaken.mutate({
                        logId: item.id,
                        personalMedicationId: item.personalMedicationId,
                        scheduledTime: item.scheduledTime.toISOString(),
                        scheduledDate: item.scheduledDate,
                      });
                    }
                    return;
                  }

                  if (item.status === "scheduled" || item.status === "missed") {
                    if (markTaken.kind === "mock" || markTaken.kind === "api") {
                      markTaken.mutate(item.id);
                    } else {
                      if (!("personalMedicationId" in item)) return;
                      markTaken.mutate({
                        logId: item.id,
                        personalMedicationId: item.personalMedicationId,
                        scheduledTime: item.scheduledTime.toISOString(),
                        scheduledDate: item.scheduledDate,
                      });
                    }
                    return;
                  }

                  // fallback
                  if (markSkipped.kind === "mock" || markSkipped.kind === "api") {
                    markSkipped.mutate(item.id);
                  } else {
                    if (!("personalMedicationId" in item)) return;
                    markSkipped.mutate({
                      logId: item.id,
                      personalMedicationId: item.personalMedicationId,
                      scheduledTime: item.scheduledTime.toISOString(),
                      scheduledDate: item.scheduledDate,
                    });
                  }
                }}
                onLongPressRow={(rowId) => {
                  const item = section.items.find((i) => i.id === rowId);
                  if (!item) return;
                  if (item.status === "taken") return;
                  if (markSkipped.kind === "mock" || markSkipped.kind === "api") {
                    toggleSkip.toggle(item.id);
                  } else {
                    if (!("personalMedicationId" in item)) return;
                    markSkipped.mutate({
                      logId: item.id,
                      personalMedicationId: item.personalMedicationId,
                      scheduledTime: item.scheduledTime.toISOString(),
                      scheduledDate: item.scheduledDate,
                    });
                  }
                }}
              />
            </View>
          ))}
        </View>
      </ScrollView>

    </View>
  );
}

