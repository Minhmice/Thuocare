/**
 * Quantity calculator.
 *
 * Computes the total quantity to prescribe for a medication item based on:
 * - dose per administration (doseAmount)
 * - doses per day (from frequencyCode)
 * - duration in days
 *
 * DESIGN: Pure functions — no DB calls, deterministic.
 *
 * ROUNDING RULES:
 * - Tablets, capsules → round UP to nearest integer (never dispense partial units).
 * - Liquids, creams, injections → keep one decimal place.
 * - PRN items → compute maximum (maxDailyDoses × durationDays), mark as estimate.
 * - QOD → doses = ceil(durationDays / 2).
 * - QW → doses = ceil(durationDays / 7).
 */

import type { DosageForm } from "@thuocare/contracts";
import type { FrequencyCode, QuantityCalculation } from "../domain/types.js";
import { parseFrequencyCode } from "../schedule/frequency.js";

// ─── Dosage form classification ───────────────────────────────────────────────

const UNIT_FORMS: DosageForm[] = ["tablet", "capsule"];

function isUnitDosageForm(form: DosageForm): boolean {
  return UNIT_FORMS.includes(form);
}

// ─── Dose count by frequency ──────────────────────────────────────────────────

/**
 * Calculate the total number of doses for a given frequency and duration.
 * For PRN this returns maxDailyDoses × durationDays (maximum estimate).
 */
function totalDoseCount(
  frequencyCode: FrequencyCode,
  durationDays: number,
  prnMaxDailyDoses: number,
): number {
  const meta = parseFrequencyCode(frequencyCode);
  if (meta === null) {
    throw new Error(`Unknown frequency code: ${frequencyCode}`);
  }

  if (meta.isPrn) {
    return prnMaxDailyDoses * durationDays;
  }

  if (frequencyCode === "QOD") {
    return Math.ceil(durationDays / 2);
  }

  if (frequencyCode === "QW") {
    return Math.ceil(durationDays / 7);
  }

  // For interval-based (Q8H, Q12H) and fixed-daily, dosesPerDay is the count
  return Math.round(meta.dosesPerDay * durationDays);
}

// ─── Main calculator ──────────────────────────────────────────────────────────

export interface CalculateQuantityInput {
  doseAmount: string;         // Decimal string, e.g., "1", "0.5", "10"
  doseUnit: string;           // e.g., "viên", "ml", "ống"
  frequencyCode: FrequencyCode;
  durationDays: number;
  dosageForm: DosageForm;
  /** Maximum daily doses for PRN items. Defaults to 3. */
  prnMaxDailyDoses?: number;
}

/**
 * Calculate the total quantity to prescribe.
 *
 * Returns a `QuantityCalculation` with the computed quantity as a decimal string
 * (matching PostgreSQL numeric(12,4) format), plus the unit and days supply.
 */
export function calculateQuantity(
  input: CalculateQuantityInput,
): QuantityCalculation {
  const doseAmountNum = parseFloat(input.doseAmount);

  if (Number.isNaN(doseAmountNum) || doseAmountNum <= 0) {
    throw new Error(`Invalid doseAmount: ${input.doseAmount}. Must be a positive number.`);
  }
  if (input.durationDays <= 0 || !Number.isInteger(input.durationDays)) {
    throw new Error(`Invalid durationDays: ${input.durationDays}. Must be a positive integer.`);
  }

  const meta = parseFrequencyCode(input.frequencyCode);
  if (meta === null) {
    throw new Error(`Unknown frequency code: ${input.frequencyCode}`);
  }
  const prnMax = input.prnMaxDailyDoses ?? 3;
  const totalDoses = totalDoseCount(input.frequencyCode, input.durationDays, prnMax);
  const rawQuantity = doseAmountNum * totalDoses;

  let quantity: number;
  if (isUnitDosageForm(input.dosageForm)) {
    // Tablets and capsules: always round up — never under-dispense
    quantity = Math.ceil(rawQuantity);
  } else {
    // Liquids/injectables: one decimal place
    quantity = Math.round(rawQuantity * 10) / 10;
  }

  // Format as decimal string with 4 decimal places for DB storage
  const quantityStr = quantity.toFixed(4);

  return {
    quantityPrescribed: quantityStr,
    quantityUnit: input.doseUnit,
    daysSupply: input.durationDays,
    isEstimate: meta.isPrn,
  };
}

/**
 * Calculate days supply from a total quantity and doses-per-day.
 * Used to back-calculate when quantity is known but duration is not.
 */
export function calculateDaysSupply(
  totalQuantity: string,
  doseAmount: string,
  frequencyCode: FrequencyCode,
): number {
  const qty = parseFloat(totalQuantity);
  const dose = parseFloat(doseAmount);
  const meta = parseFrequencyCode(frequencyCode);
  if (meta === null) {
    throw new Error(`Unknown frequency code: ${frequencyCode}`);
  }

  if (meta.isPrn || meta.dosesPerDay === 0) {
    // Cannot reliably back-calculate days from PRN quantity
    return 0;
  }

  const dosesPerDay = meta.dosesPerDay;
  const daysRaw = qty / (dose * dosesPerDay);
  return Math.floor(daysRaw);
}
