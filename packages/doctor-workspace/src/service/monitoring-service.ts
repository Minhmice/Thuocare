/**
 * Phase 8: Doctor Monitoring Dashboard service.
 *
 * Aggregates patient risk signals from adherence, depletion, follow-ups, and
 * refill data to give doctors a prioritized intervention queue.
 *
 * All functions require a doctor actor scoped to the same organization.
 *
 * Query strategy:
 *  - Single org-wide queries; in-memory aggregation/filtering — no N+1.
 *  - Patient names are batch-loaded once after signal IDs are collected.
 *  - getDoctorDashboard fires all sub-queries in parallel.
 */

import type { AnyActorContext } from "@thuocare/auth";
import { requireDoctorActor } from "@thuocare/auth";

import type {
  GetPatientMonitoringDetailInput,
  GetPatientsNearDepletionInput,
  GetPatientsNeedingAttentionInput,
} from "../domain/types.js";
import type {
  DashboardSummaryVM,
  DepletionAlertVM,
  OverdueFollowUpVM,
  PatientMonitoringDetailVM,
  PatientRiskIssueType,
  PatientRiskVM,
  PriorityQueueItemVM,
  RiskSeverity,
} from "../domain/view-models.js";
import { findActiveEpisodesByOrg } from "../repository/episode-repo.js";
import { countActivePrescriptionsByOrg } from "../repository/prescription-repo.js";
import { findPatientsByOrg } from "../repository/patient-repo.js";
import {
  loadAdherenceStatsByOrg,
  loadActiveItemsForDepletionScan,
  loadOverdueFollowUpsByOrg,
  loadPatientNamesByIds,
} from "../repository/monitoring-repo.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowIsoDateTime(): string {
  return new Date().toISOString().slice(0, 19);
}

function subtractDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function daysDiff(dateA: string, dateB: string): number {
  return Math.round(
    (new Date(`${dateB}T00:00:00`).getTime() - new Date(`${dateA}T00:00:00`).getTime()) /
      86_400_000,
  );
}

function adherenceSeverity(missed: number, adherenceRate: number | null): RiskSeverity {
  if (missed >= 3) return "high";
  if (missed >= 1 || (adherenceRate !== null && adherenceRate < 0.8)) return "medium";
  return "low";
}

function depletionSeverity(daysRemaining: number): RiskSeverity {
  if (daysRemaining <= 2) return "high";
  if (daysRemaining <= 5) return "medium";
  return "low";
}

function worstSeverity(a: RiskSeverity, b: RiskSeverity): RiskSeverity {
  const order: Record<RiskSeverity, number> = { high: 2, medium: 1, low: 0 };
  return order[a] >= order[b] ? a : b;
}

function severityOrder(s: RiskSeverity): number {
  return s === "high" ? 0 : s === "medium" ? 1 : 2;
}

// ─── 8.1 Patients needing attention (adherence-based) ─────────────────────────

/**
 * Return patients with poor adherence over the last N days.
 *
 * Flags patients where:
 *  - missed dose count >= missedThreshold (default 2), OR
 *  - adherence rate < adherenceThreshold (default 80%)
 *
 * Only patients with at least one resolved dose entry are evaluated.
 *
 * @returns PatientRiskVM[] sorted by severity desc, then missed count desc.
 */
export async function getPatientsNeedingAttention(
  client: AnyClient,
  actorCtx: AnyActorContext,
  opts: GetPatientsNeedingAttentionInput = {},
): Promise<PatientRiskVM[]> {
  const actor = requireDoctorActor(actorCtx);
  const orgId = actor.organizationId;

  const windowDays = opts.windowDays ?? 7;
  const missedThreshold = opts.missedThreshold ?? 2;
  const adherenceThreshold = opts.adherenceThreshold ?? 0.8;

  const windowStart = subtractDays(todayIsoDate(), windowDays);
  const stats = await loadAdherenceStatsByOrg(client, orgId, windowStart);

  const flagged = stats.filter(
    (s) =>
      s.missed >= missedThreshold ||
      (s.adherenceRate !== null && s.adherenceRate < adherenceThreshold),
  );

  if (flagged.length === 0) return [];

  const nameMap = await loadPatientNamesByIds(
    client,
    flagged.map((s) => s.patientId),
  );

  return flagged
    .map((s): PatientRiskVM => {
      const issueType: PatientRiskIssueType =
        s.missed >= missedThreshold ? "missed_doses" : "low_adherence";
      return {
        patientId: s.patientId,
        patientName: nameMap.get(s.patientId) ?? "Unknown",
        issueType,
        severity: adherenceSeverity(s.missed, s.adherenceRate),
        lastActivityAt: null,
        adherenceRate: s.adherenceRate,
        detail: { missedCount: s.missed, takenCount: s.taken, windowDays },
      };
    })
    .sort((a, b) => {
      const sd = severityOrder(a.severity) - severityOrder(b.severity);
      if (sd !== 0) return sd;
      const am = (a.detail.missedCount as number) ?? 0;
      const bm = (b.detail.missedCount as number) ?? 0;
      return bm - am;
    });
}

// ─── 8.2 Near depletion patients ──────────────────────────────────────────────

/**
 * Return patients whose active medications are running low.
 *
 * daysRemaining = max(0, days_supply - days_elapsed since start_date)
 * Items with daysRemaining <= thresholdDays are flagged.
 *
 * @returns DepletionAlertVM[] sorted by daysRemaining asc (most urgent first).
 */
export async function getPatientsNearDepletion(
  client: AnyClient,
  actorCtx: AnyActorContext,
  opts: GetPatientsNearDepletionInput = {},
): Promise<DepletionAlertVM[]> {
  const actor = requireDoctorActor(actorCtx);
  const orgId = actor.organizationId;

  const threshold = opts.thresholdDays ?? 5;
  const today = todayIsoDate();

  const items = await loadActiveItemsForDepletionScan(client, orgId, today);

  // Stage 1: compute daysRemaining, collect flagged items (patientName filled later)
  const staged: (Omit<DepletionAlertVM, "patientName"> & { _pid: string })[] = [];

  for (const item of items) {
    const daysElapsed = daysDiff(item.startDate, today);
    const daysRemaining = Math.max(0, item.daysSupply - daysElapsed);
    if (daysRemaining > threshold) continue;

    const medicationName = item.brandName
      ? `${item.genericName} (${item.brandName})`
      : item.genericName;

    staged.push({
      _pid: item.patientId,
      patientId: item.patientId,
      prescriptionItemId: item.prescriptionItemId,
      medicationName,
      strengthText: item.strengthText,
      daysRemaining,
      daysSupply: item.daysSupply,
      startDate: item.startDate,
      isRefillable: item.isRefillable,
    });
  }

  if (staged.length === 0) return [];

  const uniquePatientIds = [...new Set(staged.map((a) => a._pid))];
  const nameMap = await loadPatientNamesByIds(client, uniquePatientIds);

  return staged
    .map(({ _pid, ...rest }): DepletionAlertVM => ({
      ...rest,
      patientName: nameMap.get(_pid) ?? "Unknown",
    }))
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}

// ─── 8.3 Overdue follow-ups ───────────────────────────────────────────────────

/**
 * Return all pending follow-up plans that are past their due_at.
 *
 * @returns OverdueFollowUpVM[] sorted by daysOverdue desc (most overdue first).
 */
export async function getOverdueFollowUps(
  client: AnyClient,
  actorCtx: AnyActorContext,
): Promise<OverdueFollowUpVM[]> {
  const actor = requireDoctorActor(actorCtx);
  const orgId = actor.organizationId;
  const now = nowIsoDateTime();
  const today = todayIsoDate();

  const records = await loadOverdueFollowUpsByOrg(client, orgId, now);
  if (records.length === 0) return [];

  const uniquePatientIds = [...new Set(records.map((r) => r.patientId))];
  const nameMap = await loadPatientNamesByIds(client, uniquePatientIds);

  return records
    .map((r): OverdueFollowUpVM => ({
      planId: r.planId,
      patientId: r.patientId,
      patientName: nameMap.get(r.patientId) ?? "Unknown",
      followUpType: r.followUpType,
      dueAt: r.dueAt,
      daysOverdue: Math.max(0, daysDiff(r.dueAt.slice(0, 10), today)),
      treatmentEpisodeId: r.treatmentEpisodeId,
      requiredBeforeRefill: r.requiredBeforeRefill,
    }))
    .sort((a, b) => b.daysOverdue - a.daysOverdue);
}

// ─── 8.4 Dashboard summary ────────────────────────────────────────────────────

/**
 * Return a full dashboard summary aggregating all monitoring signals.
 *
 * Fires all sub-queries in parallel for performance.
 * Counts are derived from the same data sets used by the detail functions.
 */
export async function getDoctorDashboard(
  client: AnyClient,
  actorCtx: AnyActorContext,
): Promise<{
  summary: DashboardSummaryVM;
  atRiskPatients: PatientRiskVM[];
  nearDepletionAlerts: DepletionAlertVM[];
  overdueFollowUps: OverdueFollowUpVM[];
}> {
  const actor = requireDoctorActor(actorCtx);
  const orgId = actor.organizationId;
  const today = todayIsoDate();
  const now = nowIsoDateTime();
  const windowStart = subtractDays(today, 7);

  const [
    allPatients,
    activeEpisodes,
    activePrescriptionCount,
    adherenceStats,
    depletionItems,
    overdueFollowUpRecords,
  ] = await Promise.all([
    findPatientsByOrg(client, orgId),
    findActiveEpisodesByOrg(client, orgId),
    countActivePrescriptionsByOrg(client, orgId),
    loadAdherenceStatsByOrg(client, orgId, windowStart),
    loadActiveItemsForDepletionScan(client, orgId, today),
    loadOverdueFollowUpsByOrg(client, orgId, now),
  ]);

  // ── Active counts ─────────────────────────────────────────────────────────
  const activePatientIds = new Set(activeEpisodes.map((e) => e.patient_id));
  const activePatientsCount = activePatientIds.size;

  // ── At-risk patients (adherence) ──────────────────────────────────────────
  const flaggedAdherence = adherenceStats.filter(
    (s) => s.missed >= 2 || (s.adherenceRate !== null && s.adherenceRate < 0.8),
  );
  const depletionAlerts: DepletionAlertVM[] = [];
  for (const item of depletionItems) {
    const daysElapsed = daysDiff(item.startDate, today);
    const daysRemaining = Math.max(0, item.daysSupply - daysElapsed);
    if (daysRemaining > 5) continue;
    const medicationName = item.brandName
      ? `${item.genericName} (${item.brandName})`
      : item.genericName;
    depletionAlerts.push({
      patientId: item.patientId,
      patientName: "",
      prescriptionItemId: item.prescriptionItemId,
      medicationName,
      strengthText: item.strengthText,
      daysRemaining,
      daysSupply: item.daysSupply,
      startDate: item.startDate,
      isRefillable: item.isRefillable,
    });
  }

  // ── Collect all unique at-risk patient IDs ────────────────────────────────
  const atRiskIds = new Set([
    ...flaggedAdherence.map((s) => s.patientId),
    ...depletionAlerts.map((a) => a.patientId),
    ...overdueFollowUpRecords.map((r) => r.patientId),
  ]);

  const nameMap = await loadPatientNamesByIds(client, [...atRiskIds]);

  // Enrich depletion alerts with names
  const enrichedDepletion = depletionAlerts
    .map((a) => ({ ...a, patientName: nameMap.get(a.patientId) ?? "Unknown" }))
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  // Build risk VMs from adherence
  const atRiskPatients: PatientRiskVM[] = flaggedAdherence.map((s) => {
    const issueType: PatientRiskIssueType =
      s.missed >= 2 ? "missed_doses" : "low_adherence";
    return {
      patientId: s.patientId,
      patientName: nameMap.get(s.patientId) ?? "Unknown",
      issueType,
      severity: adherenceSeverity(s.missed, s.adherenceRate),
      lastActivityAt: null,
      adherenceRate: s.adherenceRate,
      detail: { missedCount: s.missed, takenCount: s.taken, windowDays: 7 },
    };
  });

  // Build overdue follow-up VMs
  const overdueFollowUps: OverdueFollowUpVM[] = overdueFollowUpRecords.map((r) => ({
    planId: r.planId,
    patientId: r.patientId,
    patientName: nameMap.get(r.patientId) ?? "Unknown",
    followUpType: r.followUpType,
    dueAt: r.dueAt,
    daysOverdue: Math.max(0, daysDiff(r.dueAt.slice(0, 10), today)),
    treatmentEpisodeId: r.treatmentEpisodeId,
    requiredBeforeRefill: r.requiredBeforeRefill,
  }));

  // Count pending refills (requires service-role client; count only)
  // We use a direct count query here to avoid loading the full queue
  let pendingRefillsCount = 0;
  try {
    const { count } = await client
      .from("refill_request")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .in("status", ["submitted", "triaging", "awaiting_doctor_review"]);
    pendingRefillsCount = count ?? 0;
  } catch {
    // best-effort
  }

  const summary: DashboardSummaryVM = {
    totalPatientsInOrg: allPatients.length,
    activePatientsCount,
    activeEpisodesCount: activeEpisodes.length,
    activePrescriptionsCount: activePrescriptionCount,
    atRiskPatientsCount: atRiskIds.size,
    pendingRefillsCount,
    overdueFollowUpsCount: overdueFollowUpRecords.length,
  };

  return { summary, atRiskPatients, nearDepletionAlerts: enrichedDepletion, overdueFollowUps };
}

// ─── 8.5 Priority patient queue ───────────────────────────────────────────────

/**
 * Return a unified priority queue merging all risk signals across patients.
 *
 * Deduplicates patients — each patient appears once with their worst severity
 * and a union of all issue types.
 *
 * Sort order: severity (high→low), then most pending refills, then most overdue days.
 */
export async function getPriorityPatientQueue(
  client: AnyClient,
  actorCtx: AnyActorContext,
): Promise<PriorityQueueItemVM[]> {
  const { atRiskPatients, nearDepletionAlerts, overdueFollowUps } =
    await getDoctorDashboard(client, actorCtx);

  // Merge all signals by patientId
  const byPatient = new Map<
    string,
    {
      patientName: string;
      severity: RiskSeverity;
      issueTypes: Set<PatientRiskIssueType>;
      adherenceRate: number | null;
      minDaysRemaining: number | null;
      overdueFollowUpCount: number;
    }
  >();

  const getOrCreate = (patientId: string, name: string) => {
    if (!byPatient.has(patientId)) {
      byPatient.set(patientId, {
        patientName: name,
        severity: "low",
        issueTypes: new Set(),
        adherenceRate: null,
        minDaysRemaining: null,
        overdueFollowUpCount: 0,
      });
    }
    return byPatient.get(patientId)!;
  };

  for (const risk of atRiskPatients) {
    const entry = getOrCreate(risk.patientId, risk.patientName);
    entry.severity = worstSeverity(entry.severity, risk.severity);
    entry.issueTypes.add(risk.issueType);
    entry.adherenceRate = risk.adherenceRate;
  }

  for (const alert of nearDepletionAlerts) {
    const entry = getOrCreate(alert.patientId, alert.patientName);
    const sev = depletionSeverity(alert.daysRemaining);
    entry.severity = worstSeverity(entry.severity, sev);
    entry.issueTypes.add("near_depletion");
    entry.minDaysRemaining =
      entry.minDaysRemaining === null
        ? alert.daysRemaining
        : Math.min(entry.minDaysRemaining, alert.daysRemaining);
  }

  for (const followUp of overdueFollowUps) {
    const entry = getOrCreate(followUp.patientId, followUp.patientName);
    entry.severity = worstSeverity(entry.severity, "high");
    entry.issueTypes.add("overdue_follow_up");
    entry.overdueFollowUpCount++;
  }

  return Array.from(byPatient.entries())
    .map(([patientId, data]): PriorityQueueItemVM => ({
      patientId,
      patientName: data.patientName,
      severity: data.severity,
      issueTypes: [...data.issueTypes],
      adherenceRate: data.adherenceRate,
      minDaysRemaining: data.minDaysRemaining,
      pendingRefillCount: 0, // enriched separately to avoid per-patient queries
      overdueFollowUpCount: data.overdueFollowUpCount,
    }))
    .sort((a, b) => {
      const sd = severityOrder(a.severity) - severityOrder(b.severity);
      if (sd !== 0) return sd;
      return b.overdueFollowUpCount - a.overdueFollowUpCount;
    });
}

// ─── 8.6 Patient monitoring drill-down ───────────────────────────────────────

/**
 * Return a monitoring-focused view for a single patient.
 *
 * Includes adherence stats, near-depletion items, overdue follow-ups,
 * and pending refill count for this patient.
 */
export async function getPatientMonitoringDetail(
  client: AnyClient,
  actorCtx: AnyActorContext,
  input: GetPatientMonitoringDetailInput,
): Promise<PatientMonitoringDetailVM> {
  const actor = requireDoctorActor(actorCtx);
  const orgId = actor.organizationId;
  const patientId = input.patientId;
  const windowDays = input.adherenceWindowDays ?? 30;
  const depletionThreshold = input.depletionThresholdDays ?? 5;
  const today = todayIsoDate();
  const now = nowIsoDateTime();
  const windowStart = subtractDays(today, windowDays);

  const [adherenceStats, depletionItems, overdueFollowUps, nameMap] = await Promise.all([
    loadAdherenceStatsByOrg(client, orgId, windowStart),
    loadActiveItemsForDepletionScan(client, orgId, today),
    loadOverdueFollowUpsByOrg(client, orgId, now),
    loadPatientNamesByIds(client, [patientId]),
  ]);

  const patientName = nameMap.get(patientId) ?? "Unknown";

  // Adherence for this patient
  const patientAdherence = adherenceStats.find((s) => s.patientId === patientId) ?? {
    taken: 0,
    missed: 0,
    skipped: 0,
    total: 0,
    adherenceRate: null,
  };

  // Depletion alerts for this patient
  const patientDepletion = depletionItems
    .filter((item) => item.patientId === patientId)
    .reduce<DepletionAlertVM[]>((acc, item) => {
      const daysElapsed = daysDiff(item.startDate, today);
      const daysRemaining = Math.max(0, item.daysSupply - daysElapsed);
      if (daysRemaining > depletionThreshold) return acc;
      const medicationName = item.brandName
        ? `${item.genericName} (${item.brandName})`
        : item.genericName;
      acc.push({
        patientId,
        patientName,
        prescriptionItemId: item.prescriptionItemId,
        medicationName,
        strengthText: item.strengthText,
        daysRemaining,
        daysSupply: item.daysSupply,
        startDate: item.startDate,
        isRefillable: item.isRefillable,
      });
      return acc;
    }, [])
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  // Overdue follow-ups for this patient
  const patientOverdue = overdueFollowUps
    .filter((r) => r.patientId === patientId)
    .map((r): OverdueFollowUpVM => ({
      planId: r.planId,
      patientId: r.patientId,
      patientName,
      followUpType: r.followUpType,
      dueAt: r.dueAt,
      daysOverdue: Math.max(0, daysDiff(r.dueAt.slice(0, 10), today)),
      treatmentEpisodeId: r.treatmentEpisodeId,
      requiredBeforeRefill: r.requiredBeforeRefill,
    }));

  // Count pending refills for this patient via a direct count query
  let pendingRefillCount = 0;
  try {
    const { count } = await client
      .from("refill_request")
      .select("id", { count: "exact", head: true })
      .eq("patient_id", patientId)
      .in("status", ["submitted", "triaging", "awaiting_doctor_review"]);
    pendingRefillCount = count ?? 0;
  } catch {
    // best-effort
  }

  return {
    patientId,
    patientName,
    adherence: {
      windowDays,
      taken: patientAdherence.taken,
      missed: patientAdherence.missed,
      skipped: patientAdherence.skipped,
      adherenceRate: patientAdherence.adherenceRate,
    },
    nearDepletionItems: patientDepletion,
    overdueFollowUps: patientOverdue,
    pendingRefillCount,
  };
}
