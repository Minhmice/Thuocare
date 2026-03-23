/**
 * Data access for `public.medication_adherence_log`.
 */

import type { CreateAdherenceLogInput, MedicationAdherenceLogRow } from "../domain/types.js";
import { AdherenceError } from "../errors/adherence-errors.js";
import { dbInsertMany, dbSelect, dbUpdate, dbUpsert } from "./db-client.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

const TABLE = "medication_adherence_log";

// ─── Reads ────────────────────────────────────────────────────────────────────

/** Load all adherence log rows for a patient on a specific date. */
export async function findLogsByPatientAndDate(
  client: AnyClient,
  patientId: string,
  date: string,
): Promise<MedicationAdherenceLogRow[]> {
  try {
    return await dbSelect<MedicationAdherenceLogRow>(
      client,
      TABLE,
      "*",
      (q) => q.eq("patient_id", patientId).eq("scheduled_date", date),
    );
  } catch (err) {
    throw new AdherenceError("db_read_failed", String(err));
  }
}

/** Load all adherence log rows for a patient within a date range (inclusive). */
export async function findLogsByPatientAndDateRange(
  client: AnyClient,
  patientId: string,
  startDate: string,
  endDate: string,
): Promise<MedicationAdherenceLogRow[]> {
  try {
    return await dbSelect<MedicationAdherenceLogRow>(
      client,
      TABLE,
      "*",
      (q) =>
        q
          .eq("patient_id", patientId)
          .gte("scheduled_date", startDate)
          .lte("scheduled_date", endDate),
    );
  } catch (err) {
    throw new AdherenceError("db_read_failed", String(err));
  }
}

/**
 * Load adherence logs for specific prescription items within a date range.
 * Used by processMissedDoses to find which slots already have entries.
 */
export async function findLogsByItemsAndDateRange(
  client: AnyClient,
  prescriptionItemIds: string[],
  startDate: string,
  endDate: string,
): Promise<MedicationAdherenceLogRow[]> {
  if (prescriptionItemIds.length === 0) return [];
  try {
    return await dbSelect<MedicationAdherenceLogRow>(
      client,
      TABLE,
      "*",
      (q) =>
        q
          .in("prescription_item_id", prescriptionItemIds)
          .gte("scheduled_date", startDate)
          .lte("scheduled_date", endDate),
    );
  } catch (err) {
    throw new AdherenceError("db_read_failed", String(err));
  }
}

/**
 * Load adherence logs for an organization where status = 'scheduled'
 * and scheduled_time < cutoffTime. Used by processMissedDoses.
 */
export async function findUnresolvedScheduledLogs(
  client: AnyClient,
  organizationId: string,
  cutoffTime: string,
): Promise<MedicationAdherenceLogRow[]> {
  try {
    return await dbSelect<MedicationAdherenceLogRow>(
      client,
      TABLE,
      "*",
      (q) =>
        q
          .eq("organization_id", organizationId)
          .eq("status", "scheduled")
          .lt("scheduled_time", cutoffTime),
    );
  } catch (err) {
    throw new AdherenceError("db_read_failed", String(err));
  }
}

// ─── Writes ───────────────────────────────────────────────────────────────────

/**
 * Upsert a single adherence log entry.
 * Conflict target: (prescription_item_id, scheduled_time).
 * Used for mark-taken and mark-skipped.
 */
export async function upsertAdherenceLog(
  client: AnyClient,
  row: CreateAdherenceLogInput,
): Promise<MedicationAdherenceLogRow> {
  try {
    return await dbUpsert<MedicationAdherenceLogRow>(
      client,
      TABLE,
      row as unknown as Record<string, unknown>,
      "prescription_item_id,scheduled_time",
    );
  } catch (err) {
    throw new AdherenceError("db_write_failed", String(err));
  }
}

/**
 * Batch insert missed dose log entries.
 * Called by processMissedDoses (service_role key).
 */
export async function insertMissedDoseLogs(
  client: AnyClient,
  rows: CreateAdherenceLogInput[],
): Promise<number> {
  if (rows.length === 0) return 0;
  try {
    return await dbInsertMany(
      client,
      TABLE,
      rows as unknown as Record<string, unknown>[],
    );
  } catch (err) {
    throw new AdherenceError("db_write_failed", String(err));
  }
}

/**
 * Mark pre-registered 'scheduled' log rows as 'missed'.
 * Used when the system pre-registers doses (scheduled status in DB).
 */
export async function markLogsAsMissed(
  client: AnyClient,
  logIds: string[],
): Promise<number> {
  if (logIds.length === 0) return 0;
  try {
    const updated = await dbUpdate<MedicationAdherenceLogRow>(
      client,
      TABLE,
      { status: "missed", source: "system" },
      (q) => q.in("id", logIds),
    );
    return updated.length;
  } catch (err) {
    throw new AdherenceError("db_write_failed", String(err));
  }
}
