/**
 * Data access for `public.refill_request` and `public.refill_request_item`.
 */

import type {
  CreateRefillRequestInput as DbCreateInput,
  CreateRefillRequestItemInput,
  RefillRequestDetail,
  RefillRequestItemRow,
  RefillRequestRow,
  UpdateRefillRequestInput,
  UpdateRefillRequestItemInput,
} from "@thuocare/contracts";
import { RefillError } from "../errors/refill-errors.js";
import { dbCount, dbInsert, dbInsertMany, dbSelect, dbSelectOne, dbUpdate } from "./db-client.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

const REQUEST_TABLE = "refill_request";
const ITEM_TABLE = "refill_request_item";

// ─── Active/pending statuses ──────────────────────────────────────────────────

export const PENDING_STATUSES: RefillRequestRow["status"][] = [
  "submitted",
  "triaging",
  "awaiting_doctor_review",
];

export const REVIEWABLE_STATUSES: RefillRequestRow["status"][] = [
  "submitted",
  "triaging",
  "awaiting_doctor_review",
];

export const QUEUE_STATUSES: RefillRequestRow["status"][] = [
  "submitted",
  "triaging",
  "awaiting_doctor_review",
];

// ─── Reads ────────────────────────────────────────────────────────────────────

export async function findRefillRequestById(
  client: AnyClient,
  requestId: string,
): Promise<RefillRequestRow | null> {
  try {
    return await dbSelectOne<RefillRequestRow>(
      client,
      REQUEST_TABLE,
      "*",
      (q) => q.eq("id", requestId),
    );
  } catch (err) {
    throw new RefillError("db_read_failed", String(err));
  }
}

export async function findRefillRequestsByPatient(
  client: AnyClient,
  patientId: string,
): Promise<RefillRequestRow[]> {
  try {
    return await dbSelect<RefillRequestRow>(
      client,
      REQUEST_TABLE,
      "*",
      (q) => q.eq("patient_id", patientId).order("submitted_at", { ascending: false }),
    );
  } catch (err) {
    throw new RefillError("db_read_failed", String(err));
  }
}

export async function findRefillRequestsByOrg(
  client: AnyClient,
  organizationId: string,
  statuses?: string[],
): Promise<RefillRequestRow[]> {
  try {
    return await dbSelect<RefillRequestRow>(
      client,
      REQUEST_TABLE,
      "*",
      (q) => {
        let query = q.eq("organization_id", organizationId);
        if (statuses && statuses.length > 0) {
          query = query.in("status", statuses);
        }
        return query.order("submitted_at", { ascending: false });
      },
    );
  } catch (err) {
    throw new RefillError("db_read_failed", String(err));
  }
}

/** Check whether a pending request already exists for this prescription. */
export async function countPendingRequestsByPrescription(
  client: AnyClient,
  prescriptionId: string,
): Promise<number> {
  try {
    return await dbCount(
      client,
      REQUEST_TABLE,
      (q) =>
        q
          .eq("source_prescription_id", prescriptionId)
          .in("status", PENDING_STATUSES),
    );
  } catch (err) {
    throw new RefillError("db_read_failed", String(err));
  }
}

export async function findRefillItemsByRequest(
  client: AnyClient,
  requestId: string,
): Promise<RefillRequestItemRow[]> {
  try {
    return await dbSelect<RefillRequestItemRow>(
      client,
      ITEM_TABLE,
      "*",
      (q) => q.eq("refill_request_id", requestId),
    );
  } catch (err) {
    throw new RefillError("db_read_failed", String(err));
  }
}

export async function findRefillItemsByRequests(
  client: AnyClient,
  requestIds: string[],
): Promise<RefillRequestItemRow[]> {
  if (requestIds.length === 0) return [];
  try {
    return await dbSelect<RefillRequestItemRow>(
      client,
      ITEM_TABLE,
      "*",
      (q) => q.in("refill_request_id", requestIds),
    );
  } catch (err) {
    throw new RefillError("db_read_failed", String(err));
  }
}

/** Count how many refill requests for this item have been approved/fulfilled. */
export async function countApprovedRefillsByPrescriptionItem(
  client: AnyClient,
  prescriptionItemId: string,
): Promise<number> {
  try {
    return await dbCount(
      client,
      ITEM_TABLE,
      (q) =>
        q
          .eq("prescription_item_id", prescriptionItemId)
          .in("status", ["approved"]),
    );
  } catch (err) {
    throw new RefillError("db_read_failed", String(err));
  }
}

// ─── Writes ───────────────────────────────────────────────────────────────────

export async function insertRefillRequest(
  client: AnyClient,
  input: DbCreateInput,
): Promise<RefillRequestRow> {
  try {
    return await dbInsert<RefillRequestRow>(
      client,
      REQUEST_TABLE,
      input as unknown as Record<string, unknown>,
    );
  } catch (err) {
    throw new RefillError("db_write_failed", String(err));
  }
}

export async function insertRefillRequestItems(
  client: AnyClient,
  items: CreateRefillRequestItemInput[],
): Promise<RefillRequestItemRow[]> {
  try {
    return await dbInsertMany<RefillRequestItemRow>(
      client,
      ITEM_TABLE,
      items as unknown as Record<string, unknown>[],
    );
  } catch (err) {
    throw new RefillError("db_write_failed", String(err));
  }
}

export async function updateRefillRequest(
  client: AnyClient,
  requestId: string,
  updates: UpdateRefillRequestInput,
): Promise<RefillRequestRow> {
  try {
    return await dbUpdate<RefillRequestRow>(
      client,
      REQUEST_TABLE,
      updates as unknown as Record<string, unknown>,
      (q) => q.eq("id", requestId),
    );
  } catch (err) {
    throw new RefillError("db_write_failed", String(err));
  }
}

export async function updateRefillRequestItem(
  client: AnyClient,
  itemId: string,
  updates: UpdateRefillRequestItemInput,
): Promise<RefillRequestItemRow> {
  try {
    return await dbUpdate<RefillRequestItemRow>(
      client,
      ITEM_TABLE,
      updates as unknown as Record<string, unknown>,
      (q) => q.eq("id", itemId),
    );
  } catch (err) {
    throw new RefillError("db_write_failed", String(err));
  }
}

// ─── Composite read ───────────────────────────────────────────────────────────

/**
 * Load a refill request with its items in two queries.
 * Returns null if the request is not found.
 */
export async function findRefillRequestDetail(
  client: AnyClient,
  requestId: string,
): Promise<RefillRequestDetail | null> {
  const request = await findRefillRequestById(client, requestId);
  if (!request) return null;

  const items = await findRefillItemsByRequest(client, requestId);

  return { request, items, sourcePrescriptionSummary: null };
}
