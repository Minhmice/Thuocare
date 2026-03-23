/**
 * View model builder functions.
 *
 * Transform raw DB row types from @thuocare/contracts into clean,
 * UI-ready view models. No DB access, no business logic — pure mapping.
 *
 * Every builder is a pure function: same inputs → same output.
 */

import type {
  AppointmentRow,
  CaregiverLinkRow,
  DoctorProfileRow,
  EncounterRow,
  FollowUpPlanRow,
  PatientRow,
  PrescriptionRow,
  TreatmentEpisodeRow,
  TreatmentEventRow,
  UserAccountRow,
} from "@thuocare/contracts";
import type { EntityId, IsoDateTime } from "@thuocare/contracts";
import type {
  AppointmentVM,
  CaregiverSummaryVM,
  DoctorDashboardVM,
  DoctorWorkspaceContextVM,
  EncounterSummaryVM,
  FollowUpPlanVM,
  PatientDetailVM,
  PatientSummaryVM,
  PrescriptionDetailVM,
  PrescriptionItemVM,
  PrescriptionSummaryVM,
  TreatmentEpisodeDetailVM,
  TreatmentEpisodeVM,
  TreatmentEventVM,
} from "../domain/view-models.js";
import type { RiskTier } from "@thuocare/contracts";

// ─── Doctor workspace context ─────────────────────────────────────────────────

export function toDoctorWorkspaceContextVM(
  doctorProfile: DoctorProfileRow,
  userAccount: UserAccountRow,
): DoctorWorkspaceContextVM {
  return {
    doctorProfileId: doctorProfile.id,
    organizationId: userAccount.organization_id,
    clinicId: userAccount.clinic_id,
    displayName: doctorProfile.title
      ? `${doctorProfile.title} ${userAccount.full_name}`
      : userAccount.full_name,
    specialty: doctorProfile.specialty,
    title: doctorProfile.title,
  };
}

// ─── Patient ──────────────────────────────────────────────────────────────────

export function toPatientSummaryVM(
  patient: PatientRow,
  activeEpisodes: TreatmentEpisodeRow[],
): PatientSummaryVM {
  const lastActivity = deriveLastActivity(activeEpisodes, patient.updated_at);
  const riskTier = deriveHighestRiskTier(activeEpisodes);

  return {
    patientId: patient.id,
    fullName: patient.full_name,
    age: calculateAge(patient.date_of_birth),
    sex: patient.sex,
    status: patient.status,
    lastActivity,
    riskTier,
    activeEpisodeCount: activeEpisodes.length,
  };
}

export function toPatientDetailVM(input: {
  patient: PatientRow;
  caregivers: CaregiverLinkRow[];
  activeEpisodes: TreatmentEpisodeRow[];
  latestEncounter: EncounterRow | null;
  activePrescriptions: PrescriptionRow[];
  prescriptionItemCounts: Map<EntityId, number>;
  recentEvents: TreatmentEventRow[];
}): PatientDetailVM {
  return {
    patientId: input.patient.id,
    fullName: input.patient.full_name,
    dateOfBirth: input.patient.date_of_birth,
    age: calculateAge(input.patient.date_of_birth),
    sex: input.patient.sex,
    phone: input.patient.phone,
    email: input.patient.email,
    addressText: input.patient.address_text,
    preferredLanguage: input.patient.preferred_language,
    communicationPreference: input.patient.communication_preference,
    status: input.patient.status,
    externalPatientCode: input.patient.external_patient_code,

    caregivers: input.caregivers.map(toCaregiverSummaryVM),
    activeEpisodes: input.activeEpisodes.map(toTreatmentEpisodeVM),
    latestEncounter: input.latestEncounter ? toEncounterSummaryVM(input.latestEncounter) : null,
    activePrescriptions: input.activePrescriptions.map((p) =>
      toPrescriptionSummaryVM(p, input.prescriptionItemCounts.get(p.id) ?? 0),
    ),
    recentEvents: input.recentEvents.map(toTreatmentEventVM),
  };
}

function toCaregiverSummaryVM(row: CaregiverLinkRow): CaregiverSummaryVM {
  return {
    caregiverId: row.id,
    name: row.caregiver_name,
    relationship: row.relationship_type,
    phone: row.phone,
    isPrimary: row.is_primary,
  };
}

// ─── Treatment episode ─────────────────────────────────────────────────────────

export function toTreatmentEpisodeVM(episode: TreatmentEpisodeRow): TreatmentEpisodeVM {
  const isReviewOverdue =
    episode.next_review_due_at !== null &&
    new Date(episode.next_review_due_at) < new Date();

  return {
    episodeId: episode.id,
    patientId: episode.patient_id,
    primaryDoctorId: episode.primary_doctor_id,
    episodeType: episode.episode_type,
    title: episode.title,
    conditionGroup: episode.condition_group,
    status: episode.current_status,
    startDate: episode.start_date,
    targetEndDate: episode.target_end_date,
    riskTier: episode.risk_tier,
    nextReviewDueAt: episode.next_review_due_at,
    lastActivityAt: episode.last_activity_at,
    isReviewOverdue,
  };
}

export function toTreatmentEpisodeDetailVM(input: {
  episode: TreatmentEpisodeRow;
  encounters: EncounterRow[];
  prescriptions: PrescriptionRow[];
  prescriptionItemCounts: Map<EntityId, number>;
  followUpPlans: FollowUpPlanRow[];
  appointments: AppointmentRow[];
}): TreatmentEpisodeDetailVM {
  const active = ["issued", "active"];
  const activePrescriptions = input.prescriptions.filter((p) => active.includes(p.status));
  const recentPrescriptions = input.prescriptions.slice(0, 5);

  const upcomingAppointments = input.appointments.filter(
    (a) => a.status === "scheduled" || a.status === "confirmed",
  );

  return {
    episode: toTreatmentEpisodeVM(input.episode),
    encounters: input.encounters.map(toEncounterSummaryVM),
    activePrescriptions: activePrescriptions.map((p) =>
      toPrescriptionSummaryVM(p, input.prescriptionItemCounts.get(p.id) ?? 0),
    ),
    recentPrescriptions: recentPrescriptions.map((p) =>
      toPrescriptionSummaryVM(p, input.prescriptionItemCounts.get(p.id) ?? 0),
    ),
    followUpPlans: input.followUpPlans.map(toFollowUpPlanVM),
    upcomingAppointments: upcomingAppointments.map(toAppointmentVM),
  };
}

// ─── Encounter ────────────────────────────────────────────────────────────────

export function toEncounterSummaryVM(encounter: EncounterRow): EncounterSummaryVM {
  return {
    encounterId: encounter.id,
    episodeId: encounter.treatment_episode_id,
    doctorId: encounter.doctor_id,
    encounterType: encounter.encounter_type,
    encounterAt: encounter.encounter_at,
    chiefComplaint: encounter.chief_complaint,
    assessmentSummary: encounter.assessment_summary,
    planSummary: encounter.plan_summary,
    nextFollowUpRecommendedAt: encounter.next_follow_up_recommendation_at,
  };
}

// ─── Prescription ─────────────────────────────────────────────────────────────

export function toPrescriptionSummaryVM(
  prescription: PrescriptionRow,
  itemCount: number,
): PrescriptionSummaryVM {
  return {
    prescriptionId: prescription.id,
    patientId: prescription.patient_id,
    episodeId: prescription.treatment_episode_id,
    doctorId: prescription.doctor_id,
    prescriptionKind: prescription.prescription_kind,
    status: prescription.status,
    issuedAt: prescription.issued_at,
    effectiveFrom: prescription.effective_from,
    effectiveTo: prescription.effective_to,
    daysSupplyTotal: prescription.days_supply_total,
    renewalSequenceNo: prescription.renewal_sequence_no,
    itemCount,
    patientFriendlySummary: prescription.patient_friendly_summary,
  };
}

export function toPrescriptionDetailVM(input: {
  prescription: PrescriptionRow;
  items: PrescriptionItemVM[];
}): PrescriptionDetailVM {
  return {
    prescriptionId: input.prescription.id,
    patientId: input.prescription.patient_id,
    episodeId: input.prescription.treatment_episode_id,
    encounterId: input.prescription.encounter_id,
    doctorId: input.prescription.doctor_id,
    prescriptionKind: input.prescription.prescription_kind,
    issueSource: input.prescription.issue_source,
    status: input.prescription.status,
    issuedAt: input.prescription.issued_at,
    effectiveFrom: input.prescription.effective_from,
    effectiveTo: input.prescription.effective_to,
    daysSupplyTotal: input.prescription.days_supply_total,
    renewalSequenceNo: input.prescription.renewal_sequence_no,
    clinicalNote: input.prescription.clinical_note,
    patientFriendlySummary: input.prescription.patient_friendly_summary,
    items: input.items,
  };
}

// ─── Follow-up plan ───────────────────────────────────────────────────────────

function toFollowUpPlanVM(plan: FollowUpPlanRow): FollowUpPlanVM {
  return {
    planId: plan.id,
    followUpType: plan.follow_up_type,
    status: plan.status,
    dueAt: plan.due_at,
    requiredBeforeRefill: plan.required_before_refill,
    instructionText: plan.instruction_text,
    ownerDoctorId: plan.owner_doctor_id,
    sourcePrescriptionId: plan.source_prescription_id,
  };
}

// ─── Appointment ──────────────────────────────────────────────────────────────

function toAppointmentVM(appointment: AppointmentRow): AppointmentVM {
  return {
    appointmentId: appointment.id,
    appointmentType: appointment.appointment_type,
    status: appointment.status,
    scheduledStartAt: appointment.scheduled_start_at,
    scheduledEndAt: appointment.scheduled_end_at,
    doctorId: appointment.doctor_id,
    reasonText: appointment.reason_text,
  };
}

// ─── Treatment event ──────────────────────────────────────────────────────────

function toTreatmentEventVM(event: TreatmentEventRow): TreatmentEventVM {
  return {
    eventId: event.id,
    entityType: event.entity_type,
    entityId: event.entity_id,
    eventType: event.event_type,
    eventAt: event.event_at,
    actorType: event.actor_type,
  };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function toDoctorDashboardVM(input: {
  activePatientCount: number;
  activeEpisodeCount: number;
  activePrescriptionCount: number;
  attentionEpisodes: TreatmentEpisodeRow[];
  patientsById: Map<EntityId, PatientRow>;
  episodesByPatientId: Map<EntityId, TreatmentEpisodeRow[]>;
}): DoctorDashboardVM {
  // Group attention episodes by patient and build summaries (max 10)
  const seenPatients = new Set<EntityId>();
  const attentionPatients: PatientSummaryVM[] = [];

  for (const episode of input.attentionEpisodes) {
    if (seenPatients.has(episode.patient_id)) continue;
    seenPatients.add(episode.patient_id);

    const patient = input.patientsById.get(episode.patient_id);
    if (!patient) continue;

    const patientEpisodes = input.episodesByPatientId.get(episode.patient_id) ?? [];
    attentionPatients.push(toPatientSummaryVM(patient, patientEpisodes));

    if (attentionPatients.length >= 10) break;
  }

  return {
    activePatientCount: input.activePatientCount,
    activeEpisodeCount: input.activeEpisodeCount,
    activePrescriptionCount: input.activePrescriptionCount,
    patientsNeedingAttention: attentionPatients,
  };
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const today = new Date();
  const dob = new Date(`${dateOfBirth}T00:00:00`);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

function deriveLastActivity(
  activeEpisodes: TreatmentEpisodeRow[],
  patientUpdatedAt: IsoDateTime,
): IsoDateTime | null {
  const times = activeEpisodes
    .map((e) => e.last_activity_at ?? e.updated_at)
    .filter(Boolean) as string[];
  if (times.length === 0) return patientUpdatedAt;
  // Return the most recent
  return times.reduce((a, b) => (a > b ? a : b)) as IsoDateTime;
}

const RISK_PRIORITY: Record<RiskTier, number> = { high: 3, medium: 2, low: 1 };

function deriveHighestRiskTier(episodes: TreatmentEpisodeRow[]): RiskTier | null {
  if (episodes.length === 0) return null;
  return episodes.reduce<RiskTier>((highest, e) => {
    return (RISK_PRIORITY[e.risk_tier] ?? 0) > (RISK_PRIORITY[highest] ?? 0)
      ? e.risk_tier
      : highest;
  }, "low");
}
