/**
 * Doctor workspace view model type definitions.
 *
 * These are the clean, UI-ready shapes returned by workspace services.
 * Raw DB rows are never exposed outside the view-model builder layer.
 *
 * All dates are ISO strings (YYYY-MM-DD or ISO 8601 datetime).
 * All IDs are opaque strings.
 */

import type {
  AppointmentStatus,
  AppointmentType,
  CommunicationPreference,
  EpisodeStatus,
  EpisodeType,
  FollowUpStatus,
  FollowUpType,
  PrescriptionKind,
  PrescriptionStatus,
  RelationshipType,
  RiskTier,
  Sex,
  TreatmentEntityType,
  TreatmentEventType,
} from "@thuocare/contracts";
import type { EntityId, IsoDate, IsoDateTime } from "@thuocare/contracts";

// ─── Doctor workspace context VM ──────────────────────────────────────────────

export interface DoctorWorkspaceContextVM {
  doctorProfileId: EntityId;
  organizationId: EntityId;
  clinicId: EntityId | null;
  displayName: string;
  specialty: string | null;
  title: string | null;
}

// ─── Patient ──────────────────────────────────────────────────────────────────

/** Compact patient row for list displays. */
export interface PatientSummaryVM {
  patientId: EntityId;
  fullName: string;
  /** Age in full years, null if date_of_birth is missing. */
  age: number | null;
  sex: Sex;
  status: string;
  /** ISO datetime of last episode activity, or patient updated_at. */
  lastActivity: IsoDateTime | null;
  /** Highest risk tier among active episodes. */
  riskTier: RiskTier | null;
  activeEpisodeCount: number;
}

/** Caregiver contact summary embedded in patient detail. */
export interface CaregiverSummaryVM {
  caregiverId: EntityId;
  name: string;
  relationship: RelationshipType;
  phone: string | null;
  isPrimary: boolean;
}

/** Full patient detail for doctor view. */
export interface PatientDetailVM {
  patientId: EntityId;
  fullName: string;
  dateOfBirth: IsoDate | null;
  age: number | null;
  sex: Sex;
  phone: string | null;
  email: string | null;
  addressText: string | null;
  preferredLanguage: string | null;
  communicationPreference: CommunicationPreference;
  status: string;
  externalPatientCode: string | null;

  caregivers: CaregiverSummaryVM[];
  activeEpisodes: TreatmentEpisodeVM[];
  latestEncounter: EncounterSummaryVM | null;
  activePrescriptions: PrescriptionSummaryVM[];
  recentEvents: TreatmentEventVM[];
}

// ─── Treatment episode ─────────────────────────────────────────────────────────

/** Compact episode row for list and nested displays. */
export interface TreatmentEpisodeVM {
  episodeId: EntityId;
  patientId: EntityId;
  primaryDoctorId: EntityId | null;
  episodeType: EpisodeType;
  title: string;
  conditionGroup: string | null;
  status: EpisodeStatus;
  startDate: IsoDate;
  targetEndDate: IsoDate | null;
  riskTier: RiskTier;
  nextReviewDueAt: IsoDateTime | null;
  lastActivityAt: IsoDateTime | null;
  /** True when nextReviewDueAt is in the past. */
  isReviewOverdue: boolean;
}

/** Full episode detail including nested clinical data. */
export interface TreatmentEpisodeDetailVM {
  episode: TreatmentEpisodeVM;
  encounters: EncounterSummaryVM[];
  activePrescriptions: PrescriptionSummaryVM[];
  recentPrescriptions: PrescriptionSummaryVM[];
  followUpPlans: FollowUpPlanVM[];
  upcomingAppointments: AppointmentVM[];
}

// ─── Encounter ────────────────────────────────────────────────────────────────

export interface EncounterSummaryVM {
  encounterId: EntityId;
  episodeId: EntityId;
  doctorId: EntityId | null;
  encounterType: string;
  encounterAt: IsoDateTime;
  chiefComplaint: string | null;
  assessmentSummary: string | null;
  planSummary: string | null;
  nextFollowUpRecommendedAt: IsoDateTime | null;
}

// ─── Prescription ─────────────────────────────────────────────────────────────

/** Compact prescription row for list displays. */
export interface PrescriptionSummaryVM {
  prescriptionId: EntityId;
  patientId: EntityId;
  episodeId: EntityId;
  doctorId: EntityId | null;
  prescriptionKind: PrescriptionKind;
  status: PrescriptionStatus;
  issuedAt: IsoDateTime | null;
  effectiveFrom: IsoDate;
  effectiveTo: IsoDate | null;
  daysSupplyTotal: number | null;
  renewalSequenceNo: number;
  itemCount: number;
  patientFriendlySummary: string | null;
}

/** Full prescription detail for doctor view — delegates to Phase 3 view model. */
export interface PrescriptionDetailVM {
  prescriptionId: EntityId;
  patientId: EntityId;
  episodeId: EntityId;
  encounterId: EntityId | null;
  doctorId: EntityId | null;
  prescriptionKind: PrescriptionKind;
  issueSource: string;
  status: PrescriptionStatus;
  issuedAt: IsoDateTime | null;
  effectiveFrom: IsoDate;
  effectiveTo: IsoDate | null;
  daysSupplyTotal: number | null;
  renewalSequenceNo: number;
  clinicalNote: string | null;
  patientFriendlySummary: string | null;
  items: PrescriptionItemVM[];
}

export interface PrescriptionItemVM {
  itemId: EntityId;
  lineNo: number;
  medicationName: string;
  strengthText: string;
  doseAmount: string;
  doseUnit: string;
  route: string;
  frequencyCode: string | null;
  frequencyText: string;
  durationDays: number;
  startDate: IsoDate;
  endDate: IsoDate | null;
  patientInstruction: string;
  quantityPrescribed: string;
  quantityUnit: string;
  isRefillable: boolean;
  status: string;
}

// ─── Follow-up plan ───────────────────────────────────────────────────────────

export interface FollowUpPlanVM {
  planId: EntityId;
  followUpType: FollowUpType;
  status: FollowUpStatus;
  dueAt: IsoDateTime | null;
  requiredBeforeRefill: boolean;
  instructionText: string | null;
  ownerDoctorId: EntityId | null;
  sourcePrescriptionId: EntityId | null;
}

// ─── Appointment ──────────────────────────────────────────────────────────────

export interface AppointmentVM {
  appointmentId: EntityId;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  scheduledStartAt: IsoDateTime;
  scheduledEndAt: IsoDateTime;
  doctorId: EntityId | null;
  reasonText: string | null;
}

// ─── Treatment event ──────────────────────────────────────────────────────────

export interface TreatmentEventVM {
  eventId: EntityId;
  entityType: TreatmentEntityType;
  entityId: EntityId;
  eventType: TreatmentEventType;
  eventAt: IsoDateTime;
  actorType: string;
}

// ─── Doctor dashboard ─────────────────────────────────────────────────────────

export interface DoctorDashboardVM {
  activePatientCount: number;
  activeEpisodeCount: number;
  activePrescriptionCount: number;
  /** Patients with overdue next_review_due_at or episode status "follow_up_due". */
  patientsNeedingAttention: PatientSummaryVM[];
}

// ─── Phase 8: Monitoring view models ─────────────────────────────────────────

export type RiskSeverity = "high" | "medium" | "low";

export type PatientRiskIssueType =
  | "missed_doses"
  | "low_adherence"
  | "near_depletion"
  | "overdue_follow_up";

/** One patient flagged as needing clinical attention. */
export interface PatientRiskVM {
  patientId: EntityId;
  patientName: string;
  issueType: PatientRiskIssueType;
  severity: RiskSeverity;
  /** ISO date of last recorded activity. */
  lastActivityAt: IsoDateTime | null;
  adherenceRate: number | null;
  /** Context detail: e.g. missedCount, daysRemaining, daysOverdue. */
  detail: Record<string, unknown>;
}

/** Dashboard summary aggregating all monitoring signals. */
export interface DashboardSummaryVM {
  totalPatientsInOrg: number;
  activePatientsCount: number;
  activeEpisodesCount: number;
  activePrescriptionsCount: number;
  atRiskPatientsCount: number;
  pendingRefillsCount: number;
  overdueFollowUpsCount: number;
}

/** A single near-depletion alert for a patient's medication. */
export interface DepletionAlertVM {
  patientId: EntityId;
  patientName: string;
  prescriptionItemId: EntityId;
  medicationName: string;
  strengthText: string;
  daysRemaining: number;
  daysSupply: number;
  startDate: IsoDate;
  isRefillable: boolean;
}

/** A single overdue follow-up plan. */
export interface OverdueFollowUpVM {
  planId: EntityId;
  patientId: EntityId;
  patientName: string;
  followUpType: string;
  dueAt: IsoDateTime;
  daysOverdue: number;
  treatmentEpisodeId: EntityId;
  requiredBeforeRefill: boolean;
}

/** A unified priority queue item merging all risk signals for one patient. */
export interface PriorityQueueItemVM {
  patientId: EntityId;
  patientName: string;
  severity: RiskSeverity;
  issueTypes: PatientRiskIssueType[];
  adherenceRate: number | null;
  /** Worst depletion among active items. */
  minDaysRemaining: number | null;
  pendingRefillCount: number;
  overdueFollowUpCount: number;
}

/** Per-patient monitoring drill-down. */
export interface PatientMonitoringDetailVM {
  patientId: EntityId;
  patientName: string;
  adherence: {
    windowDays: number;
    taken: number;
    missed: number;
    skipped: number;
    adherenceRate: number | null;
  };
  nearDepletionItems: DepletionAlertVM[];
  overdueFollowUps: OverdueFollowUpVM[];
  pendingRefillCount: number;
}
