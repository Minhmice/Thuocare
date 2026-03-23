import type { TreatmentEvent, TreatmentEventRow } from "../tables/timeline.js";

export function mapTreatmentEventRow(row: TreatmentEventRow): TreatmentEvent {
  return { ...row };
}
