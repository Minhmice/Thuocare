import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Database } from "@thuocare/supabase";
import type { Med, MedStatus } from "@/shared/types/meds";
import { mobileSupabase } from "@/core/supabase/mobile-client";

export const medsQueryKeys = {
  all: ["meds"] as const,
  list: (params: { q?: string; status?: MedStatus | MedStatus[] | "all" }) => ["meds", "list", params] as const,
  detail: (id: string) => ["meds", "detail", id] as const,
};

export type PersonalMedStatus = "active" | "paused" | "stopped";
export type FrequencyCode = "QD" | "BID" | "TID" | "QID" | "Q8H" | "Q12H" | "QHS" | "QOD" | "QW" | "PRN";
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface FixedTimesDailySchedule {
  type: "fixed_times_daily";
  dose_times: string[];
  days_of_week?: number[];
}

export interface IntervalBasedSchedule {
  type: "interval_based";
  interval_hours: number;
}

export interface PrnSchedule {
  type: "prn";
  max_daily_doses?: number;
  min_hours_between_doses?: number;
}

export type DoseScheduleJson = FixedTimesDailySchedule | IntervalBasedSchedule | PrnSchedule;

export interface PersonalMedicationRow {
  id: string;
  patient_id: string;
  personal_profile_id: string;
  catalog_id: string | null;
  custom_name: string | null;
  display_name: string;
  strength_text: string | null;
  dosage_form: string | null;
  dose_amount: number;
  dose_unit: string;
  frequency_code: FrequencyCode;
  dose_schedule_json: DoseScheduleJson;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  status: PersonalMedStatus;
  created_at: string;
  updated_at: string;
}

export interface CreatePersonalMedicationInput {
  display_name: string;
  custom_name?: string | null;
  catalog_id?: string | null;
  strength_text?: string | null;
  dosage_form?: string | null;
  dose_amount: number;
  dose_unit: string;
  frequency_code: FrequencyCode;
  dose_schedule_json: DoseScheduleJson;
  start_date: string;
  end_date?: string | null;
  notes?: string | null;
}

export interface UpdatePersonalMedicationInput {
  display_name?: string;
  strength_text?: string | null;
  dosage_form?: string | null;
  dose_amount?: number;
  dose_unit?: string;
  frequency_code?: FrequencyCode;
  dose_schedule_json?: DoseScheduleJson;
  start_date?: string;
  end_date?: string | null;
  notes?: string | null;
  status?: PersonalMedStatus;
}

type PersonalMedicationRowDb = Database["public"]["Tables"]["personal_medication"]["Row"];
type PersonalMedicationInsertDb = Database["public"]["Tables"]["personal_medication"]["Insert"];
type PersonalMedicationUpdateDb = Database["public"]["Tables"]["personal_medication"]["Update"];

function normalizeListParams(params: { q?: string; status?: MedStatus | MedStatus[] | "all" } | undefined) {
  const q = (params?.q ?? "").trim();
  const status = (params?.status ?? ["active", "paused"]) as MedStatus | MedStatus[] | "all";
  return { q, status };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function toDoseScheduleJson(value: Json): DoseScheduleJson {
  if (!isRecord(value) || typeof value.type !== "string") {
    return { type: "fixed_times_daily", dose_times: [] };
  }

  if (value.type === "fixed_times_daily") {
    const timesRaw = Array.isArray(value.dose_times) ? value.dose_times : [];
    const doseTimes = timesRaw.filter((item): item is string => typeof item === "string");
    const daysOfWeekRaw = Array.isArray(value.days_of_week) ? value.days_of_week : undefined;
    const daysOfWeek = daysOfWeekRaw?.filter((item): item is number => Number.isInteger(item));
    return { type: "fixed_times_daily", dose_times: doseTimes, days_of_week: daysOfWeek };
  }

  if (value.type === "interval_based") {
    return {
      type: "interval_based",
      interval_hours: typeof value.interval_hours === "number" ? value.interval_hours : 8,
    };
  }

  if (value.type === "prn") {
    return {
      type: "prn",
      max_daily_doses: typeof value.max_daily_doses === "number" ? value.max_daily_doses : undefined,
      min_hours_between_doses:
        typeof value.min_hours_between_doses === "number" ? value.min_hours_between_doses : undefined,
    };
  }

  return { type: "fixed_times_daily", dose_times: [] };
}

function toPersonalMedicationRow(row: PersonalMedicationRowDb): PersonalMedicationRow {
  return {
    ...row,
    frequency_code: row.frequency_code,
    status: row.status,
    dose_schedule_json: toDoseScheduleJson(row.dose_schedule_json),
  };
}

function extractScheduleTimes(schedule: DoseScheduleJson): string[] {
  if (schedule.type !== "fixed_times_daily") return [];
  return [...schedule.dose_times].sort((a, b) => a.localeCompare(b));
}

function toMed(row: PersonalMedicationRow): Med {
  return {
    id: row.id,
    displayName: row.display_name,
    strengthText: row.strength_text,
    dosageForm: row.dosage_form,
    doseAmount: row.dose_amount,
    doseUnit: row.dose_unit,
    scheduleTimes: extractScheduleTimes(row.dose_schedule_json),
    notes: row.notes,
    status: row.status,
  };
}

function inferFrequencyCodeFromTimes(times: string[]): FrequencyCode {
  if (times.length === 0) return "PRN";
  if (times.length === 1) return "QD";
  if (times.length === 2) return "BID";
  if (times.length === 3) return "TID";
  if (times.length === 4) return "QID";
  return "Q8H";
}

function buildDefaultScheduleFromTimes(times: string[]): DoseScheduleJson {
  if (times.length === 0) return { type: "prn" };
  return { type: "fixed_times_daily", dose_times: times };
}

function nowLocalIsoDate(): string {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function listPersonalMedications(params: { q: string; status: MedStatus | MedStatus[] | "all" }): Promise<Med[]> {
  let query = mobileSupabase
    .from("personal_medication")
    .select("*")
    .order("display_name", { ascending: true });

  if (params.q) {
    query = query.ilike("display_name", `%${params.q}%`);
  }

  if (params.status !== "all") {
    if (Array.isArray(params.status)) {
      query = query.in("status", params.status);
    } else {
      query = query.eq("status", params.status);
    }
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as PersonalMedicationRowDb[];
  return rows.map((row) => toMed(toPersonalMedicationRow(row)));
}

async function getPersonalMedicationById(id: string): Promise<Med> {
  const { data, error } = await mobileSupabase.from("personal_medication").select("*").eq("id", id).single();
  if (error) throw error;
  const row = data as PersonalMedicationRowDb | null;
  if (!row) throw new Error("Medication not found.");
  return toMed(toPersonalMedicationRow(row));
}

export function useMedsList(params?: { q?: string; status?: MedStatus | MedStatus[] | "all" }) {
  const normalized = normalizeListParams(params);

  return useQuery({
    queryKey: medsQueryKeys.list(normalized),
    queryFn: () => listPersonalMedications(normalized),
  });
}

export function useMedById(id: string) {
  return useQuery({
    queryKey: medsQueryKeys.detail(id),
    enabled: Boolean(id),
    queryFn: () => getPersonalMedicationById(id),
  });
}

export function useCreateMed() {
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: Omit<Med, "id">) => {
      const scheduleTimes = [...(input.scheduleTimes ?? [])].sort((a, b) => a.localeCompare(b));
      const payload: CreatePersonalMedicationInput = {
        display_name: input.displayName.trim(),
        custom_name: input.displayName.trim(),
        strength_text: input.strengthText ?? null,
        dosage_form: input.dosageForm ?? null,
        dose_amount: input.doseAmount && input.doseAmount > 0 ? input.doseAmount : 1,
        dose_unit: input.doseUnit?.trim() ? input.doseUnit.trim() : "tablet",
        frequency_code: inferFrequencyCodeFromTimes(scheduleTimes),
        dose_schedule_json: buildDefaultScheduleFromTimes(scheduleTimes),
        start_date: nowLocalIsoDate(),
        end_date: null,
        notes: input.notes ?? null,
      };

      const { data, error } = await mobileSupabase
        .from("personal_medication")
        .insert(payload as unknown as PersonalMedicationInsertDb)
        .select("*")
        .single();

      if (error) throw error;
      const row = data as PersonalMedicationRowDb | null;
      if (!row) throw new Error("Create medication returned empty result.");
      return toMed(toPersonalMedicationRow(row));
    },
    onSuccess: (med) => {
      qc.setQueryData(medsQueryKeys.detail(med.id), med);
      qc.invalidateQueries({ queryKey: medsQueryKeys.all });
    },
  });

  return {
    ...mutation,
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
  };
}

export function useUpdateMed() {
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (vars: { id: string; patch: Partial<Omit<Med, "id">> }) => {
      const updatePayload: UpdatePersonalMedicationInput = {};

      if (typeof vars.patch.displayName === "string") updatePayload.display_name = vars.patch.displayName.trim();
      if (vars.patch.strengthText !== undefined) updatePayload.strength_text = vars.patch.strengthText ?? null;
      if (vars.patch.dosageForm !== undefined) updatePayload.dosage_form = vars.patch.dosageForm ?? null;
      if (typeof vars.patch.doseAmount === "number") updatePayload.dose_amount = vars.patch.doseAmount;
      if (typeof vars.patch.doseUnit === "string") updatePayload.dose_unit = vars.patch.doseUnit.trim();
      if (vars.patch.notes !== undefined) updatePayload.notes = vars.patch.notes ?? null;
      if (vars.patch.status !== undefined) updatePayload.status = vars.patch.status;

      if (Array.isArray(vars.patch.scheduleTimes)) {
        const scheduleTimes = [...vars.patch.scheduleTimes].sort((a, b) => a.localeCompare(b));
        updatePayload.dose_schedule_json = buildDefaultScheduleFromTimes(scheduleTimes);
        updatePayload.frequency_code = inferFrequencyCodeFromTimes(scheduleTimes);
      }

      const { data, error } = await mobileSupabase
        .from("personal_medication")
        .update(updatePayload as unknown as PersonalMedicationUpdateDb)
        .eq("id", vars.id)
        .select("*")
        .single();

      if (error) throw error;
      const row = data as PersonalMedicationRowDb | null;
      if (!row) throw new Error("Update medication returned empty result.");
      return toMed(toPersonalMedicationRow(row));
    },
    onSuccess: (med) => {
      qc.setQueryData(medsQueryKeys.detail(med.id), med);
      qc.invalidateQueries({ queryKey: medsQueryKeys.all });
    },
  });

  return {
    ...mutation,
    mutate: (id: string, patch: Partial<Omit<Med, "id">>) => mutation.mutate({ id, patch }),
    mutateAsync: (id: string, patch: Partial<Omit<Med, "id">>) => mutation.mutateAsync({ id, patch }),
  };
}

export function useSetMedStatus() {
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (vars: { id: string; status: MedStatus }) => {
      const { data, error } = await mobileSupabase
        .from("personal_medication")
        .update({ status: vars.status })
        .eq("id", vars.id)
        .select("*")
        .single();

      if (error) throw error;
      const row = data as PersonalMedicationRowDb | null;
      if (!row) throw new Error("Set status returned empty result.");
      return toMed(toPersonalMedicationRow(row));
    },
    onSuccess: (med) => {
      qc.setQueryData(medsQueryKeys.detail(med.id), med);
      qc.invalidateQueries({ queryKey: medsQueryKeys.all });
    },
  });

  return {
    ...mutation,
    mutate: (id: string, status: MedStatus) => mutation.mutate({ id, status }),
    mutateAsync: (id: string, status: MedStatus) => mutation.mutateAsync({ id, status }),
  };
}

export function useDeleteMed() {
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await mobileSupabase.from("personal_medication").delete().eq("id", id);
      if (error) throw error;
      return { id };
    },
    onSuccess: ({ id }) => {
      qc.removeQueries({ queryKey: medsQueryKeys.detail(id) });
      qc.invalidateQueries({ queryKey: medsQueryKeys.all });
    },
  });

  return {
    ...mutation,
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
  };
}

export const useMedications = useMedsList;
export const useAddMedication = useCreateMed;
