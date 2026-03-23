/**
 * Patient instruction builder.
 *
 * Generates deterministic, human-readable patient instructions from structured
 * prescription item data. Supports Vietnamese (primary) and English.
 *
 * WHY DERIVED INSTRUCTIONS:
 * - Consistency — same data always produces the same text.
 * - No transcription errors — doctor doesn't type the instruction text.
 * - Localizable — language templates are in one place.
 * - Auditable — instruction text can always be regenerated from the data.
 *
 * OUTPUT FORMAT:
 *
 * Vietnamese (oral, regular):
 *   "Uống 1 viên, ngày 2 lần, sau ăn"
 *
 * Vietnamese (oral, PRN):
 *   "Uống 1 viên khi cần (đau đầu), tối đa 3 lần/ngày, sau ăn"
 *
 * Vietnamese (non-oral, regular):
 *   "Tiêm bắp 1 ống, ngày 1 lần"
 *
 * English:
 *   "Take 1 tablet, twice daily, after meals"
 *   "Take 1 tablet as needed (headache), max 3 times/day, after meals"
 */

import type { DosageForm, Route, TimingRelation } from "@thuocare/contracts";
import type { FrequencyCode, InstructionLanguage } from "../domain/types.js";
import { getFrequencyMeta } from "../schedule/frequency.js";

// ─── Translation tables ───────────────────────────────────────────────────────

const ROUTE_VI: Record<Route, string> = {
  oral: "Uống",
  iv: "Tiêm tĩnh mạch",
  im: "Tiêm bắp",
  sc: "Tiêm dưới da",
  topical: "Bôi",
  inhalation: "Xịt/hít",
  other: "Dùng",
};

const ROUTE_EN: Record<Route, string> = {
  oral: "Take",
  iv: "Inject IV",
  im: "Inject IM",
  sc: "Inject SC",
  topical: "Apply",
  inhalation: "Inhale",
  other: "Use",
};

const TIMING_VI: Record<TimingRelation, string> = {
  before_meal: "trước ăn",
  after_meal: "sau ăn",
  with_meal: "trong bữa ăn",
  bedtime: "trước khi ngủ",
  none: "",
};

const TIMING_EN: Record<TimingRelation, string> = {
  before_meal: "before meals",
  after_meal: "after meals",
  with_meal: "with meals",
  bedtime: "at bedtime",
  none: "",
};

// ─── Input type ───────────────────────────────────────────────────────────────

export interface BuildInstructionInput {
  doseAmount: string;       // e.g., "1", "0.5"
  doseUnit: string;         // e.g., "viên", "ml", "ống"
  route: Route;
  frequencyCode: FrequencyCode;
  timingRelation: TimingRelation;
  dosageForm: DosageForm;
  prnFlag: boolean;
  prnReason: string | null;
  /** Maximum daily doses for PRN instructions. Defaults to 3. */
  prnMaxDailyDoses?: number;
  language?: InstructionLanguage;
}

// ─── Builder ──────────────────────────────────────────────────────────────────

/**
 * Build a patient-facing instruction string from structured item data.
 *
 * Call this during prescription item creation to populate
 * `prescription_item.patient_instruction_text`.
 */
export function buildPatientInstruction(input: BuildInstructionInput): string {
  const lang = input.language ?? "vi";
  return lang === "vi"
    ? buildViInstruction(input)
    : buildEnInstruction(input);
}

/**
 * Build an administration instruction (for pharmacist/nurse note).
 * Slightly more clinical than the patient instruction.
 */
export function buildAdministrationInstruction(input: BuildInstructionInput): string {
  const lang = input.language ?? "vi";
  const meta = getFrequencyMeta(input.frequencyCode);

  if (lang === "vi") {
    const parts: string[] = [
      `${input.doseAmount} ${input.doseUnit}`,
      meta.textVi,
    ];
    const timing = TIMING_VI[input.timingRelation];
    if (timing) parts.push(timing);
    return parts.join(", ");
  }

  const parts: string[] = [
    `${input.doseAmount} ${input.doseUnit}`,
    meta.textEn,
  ];
  const timing = TIMING_EN[input.timingRelation];
  if (timing) parts.push(timing);
  return parts.join(", ");
}

// ─── Vietnamese instruction ───────────────────────────────────────────────────

function buildViInstruction(input: BuildInstructionInput): string {
  const meta = getFrequencyMeta(input.frequencyCode);
  const routeVerb = ROUTE_VI[input.route] ?? "Dùng";
  const timing = TIMING_VI[input.timingRelation];
  const prnMax = input.prnMaxDailyDoses ?? 3;

  if (input.prnFlag) {
    // "Uống 1 viên khi cần (đau đầu), tối đa 3 lần/ngày, sau ăn"
    const parts: string[] = [
      `${routeVerb} ${input.doseAmount} ${input.doseUnit} khi cần`,
    ];
    if (input.prnReason) {
      parts[0] += ` (${input.prnReason})`;
    }
    parts.push(`tối đa ${prnMax} lần/ngày`);
    if (timing) parts.push(timing);
    return parts.join(", ");
  }

  // Regular: "Uống 1 viên, ngày 2 lần, sau ăn"
  // For QHS: "Uống 1 viên, buổi tối trước khi ngủ" (timing already in freq text)
  const parts: string[] = [
    `${routeVerb} ${input.doseAmount} ${input.doseUnit}`,
    meta.textVi,
  ];
  // Avoid duplicating "trước khi ngủ" when QHS + bedtime timing
  const shouldAddTiming =
    timing.length > 0 &&
    !(input.frequencyCode === "QHS" && input.timingRelation === "bedtime");
  if (shouldAddTiming) parts.push(timing);

  return parts.join(", ");
}

// ─── English instruction ──────────────────────────────────────────────────────

function buildEnInstruction(input: BuildInstructionInput): string {
  const meta = getFrequencyMeta(input.frequencyCode);
  const routeVerb = ROUTE_EN[input.route] ?? "Use";
  const timing = TIMING_EN[input.timingRelation];
  const prnMax = input.prnMaxDailyDoses ?? 3;

  if (input.prnFlag) {
    const parts: string[] = [
      `${routeVerb} ${input.doseAmount} ${input.doseUnit} as needed`,
    ];
    if (input.prnReason) {
      parts[0] += ` for ${input.prnReason}`;
    }
    parts.push(`max ${prnMax} times/day`);
    if (timing) parts.push(timing);
    return parts.join(", ");
  }

  const parts: string[] = [
    `${routeVerb} ${input.doseAmount} ${input.doseUnit}`,
    meta.textEn,
  ];
  const shouldAddTiming =
    timing.length > 0 &&
    !(input.frequencyCode === "QHS" && input.timingRelation === "bedtime");
  if (shouldAddTiming) parts.push(timing);

  return parts.join(", ");
}

// ─── Summary generator ────────────────────────────────────────────────────────

export interface MedicationSummaryItem {
  genericName: string;
  strengthText: string;
  durationDays: number;
}

/**
 * Generate a patient-friendly prescription summary line.
 * Used to populate `prescription.patient_friendly_summary`.
 */
export function buildPrescriptionSummary(
  items: MedicationSummaryItem[],
  daysSupplyTotal: number,
  language: InstructionLanguage = "vi",
): string {
  if (items.length === 0) {
    return language === "vi" ? "Đơn thuốc trống" : "Empty prescription";
  }

  const names = items
    .slice(0, 3)
    .map((i) => `${i.genericName} ${i.strengthText}`)
    .join(", ");
  const suffix = items.length > 3 ? ` +${items.length - 3} loại` : "";

  if (language === "vi") {
    return `${names}${suffix} — ${daysSupplyTotal} ngày`;
  }
  return `${names}${suffix} — ${daysSupplyTotal} days`;
}
