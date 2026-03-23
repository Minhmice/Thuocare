import type {
  DoseScheduleType,
  PrescriptionItemStatus,
  PrescriptionKind,
  PrescriptionSource,
  PrescriptionStatus,
  RefillMode,
  Route,
  TimingRelation,
  TimezoneMode,
} from "../enums.js";
import type { DecimalQuantity, EntityId, IsoDate, IsoDateTime, JsonValue, Ratio } from "../primitives.js";

/** `public.prescription` */
export interface PrescriptionRow {
  id: EntityId;
  organization_id: EntityId;
  clinic_id: EntityId;
  patient_id: EntityId;
  treatment_episode_id: EntityId;
  encounter_id: EntityId | null;
  doctor_id: EntityId | null;
  parent_prescription_id: EntityId | null;
  prescription_kind: PrescriptionKind;
  issue_source: PrescriptionSource;
  status: PrescriptionStatus;
  issued_at: IsoDateTime | null;
  effective_from: IsoDate;
  effective_to: IsoDate | null;
  days_supply_total: number | null;
  renewal_sequence_no: number;
  clinical_note: string | null;
  patient_friendly_summary: string | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export type Prescription = PrescriptionRow;

export type CreatePrescriptionInput = Pick<
  PrescriptionRow,
  | "organization_id"
  | "clinic_id"
  | "patient_id"
  | "treatment_episode_id"
  | "prescription_kind"
  | "issue_source"
  | "effective_from"
> & {
  encounter_id?: EntityId | null;
  doctor_id?: EntityId | null;
  parent_prescription_id?: EntityId | null;
  status?: PrescriptionStatus;
  issued_at?: IsoDateTime | null;
  effective_to?: IsoDate | null;
  days_supply_total?: number | null;
  renewal_sequence_no?: number;
  clinical_note?: string | null;
  patient_friendly_summary?: string | null;
};

export type UpdatePrescriptionInput = Partial<
  Pick<
    PrescriptionRow,
    | "encounter_id"
    | "doctor_id"
    | "parent_prescription_id"
    | "prescription_kind"
    | "issue_source"
    | "status"
    | "issued_at"
    | "effective_from"
    | "effective_to"
    | "days_supply_total"
    | "renewal_sequence_no"
    | "clinical_note"
    | "patient_friendly_summary"
  >
>;

export type PrescriptionSummary = Pick<
  PrescriptionRow,
  | "id"
  | "patient_id"
  | "treatment_episode_id"
  | "encounter_id"
  | "doctor_id"
  | "prescription_kind"
  | "status"
  | "issued_at"
  | "effective_from"
  | "effective_to"
  | "renewal_sequence_no"
>;

/** `public.prescription_item` */
export interface PrescriptionItemRow {
  id: EntityId;
  prescription_id: EntityId;
  line_no: number;
  medication_master_id: EntityId;
  indication_text: string | null;
  dose_amount: DecimalQuantity;
  dose_unit: string;
  route: Route;
  frequency_code: string | null;
  frequency_text: string;
  timing_relation: TimingRelation;
  administration_instruction_text: string;
  patient_instruction_text: string;
  prn_flag: boolean;
  prn_reason: string | null;
  quantity_prescribed: DecimalQuantity;
  quantity_unit: string;
  days_supply: number;
  start_date: IsoDate;
  end_date: IsoDate | null;
  is_refillable: boolean;
  max_refills_allowed: number;
  requires_review_before_refill: boolean;
  high_risk_review_flag: boolean;
  status: PrescriptionItemStatus;
  stop_reason: string | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export type PrescriptionItem = PrescriptionItemRow;

export type CreatePrescriptionItemInput = Pick<
  PrescriptionItemRow,
  | "prescription_id"
  | "line_no"
  | "medication_master_id"
  | "dose_amount"
  | "dose_unit"
  | "route"
  | "frequency_text"
  | "administration_instruction_text"
  | "patient_instruction_text"
  | "quantity_prescribed"
  | "quantity_unit"
  | "days_supply"
  | "start_date"
> & {
  indication_text?: string | null;
  frequency_code?: string | null;
  timing_relation?: TimingRelation;
  prn_flag?: boolean;
  prn_reason?: string | null;
  end_date?: IsoDate | null;
  is_refillable?: boolean;
  max_refills_allowed?: number;
  requires_review_before_refill?: boolean;
  high_risk_review_flag?: boolean;
  status?: PrescriptionItemStatus;
  stop_reason?: string | null;
};

export type UpdatePrescriptionItemInput = Partial<
  Pick<
    PrescriptionItemRow,
    | "line_no"
    | "medication_master_id"
    | "indication_text"
    | "dose_amount"
    | "dose_unit"
    | "route"
    | "frequency_code"
    | "frequency_text"
    | "timing_relation"
    | "administration_instruction_text"
    | "patient_instruction_text"
    | "prn_flag"
    | "prn_reason"
    | "quantity_prescribed"
    | "quantity_unit"
    | "days_supply"
    | "start_date"
    | "end_date"
    | "is_refillable"
    | "max_refills_allowed"
    | "requires_review_before_refill"
    | "high_risk_review_flag"
    | "status"
    | "stop_reason"
  >
>;

export type PrescriptionItemSummary = Pick<
  PrescriptionItemRow,
  | "id"
  | "prescription_id"
  | "line_no"
  | "medication_master_id"
  | "dose_amount"
  | "dose_unit"
  | "route"
  | "frequency_text"
  | "prn_flag"
  | "status"
  | "start_date"
  | "end_date"
  | "is_refillable"
>;

/** `public.dose_schedule` */
export interface DoseScheduleRow {
  id: EntityId;
  prescription_item_id: EntityId;
  schedule_type: DoseScheduleType;
  timezone_mode: TimezoneMode;
  times_per_day: number | null;
  structured_schedule_json: JsonValue;
  first_dose_at: IsoDateTime | null;
  last_dose_at: IsoDateTime | null;
  grace_window_minutes: number;
  mark_missed_after_minutes: number;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export type DoseSchedule = DoseScheduleRow;

export type CreateDoseScheduleInput = Pick<DoseScheduleRow, "prescription_item_id" | "schedule_type"> & {
  timezone_mode?: TimezoneMode;
  times_per_day?: number | null;
  structured_schedule_json?: JsonValue;
  first_dose_at?: IsoDateTime | null;
  last_dose_at?: IsoDateTime | null;
  grace_window_minutes?: number;
  mark_missed_after_minutes?: number;
};

export type UpdateDoseScheduleInput = Partial<
  Pick<
    DoseScheduleRow,
    | "schedule_type"
    | "timezone_mode"
    | "times_per_day"
    | "structured_schedule_json"
    | "first_dose_at"
    | "last_dose_at"
    | "grace_window_minutes"
    | "mark_missed_after_minutes"
  >
>;

/** `public.refill_policy_snapshot` */
export interface RefillPolicySnapshotRow {
  id: EntityId;
  prescription_item_id: EntityId;
  refill_mode: RefillMode;
  max_refills_allowed: number;
  min_days_between_refills: number | null;
  earliest_refill_ratio: Ratio | null;
  review_required_after_date: IsoDate | null;
  absolute_expiry_date: IsoDate | null;
  late_refill_escalation_after_days: number | null;
  notes: string | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export type RefillPolicySnapshot = RefillPolicySnapshotRow;

export type CreateRefillPolicySnapshotInput = Pick<
  RefillPolicySnapshotRow,
  "prescription_item_id" | "refill_mode"
> & {
  max_refills_allowed?: number;
  min_days_between_refills?: number | null;
  earliest_refill_ratio?: Ratio | null;
  review_required_after_date?: IsoDate | null;
  absolute_expiry_date?: IsoDate | null;
  late_refill_escalation_after_days?: number | null;
  notes?: string | null;
};

export type UpdateRefillPolicySnapshotInput = Partial<
  Pick<
    RefillPolicySnapshotRow,
    | "refill_mode"
    | "max_refills_allowed"
    | "min_days_between_refills"
    | "earliest_refill_ratio"
    | "review_required_after_date"
    | "absolute_expiry_date"
    | "late_refill_escalation_after_days"
    | "notes"
  >
>;

/** Nested read model: line + 1:1 schedule + 1:1 refill policy */
export interface PrescriptionItemDetail {
  item: PrescriptionItem;
  doseSchedule: DoseSchedule | null;
  refillPolicy: RefillPolicySnapshot | null;
}

export interface PrescriptionDetail {
  prescription: Prescription;
  items: PrescriptionItemDetail[];
}
