import { useEffect, useMemo, useSyncExternalStore } from "react";

import { getApiBaseUrl } from "@/core/api/api-base-url";
import { dataSource } from "@/core/data-source/data-source";
import { formatTimeHHmm, getLocalIsoDate } from "@/core/personal/time";
import { subscribeMockHomeStore, getMockHomeState, runAutoMiss, setDoseStatus } from "@/features/home/data/mock-home-store";
import type { MockDoseLog, MockDoseStatus } from "@/shared/types/meds";
import { useHomeTodayApi, useSetHomeDoseStatusApi } from "@/features/home/data/home-api";

import {
  useMarkDoseSkipped,
  useMarkDoseTaken,
  useNextDose,
  useTodayBanner,
  useTodayCounters,
  useTodayPersonalSchedule,
} from "@/core/personal/today/today-personal-schedule";

type HomeScheduleItem = {
  id: string;
  scheduledTime: Date;
  scheduledDate: string;
  title: string;
  status: MockDoseStatus;
  medId: string;
};

function mapMockDoseToHomeItem(d: MockDoseLog, medsById: Map<string, { title: string }>): HomeScheduleItem {
  const dt = new Date(d.scheduledAtIso);
  return {
    id: d.id,
    scheduledTime: dt,
    scheduledDate: getLocalIsoDate(dt),
    title: medsById.get(d.medId)?.title ?? "Thuốc",
    status: d.status,
    medId: d.medId,
  };
}

export function useHomeTodaySchedule() {
  // Supabase path (kept intact for later)
  const supa = useTodayPersonalSchedule();

  // Mock path (prefer API routes when reachable)
  const todayApi = useHomeTodayApi();
  const canUseApi = !!todayApi.apiUrl;
  const snap = useSyncExternalStore(subscribeMockHomeStore, getMockHomeState, getMockHomeState);
  const items = useMemo(() => {
    const apiData = todayApi.data;
    const meds = apiData?.meds ?? snap.meds;
    const doseLogs = apiData?.doseLogs ?? snap.doseLogs;
    const medsById = new Map(
      meds.map((m) => [m.id, { title: m.strengthText ? `${m.displayName} ${m.strengthText}` : m.displayName }]),
    );
    return doseLogs.map((d) => mapMockDoseToHomeItem(d, medsById)).sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  }, [snap.doseLogs, snap.meds, todayApi.data]);

  if (dataSource === "supabase") {
    // Consumers can keep the same shape; adapt elsewhere if needed.
    return { kind: "supabase" as const, supa };
  }

  if (canUseApi) {
    return {
      kind: "api" as const,
      data: items,
      isLoading: todayApi.isLoading,
      isFetching: todayApi.isFetching,
      error: todayApi.error,
    };
  }

  return { kind: "mock" as const, data: items };
}

export function useHomeAutoMissTicker(now: Date) {
  useEffect(() => {
    // When using API routes, the backend's GET handler runs auto-miss and we refetch periodically.
    // Keep the old behavior for store-fallback mode.
    if (dataSource !== "mock") return;
    runAutoMiss(now);
  }, [now]);
}

export function useHomeTodayCounters() {
  const supa = useTodayCounters();
  const schedule = useHomeTodaySchedule();

  if (dataSource === "supabase") return supa;

  const items = schedule.kind === "mock" || schedule.kind === "api" ? schedule.data : [];
  return useMemo(() => {
    let taken = 0;
    let scheduled = 0;
    let missed = 0;
    let skipped = 0;
    for (const i of items) {
      if (i.status === "taken") taken++;
      else if (i.status === "scheduled") scheduled++;
      else if (i.status === "missed") missed++;
      else if (i.status === "skipped") skipped++;
    }
    return { taken, scheduled, missed, skipped };
  }, [items]);
}

export function useHomeBanner() {
  const supa = useTodayBanner();
  const schedule = useHomeTodaySchedule();

  if (dataSource === "supabase") return supa;

  const items = schedule.kind === "mock" || schedule.kind === "api" ? schedule.data : [];
  const now = Date.now();
  let overdue = 0;
  let missed = 0;
  for (const i of items) {
    if (i.status === "missed") missed++;
    if (i.status === "scheduled" && i.scheduledTime.getTime() < now) overdue++;
  }
  if (overdue > 0) return { kind: "overdue" as const, overdueCount: overdue };
  if (missed > 0) return { kind: "missed" as const, missedCount: missed };
  return { kind: "none" as const };
}

export function useHomeNextDose(now: Date) {
  const supa = useNextDose();
  const schedule = useHomeTodaySchedule();

  if (dataSource === "supabase") return supa;

  const items = schedule.kind === "mock" || schedule.kind === "api" ? schedule.data : [];
  const candidates = items.filter((i) => i.status === "scheduled").sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  const nowMs = now.getTime();
  const next = candidates.find((c) => c.scheduledTime.getTime() >= nowMs) ?? null;
  if (!next) return null;
  const group = candidates.filter((c) => c.scheduledTime.getTime() === next.scheduledTime.getTime());
  return {
    scheduledTime: next.scheduledTime,
    items: group.map((g) => ({
      id: g.id,
      personalMedicationId: g.medId,
      scheduledDate: g.scheduledDate,
      scheduledTime: g.scheduledTime,
      actualTakenTime: null,
      status: "scheduled" as const,
      medicationDisplayName: g.title,
      medicationStrengthText: null,
    })),
  };
}

export function useHomeMarkDoseTaken() {
  const supa = useMarkDoseTaken();
  const setStatusApi = useSetHomeDoseStatusApi();

  if (dataSource === "supabase") return { kind: "supabase" as const, mutate: supa.mutate, isPending: supa.isPending };

  if (getApiBaseUrl()) {
    return {
      kind: "api" as const,
      mutate: (doseId: string) => setStatusApi.mutate({ id: doseId, status: "taken" }),
      isPending: setStatusApi.isPending,
    };
  }

  return {
    kind: "mock" as const,
    mutate: (doseId: string) => setDoseStatus(doseId, "taken"),
    isPending: false,
  };
}

export function useHomeMarkDoseSkipped() {
  const supa = useMarkDoseSkipped();
  if (dataSource === "supabase") return { kind: "supabase" as const, mutate: supa.mutate, isPending: supa.isPending };

  const setStatusApi = useSetHomeDoseStatusApi();
  if (getApiBaseUrl()) {
    return {
      kind: "api" as const,
      mutate: (doseId: string) => setStatusApi.mutate({ id: doseId, status: "skipped" }),
      isPending: setStatusApi.isPending,
    };
  }

  return {
    kind: "mock" as const,
    mutate: (doseId: string) => setDoseStatus(doseId, "skipped"),
    isPending: false,
  };
}

export function useHomeToggleSkip() {
  const markSkipped = useHomeMarkDoseSkipped();
  const schedule = useHomeTodaySchedule();
  const setStatusApi = useSetHomeDoseStatusApi();

  return {
    toggle: (doseId: string) => {
      if (dataSource === "supabase") return;
      if (schedule.kind !== "mock" && schedule.kind !== "api") return;
      const item = schedule.data.find((d) => d.id === doseId);
      if (!item) return;
      if (item.status === "skipped") {
        if (schedule.kind === "api") setStatusApi.mutate({ id: doseId, status: "scheduled" });
        else setDoseStatus(doseId, "scheduled");
        return;
      }
      if (markSkipped.kind === "api") setStatusApi.mutate({ id: item.id, status: "skipped" });
      else if (markSkipped.kind === "mock") markSkipped.mutate(item.id);
    },
  };
}

export function formatHomeTimeHint(date: Date) {
  return `Hôm nay • ${formatTimeHHmm(date)}`;
}

