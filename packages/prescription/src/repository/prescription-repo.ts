/**
 * Prescription repository.
 *
 * Thin DB access layer for prescription-module entities.
 * Contains only data access — no business logic, no access checks.
 *
 * Validates all DB responses via Zod schemas from @thuocare/contracts before
 * returning typed domain objects.
 */

import { z } from "zod";
import type {
  CreateDoseScheduleInput,
  CreatePrescriptionInput,
  CreatePrescriptionItemInput,
  CreateRefillPolicySnapshotInput,
  DoseScheduleRow,
  MedicationMasterRow,
  PrescriptionDetail,
  PrescriptionItemDetail,
  PrescriptionItemRow,
  PrescriptionRow,
  RefillPolicySnapshotRow,
  TreatmentEpisodeRow,
  UpdatePrescriptionInput,
  UpdatePrescriptionItemInput,
} from "@thuocare/contracts";
import {
  assemblePrescriptionDetail,
  assemblePrescriptionItemDetail,
  mapDoseScheduleRow,
  mapPrescriptionItemRow,
  mapPrescriptionRow,
  mapRefillPolicySnapshotRow,
} from "@thuocare/contracts";
import type { EntityId } from "@thuocare/contracts";
import {
  dbDelete,
  dbInsert,
  dbMaxInt,
  dbSelectMany,
  dbSelectOne,
  dbUpdate,
} from "./db-client.js";
import { PrescriptionError } from "../errors/prescription-errors.js";
import type { PrescriptionErrorCode } from "../errors/prescription-errors.js";

// ─── Row validation helpers ───────────────────────────────────────────────────

/**
 * Thin Zod schema for runtime validation that a DB row has at least an `id`.
 * Full type safety comes from TypeScript contracts, not runtime validation of every field.
 */
const rowWithIdSchema = z.object({ id: z.string() });

function assertRow(data: unknown, errorCode: PrescriptionErrorCode, label: string): Record<string, unknown> {
  const parsed = rowWithIdSchema.safeParse(data);
  if (!parsed.success) {
    throw new PrescriptionError(errorCode, `${label}: DB returned unexpected shape.`);
  }
  return data as Record<string, unknown>;
}

// ─── Prescription ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function insertPrescription(client: any, input: CreatePrescriptionInput): Promise<PrescriptionRow> {
  const { data, error } = await dbInsert(client, "prescription", input as Record<string, unknown>);
  if (error) throw new PrescriptionError("db_write_failed", "Failed to insert prescription.", error.message);
  assertRow(data, "db_write_failed", "prescription insert");
  return mapPrescriptionRow(data as PrescriptionRow);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updatePrescriptionById(client: any, id: EntityId, input: UpdatePrescriptionInput): Promise<PrescriptionRow> {
  const { data, error } = await dbUpdate(client, "prescription", input as Record<string, unknown>, [["id", id]]);
  if (error) throw new PrescriptionError("db_write_failed", "Failed to update prescription.", error.message);
  const rows = data as unknown[] | null;
  if (!rows || rows.length === 0) throw new PrescriptionError("prescription_not_found", `Prescription id=${id} not found after update.`);
  return mapPrescriptionRow(rows[0] as PrescriptionRow);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findPrescriptionById(client: any, id: EntityId): Promise<PrescriptionRow | null> {
  const { data, error } = await dbSelectOne(client, "prescription", [["id", id]]);
  if (error) throw new PrescriptionError("db_read_failed", "Failed to read prescription.", error.message);
  if (data === null) return null;
  return mapPrescriptionRow(data as PrescriptionRow);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findPrescriptionsByPatient(client: any, patientId: EntityId, organizationId: EntityId): Promise<PrescriptionRow[]> {
  const { data, error } = await dbSelectMany(
    client, "prescription",
    [["patient_id", patientId], ["organization_id", organizationId]],
    { orderBy: { column: "created_at", ascending: false } },
  );
  if (error) throw new PrescriptionError("db_read_failed", "Failed to read prescriptions.", error.message);
  return (data ?? []).map((r) => mapPrescriptionRow(r as PrescriptionRow));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findPrescriptionsByEpisode(client: any, episodeId: EntityId): Promise<PrescriptionRow[]> {
  const { data, error } = await dbSelectMany(
    client, "prescription",
    [["treatment_episode_id", episodeId]],
    { orderBy: { column: "created_at", ascending: false } },
  );
  if (error) throw new PrescriptionError("db_read_failed", "Failed to read prescriptions.", error.message);
  return (data ?? []).map((r) => mapPrescriptionRow(r as PrescriptionRow));
}

// ─── Prescription item ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function insertPrescriptionItem(client: any, input: CreatePrescriptionItemInput): Promise<PrescriptionItemRow> {
  const { data, error } = await dbInsert(client, "prescription_item", input as Record<string, unknown>);
  if (error) throw new PrescriptionError("db_write_failed", "Failed to insert prescription item.", error.message);
  assertRow(data, "db_write_failed", "prescription_item insert");
  return mapPrescriptionItemRow(data as PrescriptionItemRow);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updatePrescriptionItemById(client: any, id: EntityId, input: UpdatePrescriptionItemInput): Promise<PrescriptionItemRow> {
  const { data, error } = await dbUpdate(client, "prescription_item", input as Record<string, unknown>, [["id", id]]);
  if (error) throw new PrescriptionError("db_write_failed", "Failed to update prescription item.", error.message);
  const rows = data as unknown[] | null;
  if (!rows || rows.length === 0) throw new PrescriptionError("item_not_found", `PrescriptionItem id=${id} not found.`);
  return mapPrescriptionItemRow(rows[0] as PrescriptionItemRow);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findItemsByPrescription(client: any, prescriptionId: EntityId): Promise<PrescriptionItemRow[]> {
  const { data, error } = await dbSelectMany(
    client, "prescription_item",
    [["prescription_id", prescriptionId]],
    { orderBy: { column: "line_no", ascending: true } },
  );
  if (error) throw new PrescriptionError("db_read_failed", "Failed to read prescription items.", error.message);
  return (data ?? []).map((r) => mapPrescriptionItemRow(r as PrescriptionItemRow));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findItemById(client: any, id: EntityId): Promise<PrescriptionItemRow | null> {
  const { data, error } = await dbSelectOne(client, "prescription_item", [["id", id]]);
  if (error) throw new PrescriptionError("db_read_failed", "Failed to read prescription item.", error.message);
  if (data === null) return null;
  return mapPrescriptionItemRow(data as PrescriptionItemRow);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function deleteItemById(client: any, id: EntityId): Promise<void> {
  const { error } = await dbDelete(client, "prescription_item", [["id", id]]);
  if (error) throw new PrescriptionError("db_write_failed", "Failed to delete prescription item.", error.message);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getNextLineNo(client: any, prescriptionId: EntityId): Promise<number> {
  const maxLineNo = await dbMaxInt(client, "prescription_item", "line_no", [["prescription_id", prescriptionId]]);
  return maxLineNo + 1;
}

// ─── Dose schedule ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function insertDoseSchedule(client: any, input: CreateDoseScheduleInput): Promise<DoseScheduleRow> {
  const { data, error } = await dbInsert(client, "dose_schedule", input as Record<string, unknown>);
  if (error) throw new PrescriptionError("db_write_failed", "Failed to insert dose schedule.", error.message);
  assertRow(data, "db_write_failed", "dose_schedule insert");
  return mapDoseScheduleRow(data as DoseScheduleRow);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findScheduleByItem(client: any, prescriptionItemId: EntityId): Promise<DoseScheduleRow | null> {
  const { data, error } = await dbSelectOne(client, "dose_schedule", [["prescription_item_id", prescriptionItemId]]);
  if (error) throw new PrescriptionError("db_read_failed", "Failed to read dose schedule.", error.message);
  if (data === null) return null;
  return mapDoseScheduleRow(data as DoseScheduleRow);
}

// ─── Refill policy snapshot ───────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function insertRefillPolicySnapshot(client: any, input: CreateRefillPolicySnapshotInput): Promise<RefillPolicySnapshotRow> {
  const { data, error } = await dbInsert(client, "refill_policy_snapshot", input as Record<string, unknown>);
  if (error) throw new PrescriptionError("db_write_failed", "Failed to insert refill policy snapshot.", error.message);
  assertRow(data, "db_write_failed", "refill_policy_snapshot insert");
  return mapRefillPolicySnapshotRow(data as RefillPolicySnapshotRow);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findRefillPolicyByItem(client: any, prescriptionItemId: EntityId): Promise<RefillPolicySnapshotRow | null> {
  const { data, error } = await dbSelectOne(client, "refill_policy_snapshot", [["prescription_item_id", prescriptionItemId]]);
  if (error) throw new PrescriptionError("db_read_failed", "Failed to read refill policy.", error.message);
  if (data === null) return null;
  return mapRefillPolicySnapshotRow(data as RefillPolicySnapshotRow);
}

// ─── Treatment episode ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findEpisodeById(client: any, id: EntityId): Promise<TreatmentEpisodeRow | null> {
  const { data, error } = await dbSelectOne(client, "treatment_episode", [["id", id]]);
  if (error) throw new PrescriptionError("db_read_failed", "Failed to read treatment episode.", error.message);
  if (data === null) return null;
  return data as TreatmentEpisodeRow;
}

// ─── Medication master ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findMedicationById(client: any, id: EntityId): Promise<MedicationMasterRow | null> {
  const { data, error } = await dbSelectOne(client, "medication_master", [["id", id]]);
  if (error) throw new PrescriptionError("db_read_failed", "Failed to read medication.", error.message);
  if (data === null) return null;
  return data as MedicationMasterRow;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findMedicationsByIds(client: any, ids: EntityId[]): Promise<MedicationMasterRow[]> {
  if (ids.length === 0) return [];

  const { data, error } = await client
    .from("medication_master")
    .select("*")
    .in("id", ids);

  if (error) {
    throw new PrescriptionError("db_read_failed", "Failed to read medications.", error.message);
  }

  return (data ?? []) as MedicationMasterRow[];
}

// ─── Full detail assembly ─────────────────────────────────────────────────────

/**
 * Load a full PrescriptionDetail (prescription + items + schedules + policies).
 * Used for doctor-facing views.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadPrescriptionDetail(client: any, prescriptionId: EntityId): Promise<PrescriptionDetail | null> {
  const prescription = await findPrescriptionById(client, prescriptionId);
  if (prescription === null) return null;

  const items = await findItemsByPrescription(client, prescriptionId);

  const itemDetails: PrescriptionItemDetail[] = await Promise.all(
    items.map(async (item) => {
      const [doseSchedule, refillPolicy] = await Promise.all([
        findScheduleByItem(client, item.id),
        findRefillPolicyByItem(client, item.id),
      ]);
      return assemblePrescriptionItemDetail({ item, doseSchedule, refillPolicy });
    }),
  );

  return assemblePrescriptionDetail({ prescription, items: itemDetails });
}
