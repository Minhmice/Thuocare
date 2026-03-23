/**
 * Read-only access to prescription data needed by the refill module.
 *
 * The refill module does direct DB reads for validation and depletion detection,
 * rather than calling @thuocare/prescription service functions (which require
 * staff actor guards that would be too restrictive for patient-side validation).
 *
 * Write operations (creating the new refill prescription) delegate to
 * @thuocare/prescription service functions.
 */

import type {
  PrescriptionItemRow,
  PrescriptionRow,
  RefillPolicySnapshotRow,
} from "@thuocare/contracts";
import { RefillError } from "../errors/refill-errors.js";
import { dbSelect, dbSelectOne } from "./db-client.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

// ─── Prescription reads ───────────────────────────────────────────────────────

export async function findPrescriptionById(
  client: AnyClient,
  prescriptionId: string,
): Promise<PrescriptionRow | null> {
  try {
    return await dbSelectOne<PrescriptionRow>(
      client,
      "prescription",
      "*",
      (q) => q.eq("id", prescriptionId),
    );
  } catch (err) {
    throw new RefillError("db_read_failed", String(err));
  }
}

export async function findActiveItemsByPrescription(
  client: AnyClient,
  prescriptionId: string,
): Promise<PrescriptionItemRow[]> {
  try {
    return await dbSelect<PrescriptionItemRow>(
      client,
      "prescription_item",
      "*",
      (q) =>
        q
          .eq("prescription_id", prescriptionId)
          .eq("status", "active")
          .order("line_no", { ascending: true }),
    );
  } catch (err) {
    throw new RefillError("db_read_failed", String(err));
  }
}

export async function findItemsByIds(
  client: AnyClient,
  itemIds: string[],
): Promise<PrescriptionItemRow[]> {
  if (itemIds.length === 0) return [];
  try {
    return await dbSelect<PrescriptionItemRow>(
      client,
      "prescription_item",
      "*",
      (q) => q.in("id", itemIds).order("line_no", { ascending: true }),
    );
  } catch (err) {
    throw new RefillError("db_read_failed", String(err));
  }
}

export async function findRefillPolicyByItem(
  client: AnyClient,
  prescriptionItemId: string,
): Promise<RefillPolicySnapshotRow | null> {
  try {
    return await dbSelectOne<RefillPolicySnapshotRow>(
      client,
      "refill_policy_snapshot",
      "*",
      (q) => q.eq("prescription_item_id", prescriptionItemId),
    );
  } catch (err) {
    throw new RefillError("db_read_failed", String(err));
  }
}

export async function findRefillPoliciesByItems(
  client: AnyClient,
  prescriptionItemIds: string[],
): Promise<RefillPolicySnapshotRow[]> {
  if (prescriptionItemIds.length === 0) return [];
  try {
    return await dbSelect<RefillPolicySnapshotRow>(
      client,
      "refill_policy_snapshot",
      "*",
      (q) => q.in("prescription_item_id", prescriptionItemIds),
    );
  } catch (err) {
    throw new RefillError("db_read_failed", String(err));
  }
}

// ─── Near depletion: active items for a patient ───────────────────────────────

/**
 * Flat shape used for depletion detection.
 * Joins: prescription_item → prescription (for patient_id/org/episode)
 *                          → medication_master (for name)
 *                          → refill_policy_snapshot (for policy)
 */
export interface DepletionCheckItem {
  itemId: string;
  prescriptionId: string;
  treatmentEpisodeId: string;
  organizationId: string;
  daysSupply: number;
  startDate: string;
  endDate: string | null;
  isRefillable: boolean;
  frequencyText: string;
  status: string;
  prescriptionStatus: string;
  genericName: string;
  brandName: string | null;
  strengthText: string;
  refillMode: string | null;
  absoluteExpiryDate: string | null;
  minDaysBetweenRefills: number | null;
  maxRefillsAllowed: number;
}

const DEPLETION_SELECT = `
  id,
  prescription_id,
  days_supply,
  start_date,
  end_date,
  is_refillable,
  max_refills_allowed,
  frequency_text,
  status,
  prescription!inner(
    patient_id,
    treatment_episode_id,
    organization_id,
    status
  ),
  medication_master!inner(generic_name, brand_name, strength_text),
  refill_policy_snapshot(
    refill_mode,
    absolute_expiry_date,
    min_days_between_refills,
    max_refills_allowed
  )
`.trim();

export async function findActiveItemsForDepletionCheck(
  client: AnyClient,
  patientId: string,
): Promise<DepletionCheckItem[]> {
  try {
    const { data, error } = await client
      .from("prescription_item")
      .select(DEPLETION_SELECT)
      .eq("prescription.patient_id", patientId)
      .eq("status", "active")
      .eq("is_refillable", true)
      .eq("prn_flag", false);

    if (error) throw new Error(error.message);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data as unknown[]) ?? []).map((row: any) => {
      const pres = row.prescription ?? {};
      const med = row.medication_master ?? {};
      const policy = Array.isArray(row.refill_policy_snapshot)
        ? (row.refill_policy_snapshot[0] ?? null)
        : (row.refill_policy_snapshot ?? null);

      return {
        itemId: row.id,
        prescriptionId: row.prescription_id,
        treatmentEpisodeId: pres.treatment_episode_id,
        organizationId: pres.organization_id,
        daysSupply: row.days_supply,
        startDate: row.start_date,
        endDate: row.end_date ?? null,
        isRefillable: row.is_refillable ?? false,
        maxRefillsAllowed: row.max_refills_allowed ?? 0,
        frequencyText: row.frequency_text,
        status: row.status,
        prescriptionStatus: pres.status,
        genericName: med.generic_name ?? "Unknown",
        brandName: med.brand_name ?? null,
        strengthText: med.strength_text ?? "",
        refillMode: policy?.refill_mode ?? null,
        absoluteExpiryDate: policy?.absolute_expiry_date ?? null,
        minDaysBetweenRefills: policy?.min_days_between_refills ?? null,
      };
    });
  } catch (err) {
    throw new RefillError("db_read_failed", String(err));
  }
}

// ─── Queue: patient names for refill requests ─────────────────────────────────

export interface PatientNameRow {
  id: string;
  full_name: string;
}

export async function findPatientNamesByIds(
  client: AnyClient,
  patientIds: string[],
): Promise<PatientNameRow[]> {
  if (patientIds.length === 0) return [];
  try {
    return await dbSelect<PatientNameRow>(
      client,
      "patient",
      "id, full_name",
      (q) => q.in("id", patientIds),
    );
  } catch (err) {
    throw new RefillError("db_read_failed", String(err));
  }
}

// ─── Queue: prescription item + medication info for refill items ──────────────

export interface QueueItemMedicationRow {
  id: string;           // prescription_item.id
  days_supply: number;
  start_date: string;
  generic_name: string;
  brand_name: string | null;
  strength_text: string;
}

export async function findItemMedicationsForQueue(
  client: AnyClient,
  prescriptionItemIds: string[],
): Promise<QueueItemMedicationRow[]> {
  if (prescriptionItemIds.length === 0) return [];
  try {
    const { data, error } = await client
      .from("prescription_item")
      .select(
        "id, days_supply, start_date, medication_master!inner(generic_name, brand_name, strength_text)",
      )
      .in("id", prescriptionItemIds);

    if (error) throw new Error(error.message);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data as unknown[]) ?? []).map((row: any) => ({
      id: row.id,
      days_supply: row.days_supply,
      start_date: row.start_date,
      generic_name: row.medication_master?.generic_name ?? "Unknown",
      brand_name: row.medication_master?.brand_name ?? null,
      strength_text: row.medication_master?.strength_text ?? "",
    }));
  } catch (err) {
    throw new RefillError("db_read_failed", String(err));
  }
}
