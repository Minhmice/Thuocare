/**
 * Data access for prescription items, dose schedules, and medication names —
 * the three building blocks needed to generate a patient's medication timeline.
 *
 * Joins: prescription_item → prescription (for patient_id/org_id)
 *                          → dose_schedule (1:1)
 *                          → medication_master (1:1)
 */

import { AdherenceError } from "../errors/adherence-errors.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

// ─── Shape returned by item-repo ──────────────────────────────────────────────

/**
 * Flat representation of a prescription item enriched with its schedule
 * and medication info. Used as input to the schedule expander.
 */
export interface ActiveItemWithSchedule {
  // prescription_item columns
  itemId: string;
  prescriptionId: string;
  lineNo: number;
  medicationMasterId: string;
  doseAmount: string;
  doseUnit: string;
  frequencyCode: string | null;
  frequencyText: string;
  patientInstruction: string;
  daysSupply: number;
  startDate: string;   // YYYY-MM-DD
  endDate: string | null;
  prnFlag: boolean;
  isRefillable: boolean;
  status: string;

  // from prescription (via join)
  patientId: string;
  organizationId: string;

  // from dose_schedule (null if missing)
  scheduleType: string | null;
  timesPerDay: number | null;
  structuredScheduleJson: unknown;
  firstDoseAt: string | null;
  lastDoseAt: string | null;
  graceWindowMinutes: number | null;
  markMissedAfterMinutes: number | null;

  // from medication_master (via join)
  genericName: string;
  brandName: string | null;
  strengthText: string;
}

// ─── Column list ──────────────────────────────────────────────────────────────

const ITEM_SELECT = `
  id,
  prescription_id,
  line_no,
  medication_master_id,
  dose_amount,
  dose_unit,
  frequency_code,
  frequency_text,
  patient_instruction_text,
  days_supply,
  start_date,
  end_date,
  prn_flag,
  is_refillable,
  status,
  prescription!inner(patient_id, organization_id),
  dose_schedule(
    schedule_type,
    times_per_day,
    structured_schedule_json,
    first_dose_at,
    last_dose_at,
    grace_window_minutes,
    mark_missed_after_minutes
  ),
  medication_master!inner(generic_name, brand_name, strength_text)
`.trim();

// ─── Row mapper ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): ActiveItemWithSchedule {
  const ds = Array.isArray(row.dose_schedule)
    ? (row.dose_schedule[0] ?? null)
    : (row.dose_schedule ?? null);
  const med = row.medication_master ?? {};
  const pres = row.prescription ?? {};

  return {
    itemId: row.id,
    prescriptionId: row.prescription_id,
    lineNo: row.line_no,
    medicationMasterId: row.medication_master_id,
    doseAmount: String(row.dose_amount),
    doseUnit: row.dose_unit,
    frequencyCode: row.frequency_code ?? null,
    frequencyText: row.frequency_text,
    patientInstruction: row.patient_instruction_text,
    daysSupply: row.days_supply,
    startDate: row.start_date,
    endDate: row.end_date ?? null,
    prnFlag: row.prn_flag ?? false,
    isRefillable: row.is_refillable ?? false,
    status: row.status,

    patientId: pres.patient_id,
    organizationId: pres.organization_id,

    scheduleType: ds?.schedule_type ?? null,
    timesPerDay: ds?.times_per_day ?? null,
    structuredScheduleJson: ds?.structured_schedule_json ?? null,
    firstDoseAt: ds?.first_dose_at ?? null,
    lastDoseAt: ds?.last_dose_at ?? null,
    graceWindowMinutes: ds?.grace_window_minutes ?? null,
    markMissedAfterMinutes: ds?.mark_missed_after_minutes ?? null,

    genericName: med.generic_name ?? "Unknown",
    brandName: med.brand_name ?? null,
    strengthText: med.strength_text ?? "",
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Load active non-PRN prescription items for a patient that are active
 * on the given date. Used for timeline generation.
 *
 * Excludes PRN items (they have no fixed schedule to expand).
 */
export async function findActiveItemsForPatientOnDate(
  client: AnyClient,
  patientId: string,
  date: string,
): Promise<ActiveItemWithSchedule[]> {
  try {
    const { data, error } = await client
      .from("prescription_item")
      .select(ITEM_SELECT)
      .eq("prescription.patient_id", patientId)
      .eq("status", "active")
      .eq("prn_flag", false)
      .lte("start_date", date)
      .or(`end_date.is.null,end_date.gte.${date}`);

    if (error) throw new Error(error.message);
    return ((data as unknown[]) ?? []).map(mapRow);
  } catch (err) {
    throw new AdherenceError("db_read_failed", String(err));
  }
}

/**
 * Load active non-PRN prescription items for a patient active within
 * a date range. Used for range timeline generation and processMissedDoses.
 */
export async function findActiveItemsForPatientInRange(
  client: AnyClient,
  patientId: string,
  startDate: string,
  endDate: string,
): Promise<ActiveItemWithSchedule[]> {
  try {
    const { data, error } = await client
      .from("prescription_item")
      .select(ITEM_SELECT)
      .eq("prescription.patient_id", patientId)
      .eq("status", "active")
      .eq("prn_flag", false)
      .lte("start_date", endDate)
      .or(`end_date.is.null,end_date.gte.${startDate}`);

    if (error) throw new Error(error.message);
    return ((data as unknown[]) ?? []).map(mapRow);
  } catch (err) {
    throw new AdherenceError("db_read_failed", String(err));
  }
}

/**
 * Load ALL active prescription items for a patient (including PRN).
 * Used to populate the patient's medication list view.
 */
export async function findAllActiveItemsForPatient(
  client: AnyClient,
  patientId: string,
): Promise<ActiveItemWithSchedule[]> {
  try {
    const { data, error } = await client
      .from("prescription_item")
      .select(ITEM_SELECT)
      .eq("prescription.patient_id", patientId)
      .eq("status", "active");

    if (error) throw new Error(error.message);
    return ((data as unknown[]) ?? []).map(mapRow);
  } catch (err) {
    throw new AdherenceError("db_read_failed", String(err));
  }
}

/**
 * Load active non-PRN items for an entire organization within a date range.
 * Used by processMissedDoses (service_role key, called per org by cron).
 */
export async function findActiveItemsForOrgInRange(
  client: AnyClient,
  organizationId: string,
  startDate: string,
  endDate: string,
): Promise<ActiveItemWithSchedule[]> {
  try {
    const { data, error } = await client
      .from("prescription_item")
      .select(ITEM_SELECT)
      .eq("prescription.organization_id", organizationId)
      .eq("status", "active")
      .eq("prn_flag", false)
      .lte("start_date", endDate)
      .or(`end_date.is.null,end_date.gte.${startDate}`);

    if (error) throw new Error(error.message);
    return ((data as unknown[]) ?? []).map(mapRow);
  } catch (err) {
    throw new AdherenceError("db_read_failed", String(err));
  }
}
