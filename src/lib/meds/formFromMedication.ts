import type {
  Medication,
  MedicationWizardSnapshot
} from "../../types/medication";

export type MedFormData = {
  name: string;
  whatFor: string;
  form: MedicationWizardSnapshot["form"];
  quantity: string;
  moments: MedicationWizardSnapshot["moments"];
  stock: string;
  startDate: string;
  endDate: string;
};

const EMPTY_MOMENTS: MedFormData["moments"] = [
  { id: "morning", label: "Morning", active: false, mealRelation: "after" },
  { id: "noon", label: "Noon", active: false, mealRelation: "after" },
  { id: "evening", label: "Evening", active: false, mealRelation: "after" }
];

function formFromDosage(dosage: string): MedFormData["form"] {
  if (/\bml\b/i.test(dosage)) return "liquid";
  if (/scoop/i.test(dosage)) return "powder";
  return "tablet";
}

function quantityFromDosage(dosage: string): string {
  const m = dosage.trim().match(/^(\d+(\.\d+)?)/);
  return m?.[1] ?? "";
}

export function buildMedFormDataFromMedication(med: Medication): MedFormData {
  if (med.wizardSnapshot) {
    const s = med.wizardSnapshot;
    return {
      name: med.name,
      whatFor: s.whatFor,
      form: s.form,
      quantity: s.quantity,
      moments: s.moments.map((m) => ({ ...m })),
      stock: s.stock,
      startDate: s.startDate,
      endDate: s.endDate
    };
  }

  const today = new Date().toISOString().split("T")[0] ?? "";
  return {
    name: med.name,
    whatFor: "",
    form: formFromDosage(med.dosage),
    quantity: quantityFromDosage(med.dosage),
    moments: EMPTY_MOMENTS.map((m) => ({ ...m })),
    stock: med.remainingDoses != null ? String(med.remainingDoses) : "",
    startDate: today,
    endDate: ""
  };
}

export function snapshotFromFormData(
  data: MedFormData
): MedicationWizardSnapshot {
  return {
    whatFor: data.whatFor,
    form: data.form,
    quantity: data.quantity,
    moments: data.moments.map((m) => ({ ...m })),
    stock: data.stock,
    startDate: data.startDate,
    endDate: data.endDate
  };
}
