import type { DosageForm, RecordStatus, Route } from "../enums.js";
import type { EntityId, IsoDateTime } from "../primitives.js";

/** `public.medication_master` */
export interface MedicationMasterRow {
  id: EntityId;
  standard_code: string | null;
  generic_name: string;
  brand_name: string | null;
  strength_text: string;
  dosage_form: DosageForm;
  route: Route;
  atc_class: string | null;
  is_high_risk: boolean;
  is_controlled_substance: boolean;
  status: RecordStatus;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export type MedicationMaster = MedicationMasterRow;

export type CreateMedicationMasterInput = Pick<
  MedicationMasterRow,
  "generic_name" | "strength_text" | "dosage_form" | "route"
> & {
  standard_code?: string | null;
  brand_name?: string | null;
  atc_class?: string | null;
  is_high_risk?: boolean;
  is_controlled_substance?: boolean;
  status?: RecordStatus;
};

export type UpdateMedicationMasterInput = Partial<
  Pick<
    MedicationMasterRow,
    | "standard_code"
    | "generic_name"
    | "brand_name"
    | "strength_text"
    | "dosage_form"
    | "route"
    | "atc_class"
    | "is_high_risk"
    | "is_controlled_substance"
    | "status"
  >
>;

export type MedicationMasterSummary = Pick<
  MedicationMasterRow,
  | "id"
  | "standard_code"
  | "generic_name"
  | "brand_name"
  | "strength_text"
  | "dosage_form"
  | "route"
  | "status"
>;
