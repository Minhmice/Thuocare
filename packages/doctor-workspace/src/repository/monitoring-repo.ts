/**
 * Data access layer for Phase 8 monitoring queries.
 *
 * All queries are org-scoped and designed for fast batch reads.
 * Aggregation is done in-memory after a single filtered query (no N+1).
 */

import { WorkspaceError } from "../errors/workspace-errors.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

// ─── Adherence stats ──────────────────────────────────────────────────────────

export interface PatientAdherenceStats {
  patientId: string;
  taken: number;
  missed: number;
  skipped: number;
  total: number;
  /** null when total === 0 */
  adherenceRate: number | null;
}

/**
 * Load and aggregate adherence log entries for an entire org over a date window.
 *
 * Single query; in-memory GROUP BY patient_id.
 * Only counts 'taken', 'missed', 'skipped' rows — ignores 'scheduled' (not yet resolved).
 */
export async function loadAdherenceStatsByOrg(
  client: AnyClient,
  organizationId: string,
  windowStartDate: string,
): Promise<PatientAdherenceStats[]> {
  try {
    const { data, error } = await client
      .from("medication_adherence_log")
      .select("patient_id,status")
      .eq("organization_id", organizationId)
      .gte("scheduled_date", windowStartDate)
      .in("status", ["taken", "missed", "skipped"]);

    if (error) throw new Error(error.message);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (data as any[]) ?? [];
    const byPatient = new Map<string, { taken: number; missed: number; skipped: number }>();

    for (const row of rows) {
      const pid: string = row.patient_id;
      const cur = byPatient.get(pid) ?? { taken: 0, missed: 0, skipped: 0 };
      if (row.status === "taken") cur.taken++;
      else if (row.status === "missed") cur.missed++;
      else if (row.status === "skipped") cur.skipped++;
      byPatient.set(pid, cur);
    }

    return Array.from(byPatient.entries()).map(([patientId, counts]) => {
      const total = counts.taken + counts.missed + counts.skipped;
      // adherenceRate = taken / (taken + missed) — excludes skipped (intentional doses)
      const denominator = counts.taken + counts.missed;
      return {
        patientId,
        ...counts,
        total,
        adherenceRate: denominator > 0 ? counts.taken / denominator : null,
      };
    });
  } catch (err) {
    throw new WorkspaceError("db_read_failed", String(err));
  }
}

// ─── Depletion scan ───────────────────────────────────────────────────────────

export interface DepletionScanItem {
  prescriptionItemId: string;
  patientId: string;
  genericName: string;
  brandName: string | null;
  strengthText: string;
  startDate: string;
  daysSupply: number;
  isRefillable: boolean;
}

const DEPLETION_SELECT = `
  id,
  start_date,
  end_date,
  days_supply,
  is_refillable,
  prn_flag,
  status,
  prescription!inner(patient_id),
  medication_master!inner(generic_name, brand_name, strength_text)
`.trim();

/**
 * Load active, non-PRN prescription items for an org to check depletion.
 * Filter: status='active', prn_flag=false, start_date <= today, end_date null or >= today.
 */
export async function loadActiveItemsForDepletionScan(
  client: AnyClient,
  organizationId: string,
  today: string,
): Promise<DepletionScanItem[]> {
  try {
    const { data, error } = await client
      .from("prescription_item")
      .select(DEPLETION_SELECT)
      .eq("prescription.organization_id", organizationId)
      .eq("status", "active")
      .eq("prn_flag", false)
      .lte("start_date", today)
      .or(`end_date.is.null,end_date.gte.${today}`);

    if (error) throw new Error(error.message);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data as unknown[]) ?? []).map((row: any) => {
      const pres = row.prescription ?? {};
      const med = row.medication_master ?? {};
      return {
        prescriptionItemId: row.id,
        patientId: pres.patient_id,
        genericName: med.generic_name ?? "Unknown",
        brandName: med.brand_name ?? null,
        strengthText: med.strength_text ?? "",
        startDate: row.start_date,
        daysSupply: row.days_supply,
        isRefillable: row.is_refillable ?? false,
      };
    });
  } catch (err) {
    throw new WorkspaceError("db_read_failed", String(err));
  }
}

// ─── Overdue follow-ups ───────────────────────────────────────────────────────

export interface OverdueFollowUpRecord {
  planId: string;
  patientId: string;
  followUpType: string;
  dueAt: string;
  treatmentEpisodeId: string;
  requiredBeforeRefill: boolean;
}

/**
 * Load overdue follow-up plans (planned/due) with due_at in the past.
 */
export async function loadOverdueFollowUpsByOrg(
  client: AnyClient,
  organizationId: string,
  now: string,
): Promise<OverdueFollowUpRecord[]> {
  try {
    const { data, error } = await client
      .from("follow_up_plan")
      .select("id,patient_id,follow_up_type,due_at,treatment_episode_id,required_before_refill")
      .eq("organization_id", organizationId)
      .in("status", ["planned", "due"])
      .not("due_at", "is", null)
      .lt("due_at", now)
      .order("due_at", { ascending: true });

    if (error) throw new Error(error.message);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data as unknown[]) ?? []).map((row: any) => ({
      planId: row.id,
      patientId: row.patient_id,
      followUpType: row.follow_up_type,
      dueAt: row.due_at,
      treatmentEpisodeId: row.treatment_episode_id,
      requiredBeforeRefill: row.required_before_refill ?? false,
    }));
  } catch (err) {
    throw new WorkspaceError("db_read_failed", String(err));
  }
}

// ─── Patient name batch load ──────────────────────────────────────────────────

/**
 * Batch load patient id → full_name map for a set of patient IDs.
 * Used to enrich risk signals with display names.
 */
export async function loadPatientNamesByIds(
  client: AnyClient,
  patientIds: string[],
): Promise<Map<string, string>> {
  if (patientIds.length === 0) return new Map();
  try {
    const { data, error } = await client
      .from("patient")
      .select("id,full_name")
      .in("id", patientIds);

    if (error) throw new Error(error.message);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Map(((data as any[]) ?? []).map((r) => [r.id as string, r.full_name as string]));
  } catch (err) {
    throw new WorkspaceError("db_read_failed", String(err));
  }
}
