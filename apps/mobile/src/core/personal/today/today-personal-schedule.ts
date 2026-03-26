import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { mobileSupabase } from "@/core/supabase/mobile-client";
import { useCurrentPatientId } from "@/core/personal/current-patient";
import { personalQueryKeys } from "@/core/personal/query-keys";
import { getLocalIsoDate } from "@/core/personal/time";

type PersonalDoseStatus = "scheduled" | "taken" | "missed" | "skipped";

export type TodayPersonalScheduleRow = {
  id: string;
  patient_id: string;
  personal_medication_id: string;
  scheduled_date: string;
  scheduled_time: string;
  actual_taken_time: string | null;
  status: PersonalDoseStatus;
  personal_medication: {
    display_name: string;
    strength_text: string | null;
  } | null;
};

export type TodayPersonalScheduleItem = {
  id: string;
  personalMedicationId: string;
  scheduledDate: string;
  scheduledTime: Date;
  actualTakenTime: Date | null;
  status: PersonalDoseStatus;
  medicationDisplayName: string;
  medicationStrengthText: string | null;
};

export type TodayPersonalCounters = {
  taken: number;
  scheduled: number;
  missed: number;
  skipped: number;
};

export type NextDoseGroup = {
  scheduledTime: Date;
  items: TodayPersonalScheduleItem[];
} | null;

export type TodayBannerState =
  | { kind: "none" }
  | { kind: "overdue"; overdueCount: number }
  | { kind: "missed"; missedCount: number };

async function fetchTodayPersonalSchedule(patientId: string, scheduledDate: string) {
  const { data, error } = await mobileSupabase
    .from("personal_adherence_log")
    .select(
      "id,patient_id,personal_medication_id,scheduled_date,scheduled_time,actual_taken_time,status,personal_medication(display_name,strength_text)",
    )
    .eq("patient_id", patientId)
    .eq("scheduled_date", scheduledDate)
    .order("scheduled_time", { ascending: true });

  if (error) throw error;
  return (data ?? []) as TodayPersonalScheduleRow[];
}

function mapRowToItem(row: TodayPersonalScheduleRow): TodayPersonalScheduleItem {
  return {
    id: row.id,
    personalMedicationId: row.personal_medication_id,
    scheduledDate: row.scheduled_date,
    scheduledTime: new Date(row.scheduled_time),
    actualTakenTime: row.actual_taken_time ? new Date(row.actual_taken_time) : null,
    status: row.status,
    medicationDisplayName: row.personal_medication?.display_name ?? "Medication",
    medicationStrengthText: row.personal_medication?.strength_text ?? null,
  };
}

export function useTodayPersonalSchedule(options?: { scheduledDate?: string }) {
  const patientId = useCurrentPatientId();
  const scheduledDate = options?.scheduledDate ?? getLocalIsoDate();

  return useQuery({
    queryKey: patientId ? personalQueryKeys.todaySchedule(patientId, scheduledDate) : ["personal", "today", "schedule", "no-patient"],
    enabled: patientId !== null,
    queryFn: async () => {
      if (!patientId) return [];
      const rows = await fetchTodayPersonalSchedule(patientId, scheduledDate);
      return rows.map(mapRowToItem);
    },
  });
}

export function useTodayCounters(options?: { scheduledDate?: string }): TodayPersonalCounters {
  const { data } = useTodayPersonalSchedule(options);

  return useMemo(() => {
    const items = data ?? [];
    let taken = 0;
    let scheduled = 0;
    let missed = 0;
    let skipped = 0;
    for (const item of items) {
      if (item.status === "taken") taken++;
      else if (item.status === "scheduled") scheduled++;
      else if (item.status === "missed") missed++;
      else if (item.status === "skipped") skipped++;
    }
    return {
      taken,
      scheduled,
      missed,
      skipped,
    };
  }, [data]);
}

export function useNextDose(options?: { scheduledDate?: string }): NextDoseGroup {
  const { data } = useTodayPersonalSchedule(options);

  return useMemo(() => {
    const items = (data ?? []).filter((item) => item.status === "scheduled");
    if (items.length === 0) return null;

    const now = Date.now();
    let next: TodayPersonalScheduleItem | null = null;
    for (const item of items) {
      const t = item.scheduledTime.getTime();
      if (t < now) continue;
      next = item;
      break;
    }
    if (!next) return null;

    const nextTime = next.scheduledTime.getTime();
    const grouped = items.filter((item) => item.scheduledTime.getTime() === nextTime);
    return {
      scheduledTime: next.scheduledTime,
      items: grouped,
    };
  }, [data]);
}

export function useTodayBanner(options?: { scheduledDate?: string }): TodayBannerState {
  const { data } = useTodayPersonalSchedule(options);

  return useMemo(() => {
    const items = data ?? [];
    if (items.length === 0) return { kind: "none" };

    const now = Date.now();
    let overdueCount = 0;
    let missedCount = 0;
    for (const item of items) {
      if (item.status === "missed") missedCount++;
      if (item.status === "scheduled" && item.scheduledTime.getTime() < now) overdueCount++;
    }

    if (overdueCount > 0) return { kind: "overdue", overdueCount };
    if (missedCount > 0) return { kind: "missed", missedCount };
    return { kind: "none" };
  }, [data]);
}

type MarkDoseBaseInput = {
  logId?: string;
  personalMedicationId: string;
  scheduledTime: string; // ISO datetime
  scheduledDate?: string; // YYYY-MM-DD
};

async function updateDoseStatusById(params: {
  patientId: string;
  logId: string;
  nextStatus: PersonalDoseStatus;
  actualTakenTime: string | null;
}) {
  const { data, error } = await mobileSupabase
    .from("personal_adherence_log")
    .update({
      status: params.nextStatus,
      actual_taken_time: params.actualTakenTime,
      source: "user",
    })
    .eq("id", params.logId)
    .eq("patient_id", params.patientId)
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

async function upsertDoseStatus(params: {
  patientId: string;
  personalMedicationId: string;
  scheduledTime: string;
  scheduledDate: string;
  nextStatus: PersonalDoseStatus;
  actualTakenTime: string | null;
}) {
  const { data, error } = await mobileSupabase
    .from("personal_adherence_log")
    .upsert(
      {
        patient_id: params.patientId,
        personal_medication_id: params.personalMedicationId,
        scheduled_time: params.scheduledTime,
        scheduled_date: params.scheduledDate,
        status: params.nextStatus,
        actual_taken_time: params.actualTakenTime,
        source: "user",
      },
      { onConflict: "patient_id,personal_medication_id,scheduled_time" },
    )
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export function useMarkDoseTaken(options?: { scheduledDate?: string }) {
  const patientId = useCurrentPatientId();
  const queryClient = useQueryClient();
  const scheduledDate = options?.scheduledDate ?? getLocalIsoDate();

  return useMutation({
    mutationFn: async (input: MarkDoseBaseInput) => {
      if (!patientId) throw new Error("No patient in session");

      const nowIso = new Date().toISOString();
      const nextScheduledDate = input.scheduledDate ?? scheduledDate;

      if (input.logId) {
        return updateDoseStatusById({
          patientId,
          logId: input.logId,
          nextStatus: "taken",
          actualTakenTime: nowIso,
        });
      }

      return upsertDoseStatus({
        patientId,
        personalMedicationId: input.personalMedicationId,
        scheduledTime: input.scheduledTime,
        scheduledDate: nextScheduledDate,
        nextStatus: "taken",
        actualTakenTime: nowIso,
      });
    },
    onSuccess: async (_data, input) => {
      if (!patientId) return;
      const effectiveDate = input.scheduledDate ?? scheduledDate;
      await queryClient.invalidateQueries({
        queryKey: personalQueryKeys.todaySchedule(patientId, effectiveDate),
      });
    },
  });
}

export function useMarkDoseSkipped(options?: { scheduledDate?: string }) {
  const patientId = useCurrentPatientId();
  const queryClient = useQueryClient();
  const scheduledDate = options?.scheduledDate ?? getLocalIsoDate();

  return useMutation({
    mutationFn: async (input: MarkDoseBaseInput) => {
      if (!patientId) throw new Error("No patient in session");

      const nextScheduledDate = input.scheduledDate ?? scheduledDate;

      if (input.logId) {
        return updateDoseStatusById({
          patientId,
          logId: input.logId,
          nextStatus: "skipped",
          actualTakenTime: null,
        });
      }

      return upsertDoseStatus({
        patientId,
        personalMedicationId: input.personalMedicationId,
        scheduledTime: input.scheduledTime,
        scheduledDate: nextScheduledDate,
        nextStatus: "skipped",
        actualTakenTime: null,
      });
    },
    onSuccess: async (_data, input) => {
      if (!patientId) return;
      const effectiveDate = input.scheduledDate ?? scheduledDate;
      await queryClient.invalidateQueries({
        queryKey: personalQueryKeys.todaySchedule(patientId, effectiveDate),
      });
    },
  });
}

