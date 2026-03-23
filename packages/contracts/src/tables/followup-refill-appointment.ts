import type {
  AppointmentStatus,
  AppointmentType,
  FollowUpStatus,
  FollowUpTriggerMode,
  FollowUpType,
  FulfillmentPreference,
  PreVisitRequirementStatus,
  PreVisitRequirementType,
  RefillRequestItemStatus,
  RefillRequestStatus,
  RefillTriggerSource,
  RequestScope,
  RequestedByType,
} from "../enums.js";
import type { DecimalQuantity, EntityId, IsoDateTime } from "../primitives.js";
import type { PrescriptionSummary } from "./prescription.js";

/** `public.follow_up_plan` */
export interface FollowUpPlanRow {
  id: EntityId;
  organization_id: EntityId;
  patient_id: EntityId;
  treatment_episode_id: EntityId;
  source_prescription_id: EntityId | null;
  owner_doctor_id: EntityId | null;
  follow_up_type: FollowUpType;
  trigger_mode: FollowUpTriggerMode;
  due_at: IsoDateTime | null;
  due_window_start_at: IsoDateTime | null;
  due_window_end_at: IsoDateTime | null;
  required_before_refill: boolean;
  instruction_text: string | null;
  status: FollowUpStatus;
  completed_at: IsoDateTime | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export type FollowUpPlan = FollowUpPlanRow;

export type CreateFollowUpPlanInput = Pick<
  FollowUpPlanRow,
  "organization_id" | "patient_id" | "treatment_episode_id" | "follow_up_type" | "trigger_mode"
> & {
  source_prescription_id?: EntityId | null;
  owner_doctor_id?: EntityId | null;
  due_at?: IsoDateTime | null;
  due_window_start_at?: IsoDateTime | null;
  due_window_end_at?: IsoDateTime | null;
  required_before_refill?: boolean;
  instruction_text?: string | null;
  status?: FollowUpStatus;
  completed_at?: IsoDateTime | null;
};

export type UpdateFollowUpPlanInput = Partial<
  Pick<
    FollowUpPlanRow,
    | "source_prescription_id"
    | "owner_doctor_id"
    | "follow_up_type"
    | "trigger_mode"
    | "due_at"
    | "due_window_start_at"
    | "due_window_end_at"
    | "required_before_refill"
    | "instruction_text"
    | "status"
    | "completed_at"
  >
>;

export type FollowUpPlanSummary = Pick<
  FollowUpPlanRow,
  | "id"
  | "treatment_episode_id"
  | "source_prescription_id"
  | "follow_up_type"
  | "status"
  | "due_at"
  | "required_before_refill"
>;

/** `public.appointment` */
export interface AppointmentRow {
  id: EntityId;
  organization_id: EntityId;
  clinic_id: EntityId;
  patient_id: EntityId;
  treatment_episode_id: EntityId;
  follow_up_plan_id: EntityId | null;
  doctor_id: EntityId | null;
  appointment_type: AppointmentType;
  scheduled_start_at: IsoDateTime;
  scheduled_end_at: IsoDateTime;
  status: AppointmentStatus;
  reason_text: string | null;
  outcome_summary: string | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export type Appointment = AppointmentRow;

export type CreateAppointmentInput = Pick<
  AppointmentRow,
  | "organization_id"
  | "clinic_id"
  | "patient_id"
  | "treatment_episode_id"
  | "appointment_type"
  | "scheduled_start_at"
  | "scheduled_end_at"
> & {
  follow_up_plan_id?: EntityId | null;
  doctor_id?: EntityId | null;
  status?: AppointmentStatus;
  reason_text?: string | null;
  outcome_summary?: string | null;
};

export type UpdateAppointmentInput = Partial<
  Pick<
    AppointmentRow,
    | "clinic_id"
    | "follow_up_plan_id"
    | "doctor_id"
    | "appointment_type"
    | "scheduled_start_at"
    | "scheduled_end_at"
    | "status"
    | "reason_text"
    | "outcome_summary"
  >
>;

export type AppointmentSummary = Pick<
  AppointmentRow,
  | "id"
  | "treatment_episode_id"
  | "follow_up_plan_id"
  | "doctor_id"
  | "appointment_type"
  | "scheduled_start_at"
  | "scheduled_end_at"
  | "status"
>;

/** `public.pre_visit_requirement` */
export interface PreVisitRequirementRow {
  id: EntityId;
  appointment_id: EntityId;
  requirement_type: PreVisitRequirementType;
  instruction_text: string;
  status: PreVisitRequirementStatus;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export type PreVisitRequirement = PreVisitRequirementRow;

export type CreatePreVisitRequirementInput = Pick<
  PreVisitRequirementRow,
  "appointment_id" | "requirement_type" | "instruction_text"
> & {
  status?: PreVisitRequirementStatus;
};

export type UpdatePreVisitRequirementInput = Partial<
  Pick<PreVisitRequirementRow, "requirement_type" | "instruction_text" | "status">
>;

export interface AppointmentDetail {
  appointment: Appointment;
  requirements: PreVisitRequirement[];
}

/** `public.refill_request` */
export interface RefillRequestRow {
  id: EntityId;
  organization_id: EntityId;
  patient_id: EntityId;
  treatment_episode_id: EntityId;
  request_scope: RequestScope;
  source_prescription_id: EntityId;
  requested_by_type: RequestedByType;
  requested_by_ref_id: EntityId | null;
  trigger_source: RefillTriggerSource;
  preferred_fulfillment: FulfillmentPreference;
  patient_comment: string | null;
  status: RefillRequestStatus;
  submitted_at: IsoDateTime;
  triaged_at: IsoDateTime | null;
  reviewed_at: IsoDateTime | null;
  reviewed_by_doctor_id: EntityId | null;
  decision_note: string | null;
  result_prescription_id: EntityId | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export type RefillRequest = RefillRequestRow;

export type CreateRefillRequestInput = Pick<
  RefillRequestRow,
  | "organization_id"
  | "patient_id"
  | "treatment_episode_id"
  | "request_scope"
  | "source_prescription_id"
  | "requested_by_type"
  | "trigger_source"
> & {
  requested_by_ref_id?: EntityId | null;
  preferred_fulfillment?: FulfillmentPreference;
  patient_comment?: string | null;
  status?: RefillRequestStatus;
  submitted_at?: IsoDateTime;
};

export type UpdateRefillRequestInput = Partial<
  Pick<
    RefillRequestRow,
    | "request_scope"
    | "requested_by_type"
    | "requested_by_ref_id"
    | "trigger_source"
    | "preferred_fulfillment"
    | "patient_comment"
    | "status"
    | "triaged_at"
    | "reviewed_at"
    | "reviewed_by_doctor_id"
    | "decision_note"
    | "result_prescription_id"
  >
>;

export type RefillRequestSummary = Pick<
  RefillRequestRow,
  | "id"
  | "patient_id"
  | "treatment_episode_id"
  | "source_prescription_id"
  | "request_scope"
  | "status"
  | "submitted_at"
  | "reviewed_at"
  | "result_prescription_id"
>;

/** `public.refill_request_item` */
export interface RefillRequestItemRow {
  id: EntityId;
  refill_request_id: EntityId;
  prescription_item_id: EntityId;
  requested_quantity: DecimalQuantity | null;
  status: RefillRequestItemStatus;
  approved_quantity: DecimalQuantity | null;
  decision_reason: string | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export type RefillRequestItem = RefillRequestItemRow;

export type CreateRefillRequestItemInput = Pick<
  RefillRequestItemRow,
  "refill_request_id" | "prescription_item_id"
> & {
  requested_quantity?: DecimalQuantity | null;
  status?: RefillRequestItemStatus;
  approved_quantity?: DecimalQuantity | null;
  decision_reason?: string | null;
};

export type UpdateRefillRequestItemInput = Partial<
  Pick<
    RefillRequestItemRow,
    "requested_quantity" | "status" | "approved_quantity" | "decision_reason"
  >
>;

export interface RefillRequestDetail {
  request: RefillRequest;
  items: RefillRequestItem[];
  /** Optional denormalized header for the originating prescription */
  sourcePrescriptionSummary: PrescriptionSummary | null;
}
