/**
 * View models returned by appointment service functions.
 */

import type {
  AppointmentStatus,
  AppointmentType,
  EntityId,
  FollowUpStatus,
  FollowUpTriggerMode,
  FollowUpType,
  IsoDateTime,
  PreVisitRequirementStatus,
  PreVisitRequirementType,
} from "@thuocare/contracts";

// ─── Pre-visit requirement ────────────────────────────────────────────────────

export interface PreVisitRequirementVM {
  requirementId: EntityId;
  requirementType: PreVisitRequirementType;
  instructionText: string;
  status: PreVisitRequirementStatus;
  createdAt: IsoDateTime;
}

// ─── Appointment detail ───────────────────────────────────────────────────────

export interface AppointmentDetailVM {
  appointmentId: EntityId;
  patientId: EntityId;
  organizationId: EntityId;
  clinicId: EntityId;
  treatmentEpisodeId: EntityId;
  followUpPlanId: EntityId | null;
  doctorId: EntityId | null;
  appointmentType: AppointmentType;
  scheduledStartAt: IsoDateTime;
  scheduledEndAt: IsoDateTime;
  status: AppointmentStatus;
  reasonText: string | null;
  outcomeSummary: string | null;
  createdAt: IsoDateTime;
  requirements: PreVisitRequirementVM[];
}

/** Bucketed appointment list for patient inbox. */
export interface AppointmentListVM {
  upcoming: AppointmentDetailVM[];
  past: AppointmentDetailVM[];
}

// ─── Follow-up plan ───────────────────────────────────────────────────────────

export interface FollowUpPlanDetailVM {
  planId: EntityId;
  patientId: EntityId;
  organizationId: EntityId;
  treatmentEpisodeId: EntityId;
  sourcePrescriptionId: EntityId | null;
  ownerDoctorId: EntityId | null;
  followUpType: FollowUpType;
  triggerMode: FollowUpTriggerMode;
  dueAt: IsoDateTime | null;
  dueWindowStartAt: IsoDateTime | null;
  dueWindowEndAt: IsoDateTime | null;
  requiredBeforeRefill: boolean;
  instructionText: string | null;
  status: FollowUpStatus;
  completedAt: IsoDateTime | null;
  createdAt: IsoDateTime;
}

// ─── Overdue appointment ──────────────────────────────────────────────────────

export interface OverdueAppointmentVM {
  appointmentId: EntityId;
  patientId: EntityId;
  treatmentEpisodeId: EntityId;
  followUpPlanId: EntityId | null;
  doctorId: EntityId | null;
  appointmentType: AppointmentType;
  scheduledStartAt: IsoDateTime;
  /** Full days past scheduled_start_at. */
  daysOverdue: number;
  reasonText: string | null;
}
