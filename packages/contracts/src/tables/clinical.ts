import type { DiagnosisStatus, EncounterType, EpisodeStatus, EpisodeType, RiskTier } from "../enums.js";
import type { EntityId, IsoDate, IsoDateTime } from "../primitives.js";

/** `public.treatment_episode` */
export interface TreatmentEpisodeRow {
  id: EntityId;
  organization_id: EntityId;
  clinic_id: EntityId;
  patient_id: EntityId;
  primary_doctor_id: EntityId | null;
  episode_type: EpisodeType;
  condition_group: string | null;
  title: string;
  clinical_summary: string | null;
  start_date: IsoDate;
  target_end_date: IsoDate | null;
  current_status: EpisodeStatus;
  risk_tier: RiskTier;
  next_review_due_at: IsoDateTime | null;
  last_activity_at: IsoDateTime | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export type TreatmentEpisode = TreatmentEpisodeRow;

export type CreateTreatmentEpisodeInput = Pick<
  TreatmentEpisodeRow,
  | "organization_id"
  | "clinic_id"
  | "patient_id"
  | "episode_type"
  | "title"
  | "start_date"
> & {
  primary_doctor_id?: EntityId | null;
  condition_group?: string | null;
  clinical_summary?: string | null;
  target_end_date?: IsoDate | null;
  current_status?: EpisodeStatus;
  risk_tier?: RiskTier;
  next_review_due_at?: IsoDateTime | null;
  last_activity_at?: IsoDateTime | null;
};

export type UpdateTreatmentEpisodeInput = Partial<
  Pick<
    TreatmentEpisodeRow,
    | "clinic_id"
    | "primary_doctor_id"
    | "episode_type"
    | "condition_group"
    | "title"
    | "clinical_summary"
    | "start_date"
    | "target_end_date"
    | "current_status"
    | "risk_tier"
    | "next_review_due_at"
    | "last_activity_at"
  >
>;

export type TreatmentEpisodeSummary = Pick<
  TreatmentEpisodeRow,
  | "id"
  | "organization_id"
  | "clinic_id"
  | "patient_id"
  | "primary_doctor_id"
  | "episode_type"
  | "title"
  | "start_date"
  | "target_end_date"
  | "current_status"
  | "risk_tier"
  | "next_review_due_at"
  | "last_activity_at"
>;

/** `public.encounter` */
export interface EncounterRow {
  id: EntityId;
  organization_id: EntityId;
  clinic_id: EntityId;
  patient_id: EntityId;
  treatment_episode_id: EntityId;
  doctor_id: EntityId | null;
  encounter_type: EncounterType;
  encounter_at: IsoDateTime;
  chief_complaint: string | null;
  assessment_summary: string | null;
  plan_summary: string | null;
  next_follow_up_recommendation_at: IsoDateTime | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export type Encounter = EncounterRow;

export type CreateEncounterInput = Pick<
  EncounterRow,
  | "organization_id"
  | "clinic_id"
  | "patient_id"
  | "treatment_episode_id"
  | "encounter_type"
  | "encounter_at"
> & {
  doctor_id?: EntityId | null;
  chief_complaint?: string | null;
  assessment_summary?: string | null;
  plan_summary?: string | null;
  next_follow_up_recommendation_at?: IsoDateTime | null;
};

export type UpdateEncounterInput = Partial<
  Pick<
    EncounterRow,
    | "clinic_id"
    | "doctor_id"
    | "encounter_type"
    | "encounter_at"
    | "chief_complaint"
    | "assessment_summary"
    | "plan_summary"
    | "next_follow_up_recommendation_at"
  >
>;

export type EncounterSummary = Pick<
  EncounterRow,
  | "id"
  | "treatment_episode_id"
  | "doctor_id"
  | "encounter_type"
  | "encounter_at"
  | "created_at"
>;

/** `public.diagnosis` */
export interface DiagnosisRow {
  id: EntityId;
  encounter_id: EntityId;
  treatment_episode_id: EntityId;
  coding_system: string | null;
  diagnosis_code: string | null;
  diagnosis_label: string;
  is_primary: boolean;
  clinical_status: DiagnosisStatus;
  noted_at: IsoDateTime;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export type Diagnosis = DiagnosisRow;

export type CreateDiagnosisInput = Pick<
  DiagnosisRow,
  "encounter_id" | "treatment_episode_id" | "diagnosis_label"
> & {
  coding_system?: string | null;
  diagnosis_code?: string | null;
  is_primary?: boolean;
  clinical_status?: DiagnosisStatus;
  noted_at?: IsoDateTime;
};

export type UpdateDiagnosisInput = Partial<
  Pick<
    DiagnosisRow,
    | "coding_system"
    | "diagnosis_code"
    | "diagnosis_label"
    | "is_primary"
    | "clinical_status"
    | "noted_at"
  >
>;

export type DiagnosisSummary = Pick<
  DiagnosisRow,
  "id" | "encounter_id" | "diagnosis_label" | "is_primary" | "clinical_status" | "noted_at"
>;
