/**
 * Frequency code definitions and parsing.
 *
 * Translates Latin abbreviation frequency codes (QD, BID, TID, …) into
 * numeric and structural properties used by:
 * - schedule generation (times_per_day, default dose times)
 * - quantity calculation (doses_per_day for total quantity math)
 * - instruction building (Vietnamese/English text)
 *
 * DESIGN: Pure functions — no side effects, no DB calls.
 *
 * Reference abbreviations (standard clinical Latin):
 *   QD   = quaque die (every day)
 *   BID  = bis in die (twice a day)
 *   TID  = ter in die (three times a day)
 *   QID  = quater in die (four times a day)
 *   Q8H  = quaque 8 hora (every 8 hours)
 *   Q12H = quaque 12 hora (every 12 hours)
 *   QHS  = quaque hora somni (every hour of sleep = at bedtime)
 *   QOD  = quaque other die (every other day)
 *   QW   = quaque week (once weekly)
 *   PRN  = pro re nata (as needed)
 */

import type { FrequencyCode } from "../domain/types.js";

// ─── Frequency metadata ───────────────────────────────────────────────────────

export interface FrequencyMeta {
  /** Number of doses per 24-hour day. Fractional for QOD/QW. */
  dosesPerDay: number;
  /** Whether this is an interval-based frequency (Q8H, Q12H). */
  isInterval: boolean;
  /** Interval hours, only set when isInterval = true. */
  intervalHours: number | null;
  /** Whether this is a PRN (as-needed) frequency. */
  isPrn: boolean;
  /** Default dose times in HH:mm (24h) for fixed_times_daily schedule. */
  defaultDoseTimes: string[];
  /** Human-readable Vietnamese text. */
  textVi: string;
  /** Human-readable English text. */
  textEn: string;
}

/** Metadata for every supported FrequencyCode. */
export const FREQUENCY_META: Record<FrequencyCode, FrequencyMeta> = {
  QD: {
    dosesPerDay: 1,
    isInterval: false,
    intervalHours: null,
    isPrn: false,
    defaultDoseTimes: ["08:00"],
    textVi: "ngày 1 lần",
    textEn: "once daily",
  },
  BID: {
    dosesPerDay: 2,
    isInterval: false,
    intervalHours: null,
    isPrn: false,
    defaultDoseTimes: ["08:00", "20:00"],
    textVi: "ngày 2 lần",
    textEn: "twice daily",
  },
  TID: {
    dosesPerDay: 3,
    isInterval: false,
    intervalHours: null,
    isPrn: false,
    defaultDoseTimes: ["08:00", "13:00", "21:00"],
    textVi: "ngày 3 lần",
    textEn: "three times daily",
  },
  QID: {
    dosesPerDay: 4,
    isInterval: false,
    intervalHours: null,
    isPrn: false,
    defaultDoseTimes: ["07:00", "12:00", "17:00", "21:00"],
    textVi: "ngày 4 lần",
    textEn: "four times daily",
  },
  Q8H: {
    dosesPerDay: 3,
    isInterval: true,
    intervalHours: 8,
    isPrn: false,
    defaultDoseTimes: ["08:00", "16:00", "00:00"],
    textVi: "mỗi 8 giờ",
    textEn: "every 8 hours",
  },
  Q12H: {
    dosesPerDay: 2,
    isInterval: true,
    intervalHours: 12,
    isPrn: false,
    defaultDoseTimes: ["08:00", "20:00"],
    textVi: "mỗi 12 giờ",
    textEn: "every 12 hours",
  },
  QHS: {
    dosesPerDay: 1,
    isInterval: false,
    intervalHours: null,
    isPrn: false,
    defaultDoseTimes: ["22:00"],
    textVi: "buổi tối trước khi ngủ",
    textEn: "at bedtime",
  },
  QOD: {
    dosesPerDay: 0.5,
    isInterval: false,
    intervalHours: null,
    isPrn: false,
    defaultDoseTimes: ["08:00"],
    textVi: "cách ngày uống 1 lần",
    textEn: "every other day",
  },
  QW: {
    dosesPerDay: 1 / 7,
    isInterval: false,
    intervalHours: null,
    isPrn: false,
    defaultDoseTimes: ["08:00"],
    textVi: "mỗi tuần 1 lần",
    textEn: "once weekly",
  },
  PRN: {
    dosesPerDay: 0,
    isInterval: false,
    intervalHours: null,
    isPrn: true,
    defaultDoseTimes: [],
    textVi: "khi cần",
    textEn: "as needed",
  },
};

/**
 * Look up frequency metadata for a given code.
 * Returns null for unknown codes (callers should reject).
 */
export function getFrequencyMeta(code: FrequencyCode): FrequencyMeta {
  return FREQUENCY_META[code];
}

/**
 * Parse a frequency code string and return metadata.
 * Returns null if the string is not a recognized FrequencyCode.
 */
export function parseFrequencyCode(code: string): FrequencyMeta | null {
  const meta = FREQUENCY_META[code as FrequencyCode];
  return meta ?? null;
}

/**
 * Derive a human-readable frequency text string from a code.
 * Used to populate `prescription_item.frequency_text`.
 */
export function frequencyCodeToText(
  code: FrequencyCode,
  language: "vi" | "en" = "vi",
): string {
  const meta = getFrequencyMeta(code);
  return language === "vi" ? meta.textVi : meta.textEn;
}
