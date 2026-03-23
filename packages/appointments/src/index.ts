/**
 * @thuocare/appointments — Appointment & Revisit System (Phase 9)
 *
 * Completes the treatment loop: Prescription → Adherence → Refill → Revisit
 *
 * QUICK REFERENCE:
 *
 * Doctor — create & manage:
 *   createFollowUpPlan(client, actorCtx, input)
 *   createAppointment(client, actorCtx, input)
 *   getDoctorAppointments(client, actorCtx, input?)
 *   updateAppointmentStatus(client, actorCtx, input)
 *   rescheduleAppointment(client, actorCtx, input)
 *   addPreVisitRequirement(client, actorCtx, input)
 *   completeFollowUpPlan(client, actorCtx, input)
 *   detectOverdueAppointments(client, actorCtx)
 *
 * Patient — read:
 *   getPatientAppointments(client, actorCtx, input)
 *   getAppointmentDetail(client, actorCtx, appointmentId)
 *
 * Notification integration:
 *   Phase 7's generateAppointmentReminders() cron picks up new appointments
 *   automatically — no explicit call needed here.
 */

// ─── Errors ───────────────────────────────────────────────────────────────────

export { AppointmentError, isAppointmentError } from "./errors/appointment-errors.js";
export type { AppointmentErrorCode } from "./errors/appointment-errors.js";

// ─── Domain types ─────────────────────────────────────────────────────────────

export type {
  AddPreVisitRequirementInput,
  CompleteFollowUpPlanInput,
  CreateAppointmentInput,
  CreateFollowUpPlanInput,
  GetDoctorAppointmentsInput,
  GetPatientAppointmentsInput,
  RescheduleAppointmentInput,
  UpdateAppointmentStatusInput,
} from "./domain/types.js";

// ─── View models ──────────────────────────────────────────────────────────────

export type {
  AppointmentDetailVM,
  AppointmentListVM,
  FollowUpPlanDetailVM,
  OverdueAppointmentVM,
  PreVisitRequirementVM,
} from "./domain/view-models.js";

// ─── Doctor service ───────────────────────────────────────────────────────────

export {
  createFollowUpPlan,
  createAppointment,
  getDoctorAppointments,
  updateAppointmentStatus,
  rescheduleAppointment,
  addPreVisitRequirement,
  completeFollowUpPlan,
  detectOverdueAppointments,
} from "./service/doctor-appointment-service.js";

// ─── Patient service ──────────────────────────────────────────────────────────

export {
  getPatientAppointments,
  getAppointmentDetail,
} from "./service/patient-appointment-service.js";
