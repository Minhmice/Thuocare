import type { PrescriptionItemStatus, PrescriptionStatus } from "./enums.js";
import type {
  DoctorProfileSummary,
  EncounterSummary,
  PatientSummary,
  TreatmentEpisode,
} from "./tables/index.js";
import type { EntityId, IsoDate } from "./primitives.js";

/**
 * Episode plus common joined projections for workspace / patient views.
 * Populated by later phases; this file only fixes the shape.
 */
export interface TreatmentEpisodeDetail {
  episode: TreatmentEpisode;
  patient: PatientSummary;
  primaryDoctor: DoctorProfileSummary | null;
  latestEncounter: EncounterSummary | null;
}

/** Patient-facing medication line for timeline / adherence shells */
export interface ActiveMedicationSummary {
  prescriptionItemId: EntityId;
  prescriptionId: EntityId;
  treatmentEpisodeId: EntityId;
  genericName: string;
  strengthText: string;
  dosageFormLabel: string;
  patientInstructionText: string;
  itemStatus: PrescriptionItemStatus;
  prescriptionStatus: PrescriptionStatus;
  startDate: IsoDate;
  endDate: IsoDate | null;
}
