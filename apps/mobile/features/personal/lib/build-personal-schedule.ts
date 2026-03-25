import type { DoseScheduleJson, FrequencyCode } from "@thuocare/personal";

/** Default schedule for each frequency preset (before user customizes). */
export function scheduleFromFrequencyPreset(freq: FrequencyCode): DoseScheduleJson {
  switch (freq) {
    case "QD":
      return { type: "fixed_times_daily", dose_times: ["08:00"] };
    case "BID":
      return { type: "fixed_times_daily", dose_times: ["08:00", "20:00"] };
    case "TID":
      return { type: "fixed_times_daily", dose_times: ["08:00", "14:00", "20:00"] };
    case "QID":
      return { type: "fixed_times_daily", dose_times: ["06:00", "12:00", "18:00", "22:00"] };
    case "Q8H":
      return { type: "interval_based", interval_hours: 8 };
    case "Q12H":
      return { type: "interval_based", interval_hours: 12 };
    case "QHS":
      return { type: "fixed_times_daily", dose_times: ["22:00"] };
    case "QOD":
      return { type: "fixed_times_daily", dose_times: ["08:00"] };
    case "QW":
      return { type: "fixed_times_daily", dose_times: ["08:00"], days_of_week: [1] };
    case "PRN":
      return { type: "prn" };
    default:
      return { type: "fixed_times_daily", dose_times: ["08:00"] };
  }
}

export function isIntervalFrequency(freq: FrequencyCode): boolean {
  return freq === "Q8H" || freq === "Q12H";
}

export interface RoutineScheduleInput {
  frequencyCode: FrequencyCode;
  /** Valid HH:MM tokens; when non-empty, overrides preset times for fixed schedules */
  customTimeSlots: string[];
  intervalHoursStr: string;
  selectedDays: number[];
}

/** Build schedule JSON from shared routine editor state (add + edit screens). */
export function scheduleFromRoutineState(input: RoutineScheduleInput): DoseScheduleJson {
  const { frequencyCode, customTimeSlots, intervalHoursStr, selectedDays } = input;

  if (frequencyCode === "PRN") return { type: "prn" };

  if (isIntervalFrequency(frequencyCode)) {
    const preset = scheduleFromFrequencyPreset(frequencyCode);
    if (preset.type !== "interval_based") return preset;
    const parsed = parseFloat(intervalHoursStr.replace(",", "."));
    const hours =
      Number.isFinite(parsed) && parsed > 0 && parsed <= 24 ? parsed : preset.interval_hours;
    return { type: "interval_based", interval_hours: hours };
  }

  const cleanedSlots = [...new Set(customTimeSlots.filter(Boolean))].sort();
  if (cleanedSlots.length > 0) {
    return {
      type: "fixed_times_daily",
      dose_times: cleanedSlots,
      days_of_week: selectedDays.length > 0 ? selectedDays : undefined,
    };
  }

  const base = scheduleFromFrequencyPreset(frequencyCode);
  if (base.type === "fixed_times_daily" && selectedDays.length > 0) {
    return { ...base, days_of_week: selectedDays };
  }
  return base;
}

/** Normalize "8:0" → "08:00". */
export function normalizeTimeToken(raw: string): string | null {
  const t = raw.trim();
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export function parseTimesFromText(text: string): string[] {
  const parts = text.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    const n = normalizeTimeToken(p);
    if (n) out.push(n);
  }
  return [...new Set(out)].sort();
}

export function describeScheduleBrief(s: DoseScheduleJson): string {
  if (s.type === "prn") return "Khi cần";
  if (s.type === "interval_based") return `Mỗi ${s.interval_hours} giờ`;
  const times = s.dose_times.join(", ");
  if (s.days_of_week?.length) return `${times} (một số ngày trong tuần)`;
  return times;
}
