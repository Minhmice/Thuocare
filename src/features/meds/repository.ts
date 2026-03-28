import type { Medication } from "../../types/medication";
import { mockMedications } from "../../mocks/meds";
import { getLocalMedications } from "../../lib/meds/localMedsStore";

export async function getMedications(): Promise<Medication[] | null> {
  const local = getLocalMedications();
  return Promise.resolve([...local, ...mockMedications]);
}
