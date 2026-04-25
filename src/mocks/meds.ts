import type { Medication } from "../types/medication";

/**
 * Mock medication data for local development and UI testing.
 *
 * Coverage deliberately varied to stress-test list layout, dashboard metrics,
 * and stock-state styling:
 *   - Short, medium, and multi-word names (truncation/wrapping)
 *   - Tablet, capsule, liquid, and powder dosage strings
 *   - 1×, 2×, and 3× daily schedules plus "as needed"
 *   - Stock: unknown, high, low (≤5), and out (0)
 *   - Vietnamese-friendly drug names for realistic review
 */
export const mockMedications: Medication[] = [
  // --- Tablets ---
  {
    id: "med-1",
    name: "Paracetamol",
    dosage: "1 tablet",
    schedule: "Morning (before meal)",
    remainingDoses: 42
  },
  {
    id: "med-2",
    name: "Metformin 500mg",
    dosage: "2 tablets",
    schedule: "Morning, Evening (with meal)",
    remainingDoses: 60
  },
  {
    id: "med-3",
    name: "Atorvastatin 20mg",
    dosage: "1 tablet",
    schedule: "Evening (after meal)",
    remainingDoses: 25
  },
  {
    id: "med-4",
    name: "Vitamin B-complex",
    dosage: "1 tablet",
    schedule: "Morning (with meal)",
    remainingDoses: 30
  },
  {
    id: "med-5",
    name: "Aspirin 81mg",
    dosage: "1 tablet",
    schedule: "Morning (with meal)",
    remainingDoses: 3
  },
  {
    id: "med-6",
    name: "Cetirizine",
    dosage: "1 tablet",
    schedule: "Evening",
    remainingDoses: 0
  },
  {
    id: "med-7",
    name: "Magnesium glycinate",
    dosage: "2 tablets",
    schedule: "Evening (after meal)",
    remainingDoses: 45
  },
  {
    id: "med-8",
    name: "Ferrous sulfate (iron supplement)",
    dosage: "1 tablet",
    schedule: "Morning (after meal)",
    remainingDoses: 0
  },
  {
    // Long name — stresses 2-line truncation and badge alignment
    id: "med-9",
    name: "Acetaminophen & Codeine Phosphate 300/15mg",
    dosage: "1 tablet",
    schedule: "As needed",
    remainingDoses: 2
  },
  // --- Capsules ---
  {
    id: "med-10",
    name: "Amoxicillin",
    dosage: "1 capsule",
    schedule: "Morning, Noon, Evening (before meal)",
    remainingDoses: 14
  },
  {
    id: "med-11",
    name: "Vitamin D3 + Calcium",
    dosage: "1 capsule",
    schedule: "Morning (with meal)",
    remainingDoses: 5
  },
  {
    // No stock info — tests "stock unknown" path
    id: "med-12",
    name: "Omeprazole",
    dosage: "1 capsule",
    schedule: "Morning (before meal)"
  },
  // --- Liquid ---
  {
    // No stock info — tests liquid dosage string
    id: "med-13",
    name: "Lactulose oral solution",
    dosage: "15 ml",
    schedule: "Noon (with meal)"
  },
  // --- Powder ---
  {
    // No stock info — tests powder/scoop string
    id: "med-14",
    name: "Protein powder — whey isolate",
    dosage: "1 scoop",
    schedule: "Morning"
  }
];
