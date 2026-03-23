/**
 * Service-layer input types for the appointments module.
 */

import type {
  AppointmentStatus,
  AppointmentType,
  EntityId,
  FollowUpTriggerMode,
  FollowUpType,
  IsoDateTime,
  PreVisitRequirementType,
} from "@thuocare/contracts";

// ─── Follow-up plan inputs ─────────────────────────────────────────────────────

export interface CreateFollowUpPlanInput {
  patientId: EntityId;
  treatmentEpisodeId: EntityId;
  followUpType: FollowUpType;
  triggerMode: FollowUpTriggerMode;
  dueAt?: IsoDateTime | null;
  dueWindowStartAt?: IsoDateTime | null;
  dueWindowEndAt?: IsoDateTime | null;
  requiredBeforeRefill?: boolean;
  instructionText?: string | null;
  sourcePrescriptionId?: EntityId | null;
}

export interface CompleteFollowUpPlanInput {
  planId: EntityId;
  completedAt?: IsoDateTime;
}

// ─── Appointment inputs ────────────────────────────────────────────────────────

export interface CreateAppointmentInput {
  patientId: EntityId;
  treatmentEpisodeId: EntityId;
  clinicId: EntityId;
  appointmentType: AppointmentType;
  scheduledStartAt: IsoDateTime;
  scheduledEndAt: IsoDateTime;
  followUpPlanId?: EntityId | null;
  /** Defaults to actor's doctorProfileId. */
  doctorId?: EntityId | null;
  reasonText?: string | null;
}

export interface UpdateAppointmentStatusInput {
  appointmentId: EntityId;
  status: AppointmentStatus;
  outcomeSummary?: string | null;
  /**
   * When completing an appointment linked to a follow-up plan,
   * set this to true to auto-complete the plan. Default: true.
   */
  autoCompleteFollowUpPlan?: boolean;
}

export interface RescheduleAppointmentInput {
  appointmentId: EntityId;
  scheduledStartAt: IsoDateTime;
  scheduledEndAt: IsoDateTime;
  reasonText?: string | null;
}

export interface AddPreVisitRequirementInput {
  appointmentId: EntityId;
  requirementType: PreVisitRequirementType;
  instructionText: string;
}

// ─── Query inputs ──────────────────────────────────────────────────────────────

export interface GetPatientAppointmentsInput {
  patientId: EntityId;
  /** Max per bucket. Default: 20. */
  limit?: number;
}

export interface GetDoctorAppointmentsInput {
  /** Scope to a specific doctor. Defaults to actor's doctorProfileId. */
  doctorId?: EntityId | null;
  /** ISO date lower bound on scheduled_start_at. */
  fromDate?: string;
  /** ISO date upper bound on scheduled_start_at. */
  toDate?: string;
  statuses?: AppointmentStatus[];
  limit?: number;
}
