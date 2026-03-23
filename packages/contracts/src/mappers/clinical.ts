import type {
  Diagnosis,
  DiagnosisRow,
  Encounter,
  EncounterRow,
  EncounterSummary,
  TreatmentEpisode,
  TreatmentEpisodeRow,
} from "../tables/clinical.js";
import type { TreatmentEpisodeDetail } from "../summaries.js";
import type { DoctorProfileSummary, PatientSummary } from "../tables/tenant.js";

export function mapTreatmentEpisodeRow(row: TreatmentEpisodeRow): TreatmentEpisode {
  return { ...row };
}

export function mapEncounterRow(row: EncounterRow): Encounter {
  return { ...row };
}

export function mapDiagnosisRow(row: DiagnosisRow): Diagnosis {
  return { ...row };
}

export function assembleTreatmentEpisodeDetail(input: {
  episode: TreatmentEpisode;
  patient: PatientSummary;
  primaryDoctor: DoctorProfileSummary | null;
  latestEncounter: EncounterSummary | null;
}): TreatmentEpisodeDetail {
  return {
    episode: input.episode,
    patient: input.patient,
    primaryDoctor: input.primaryDoctor,
    latestEncounter: input.latestEncounter,
  };
}
