/**
 * Data loading for notification triggers.
 *
 * Each trigger function needs a different slice of data. This module provides
 * focused queries for each trigger type. All queries are intended to run with
 * service_role (bypasses RLS) since they scan org-wide data.
 *
 * Uses the same join pattern as @thuocare/adherence item-repo, but scoped to
 * an organization (for cron jobs processing an entire org at a time).
 */

import type { ActiveItemWithSchedule } from "@thuocare/adherence";
import { NotificationError } from "../errors/notification-errors.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

// ─── Active items for dose/refill triggers ────────────────────────────────────

const TRIGGER_ITEM_SELECT = `
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTriggerItem(row: any): ActiveItemWithSchedule {
  const ds = Array.isArray(row.dose_schedule)
    ? (row.dose_schedule[0] ?? null)
    : (row.dose_schedule ?? null);
  const med = row.medication_master ?? {};
  const pres = row.prescription ?? {};

  return {
    itemId: row.id,
    prescriptionId: row.prescription_id,
    lineNo: row.line_no ?? 1,
    medicationMasterId: row.medication_master_id,
    doseAmount: String(row.dose_amount),
    doseUnit: row.dose_unit,
    frequencyCode: row.frequency_code ?? null,
    frequencyText: row.frequency_text,
    patientInstruction: row.patient_instruction_text ?? "",
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

/**
 * Load active non-PRN items for an entire organization on a specific date.
 * Used by dose reminder + refill reminder triggers.
 */
export async function loadActiveItemsForOrg(
  client: AnyClient,
  organizationId: string,
  date: string,
): Promise<ActiveItemWithSchedule[]> {
  try {
    const { data, error } = await client
      .from("prescription_item")
      .select(TRIGGER_ITEM_SELECT)
      .eq("prescription.organization_id", organizationId)
      .eq("status", "active")
      .eq("prn_flag", false)
      .lte("start_date", date)
      .or(`end_date.is.null,end_date.gte.${date}`);

    if (error) throw new Error(error.message);
    return ((data as unknown[]) ?? []).map(mapTriggerItem);
  } catch (err) {
    throw new NotificationError("db_read_failed", String(err));
  }
}

// ─── Missed dose data ─────────────────────────────────────────────────────────

export interface MissedDoseRow {
  id: string;
  patient_id: string;
  organization_id: string;
  prescription_item_id: string;
  scheduled_time: string;
  scheduled_date: string;
  generic_name: string;
  brand_name: string | null;
  strength_text: string;
}

const MISSED_DOSE_SELECT = `
  id,
  patient_id,
  organization_id,
  prescription_item_id,
  scheduled_time,
  scheduled_date,
  prescription_item!inner(
    medication_master!inner(generic_name, brand_name, strength_text)
  )
`.trim();

/**
 * Load recently-created 'missed' adherence log entries for an organization.
 * Used by the missed dose notification trigger.
 */
export async function loadRecentMissedDoses(
  client: AnyClient,
  organizationId: string,
  sinceTime: string,
): Promise<MissedDoseRow[]> {
  try {
    const { data, error } = await client
      .from("medication_adherence_log")
      .select(MISSED_DOSE_SELECT)
      .eq("organization_id", organizationId)
      .eq("status", "missed")
      .gte("updated_at", sinceTime);

    if (error) throw new Error(error.message);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data as unknown[]) ?? []).map((row: any) => {
      const pi = row.prescription_item ?? {};
      const med = pi.medication_master ?? {};
      return {
        id: row.id,
        patient_id: row.patient_id,
        organization_id: row.organization_id,
        prescription_item_id: row.prescription_item_id,
        scheduled_time: row.scheduled_time,
        scheduled_date: row.scheduled_date,
        generic_name: med.generic_name ?? "Unknown",
        brand_name: med.brand_name ?? null,
        strength_text: med.strength_text ?? "",
      };
    });
  } catch (err) {
    throw new NotificationError("db_read_failed", String(err));
  }
}

// ─── Appointment data ─────────────────────────────────────────────────────────

export interface UpcomingAppointmentRow {
  id: string;
  patient_id: string;
  organization_id: string;
  appointment_type: string;
  scheduled_start_at: string;
  doctor_id: string | null;
}

/**
 * Load upcoming appointments for an organization within a date window.
 * Used by the appointment reminder trigger.
 */
export async function loadUpcomingAppointments(
  client: AnyClient,
  organizationId: string,
  fromDate: string,
  toDate: string,
): Promise<UpcomingAppointmentRow[]> {
  try {
    const { data, error } = await client
      .from("appointment")
      .select("id, patient_id, organization_id, appointment_type, scheduled_start_at, doctor_id")
      .eq("organization_id", organizationId)
      .in("status", ["scheduled", "confirmed"])
      .gte("scheduled_start_at", `${fromDate}T00:00:00`)
      .lte("scheduled_start_at", `${toDate}T23:59:59`);

    if (error) throw new Error(error.message);
    return (data ?? []) as UpcomingAppointmentRow[];
  } catch (err) {
    throw new NotificationError("db_read_failed", String(err));
  }
}
