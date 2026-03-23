import type {
  Appointment,
  AppointmentDetail,
  AppointmentRow,
  FollowUpPlan,
  FollowUpPlanRow,
  PreVisitRequirement,
  PreVisitRequirementRow,
  RefillRequest,
  RefillRequestDetail,
  RefillRequestItem,
  RefillRequestItemRow,
  RefillRequestRow,
} from "../tables/followup-refill-appointment.js";
import type { PrescriptionSummary } from "../tables/prescription.js";

export function mapFollowUpPlanRow(row: FollowUpPlanRow): FollowUpPlan {
  return { ...row };
}

export function mapAppointmentRow(row: AppointmentRow): Appointment {
  return { ...row };
}

export function mapPreVisitRequirementRow(row: PreVisitRequirementRow): PreVisitRequirement {
  return { ...row };
}

export function assembleAppointmentDetail(input: {
  appointment: Appointment;
  requirements: PreVisitRequirement[];
}): AppointmentDetail {
  return { appointment: input.appointment, requirements: input.requirements };
}

export function mapRefillRequestRow(row: RefillRequestRow): RefillRequest {
  return { ...row };
}

export function mapRefillRequestItemRow(row: RefillRequestItemRow): RefillRequestItem {
  return { ...row };
}

export function assembleRefillRequestDetail(input: {
  request: RefillRequest;
  items: RefillRequestItem[];
  sourcePrescriptionSummary: PrescriptionSummary | null;
}): RefillRequestDetail {
  return {
    request: input.request,
    items: input.items,
    sourcePrescriptionSummary: input.sourcePrescriptionSummary,
  };
}
