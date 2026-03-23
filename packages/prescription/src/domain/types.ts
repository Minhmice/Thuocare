/**
 * Service-layer input and output types for the prescription module.
 *
 * These are the types that callers (Next.js server actions, mobile API layers, etc.)
 * use to interact with prescription services. They are richer and more ergonomic
 * than the raw `CreatePrescriptionInput` from @thuocare/contracts:
 *
 * - Frequency is expressed as a structured FrequencyCode, not raw text.
 * - Duration is a single `durationDays` number (not start+end dates — those are computed).
 * - Quantity is computed by the service; callers do not provide it.
 * - Patient instructions are derived; callers do not provide them.
 *
 * Raw DB row types (`PrescriptionRow`, etc.) remain in @thuocare/contracts.
 */

import type {
  DosageForm,
  PrescriptionKind,
  PrescriptionSource,
  RefillMode,
  Route,
  TimingRelation,
} from "@thuocare/contracts";
import type { EntityId, IsoDate } from "@thuocare/contracts";

// ─── Frequency codes ──────────────────────────────────────────────────────────

/**
 * Standard Latin abbreviation frequency codes used in clinical prescription writing.
 * Aligns with the `frequency_code` column in `prescription_item`.
 */
export type FrequencyCode =
  | "QD"    // Quaque die — once daily (1/day)
  | "BID"   // Bis in die — twice daily (2/day)
  | "TID"   // Ter in die — three times daily (3/day)
  | "QID"   // Quater in die — four times daily (4/day)
  | "Q8H"   // Every 8 hours (3/day, interval-based)
  | "Q12H"  // Every 12 hours (2/day, interval-based)
  | "QHS"   // Quaque hora somni — at bedtime (1/day)
  | "QOD"   // Every other day (0.5/day)
  | "QW"    // Once weekly (1/7 per day)
  | "PRN";  // Pro re nata — as needed (no fixed schedule)

export const FREQUENCY_CODE_VALUES: readonly FrequencyCode[] = [
  "QD", "BID", "TID", "QID", "Q8H", "Q12H", "QHS", "QOD", "QW", "PRN",
];

// ─── Instruction language ─────────────────────────────────────────────────────

export type InstructionLanguage = "vi" | "en";

// ─── Structured schedule JSON shapes ────────────────────────────────────────

/**
 * Structured schedule stored in `dose_schedule.structured_schedule_json`.
 * The `type` discriminant matches the `dose_schedule_type` enum values.
 */
export interface FixedTimesDailyScheduleJson {
  type: "fixed_times_daily";
  /** Local times in HH:mm format (24h). */
  dose_times: string[];
  /** Only set when schedule is limited to specific days. Undefined = every day. */
  days_of_week?: number[];
}

export interface IntervalBasedScheduleJson {
  type: "interval_based";
  /** e.g., 8 for Q8H, 12 for Q12H */
  interval_hours: number;
}

export interface PrnScheduleJson {
  type: "prn";
  /** Null means no hard cap. */
  max_daily_doses: number | null;
  /** Minimum hours between doses. Null = no minimum. */
  min_hours_between_doses: number | null;
}

export interface TaperScheduleJson {
  type: "taper";
  /** Ordered list of taper steps. */
  steps: Array<{ days: number; dose_amount: string; times_per_day: number }>;
}

export type StructuredScheduleJson =
  | FixedTimesDailyScheduleJson
  | IntervalBasedScheduleJson
  | PrnScheduleJson
  | TaperScheduleJson;

// ─── Quantity calculation result ──────────────────────────────────────────────

export interface QuantityCalculation {
  /** Total quantity to dispense (e.g., 14.0 for 14 tablets). */
  quantityPrescribed: string;   // Decimal string to match DB numeric(12,4)
  /** Recommended dispensing unit label (e.g., "viên", "ml"). */
  quantityUnit: string;
  /** Duration in days. */
  daysSupply: number;
  /** Whether the quantity is an estimate (for PRN items). */
  isEstimate: boolean;
}

// ─── Service input types ──────────────────────────────────────────────────────

/**
 * Input for adding a prescription item via the service layer.
 * The service computes instructions, quantity, schedule, and refill policy.
 */
export interface AddPrescriptionItemInput {
  medicationMasterId: EntityId;
  /** Dose per administration (decimal string, e.g., "1", "0.5", "2"). */
  doseAmount: string;
  /** Unit of the dose (e.g., "viên", "ml", "ống"). */
  doseUnit: string;
  route: Route;
  frequencyCode: FrequencyCode;
  /**
   * Duration in days for this item.
   * Must be > 0. For PRN without a fixed duration, use 30 as a practical maximum.
   */
  durationDays: number;
  timingRelation?: TimingRelation;
  indicationText?: string | null;
  prnFlag?: boolean;
  prnReason?: string | null;
  /** Start date for this item. Defaults to prescription.effective_from. */
  startDate?: IsoDate;

  // Refill configuration
  isRefillable?: boolean;
  maxRefillsAllowed?: number;
  requiresReviewBeforeRefill?: boolean;
  highRiskReviewFlag?: boolean;
  /** Explicit refill mode; auto-derived from flags if not provided. */
  refillMode?: RefillMode;

  /** Locale for generated patient instructions. Defaults to "vi". */
  instructionLanguage?: InstructionLanguage;
}

/**
 * Input for creating a new prescription (header only; items added separately).
 */
export interface CreatePrescriptionInput {
  patientId: EntityId;
  treatmentEpisodeId: EntityId;
  prescriptionKind: PrescriptionKind;
  issueSource: PrescriptionSource;
  effectiveFrom: IsoDate;
  encounterId?: EntityId | null;
  /** Defaults to the actor's doctorProfileId. */
  doctorId?: EntityId | null;
  parentPrescriptionId?: EntityId | null;
  clinicalNote?: string | null;
}

/**
 * Input for updating a draft prescription header.
 */
export interface UpdatePrescriptionDraftInput {
  prescriptionKind?: PrescriptionKind;
  issueSource?: PrescriptionSource;
  effectiveFrom?: IsoDate;
  encounterId?: EntityId | null;
  clinicalNote?: string | null;
}

/**
 * Input for discontinuing an active prescription.
 */
export interface DiscontinuePrescriptionInput {
  reason: string;
}

/**
 * Input for updating an existing prescription item (on a draft prescription).
 */
export interface UpdatePrescriptionItemInput {
  doseAmount?: string;
  doseUnit?: string;
  route?: Route;
  frequencyCode?: FrequencyCode;
  durationDays?: number;
  timingRelation?: TimingRelation;
  indicationText?: string | null;
  prnFlag?: boolean;
  prnReason?: string | null;
  startDate?: IsoDate;
  isRefillable?: boolean;
  maxRefillsAllowed?: number;
  requiresReviewBeforeRefill?: boolean;
  highRiskReviewFlag?: boolean;
  refillMode?: RefillMode;
  instructionLanguage?: InstructionLanguage;
}

// ─── Read model output types ──────────────────────────────────────────────────

/** Full medication info embedded in item detail views. */
export interface MedicationInfo {
  id: EntityId;
  genericName: string;
  brandName: string | null;
  strengthText: string;
  dosageForm: DosageForm;
  route: Route;
  isHighRisk: boolean;
  isControlledSubstance: boolean;
}

/** Item detail enriched with medication info — for doctor view. */
export interface PrescriptionItemDoctorView {
  itemId: EntityId;
  lineNo: number;
  medication: MedicationInfo;
  doseAmount: string;
  doseUnit: string;
  route: Route;
  frequencyCode: string | null;
  frequencyText: string;
  timingRelation: TimingRelation;
  durationDays: number;
  startDate: IsoDate;
  endDate: IsoDate | null;
  prnFlag: boolean;
  prnReason: string | null;
  indicationText: string | null;
  quantityPrescribed: string;
  quantityUnit: string;
  patientInstruction: string;
  administrationInstruction: string;
  isRefillable: boolean;
  maxRefillsAllowed: number;
  requiresReviewBeforeRefill: boolean;
  highRiskReviewFlag: boolean;
  status: string;
  doseSchedule: DoseScheduleSummary | null;
  refillPolicy: RefillPolicySummary | null;
}

export interface DoseScheduleSummary {
  scheduleType: string;
  timezoneMode: string;
  timesPerDay: number | null;
  structuredSchedule: unknown;
  firstDoseAt: string | null;
  lastDoseAt: string | null;
  graceWindowMinutes: number;
  markMissedAfterMinutes: number;
}

export interface RefillPolicySummary {
  refillMode: RefillMode;
  maxRefillsAllowed: number;
  minDaysBetweenRefills: number | null;
  earliestRefillRatio: string | null;
  absoluteExpiryDate: IsoDate | null;
}

/** Full doctor-facing prescription detail. */
export interface PrescriptionDoctorView {
  prescriptionId: EntityId;
  patientId: EntityId;
  treatmentEpisodeId: EntityId;
  encounterId: EntityId | null;
  doctorId: EntityId | null;
  prescriptionKind: PrescriptionKind;
  issueSource: PrescriptionSource;
  status: string;
  issuedAt: string | null;
  effectiveFrom: IsoDate;
  effectiveTo: IsoDate | null;
  daysSupplyTotal: number | null;
  renewalSequenceNo: number;
  clinicalNote: string | null;
  patientFriendlySummary: string | null;
  items: PrescriptionItemDoctorView[];
}

/** Simplified item for patient-facing view. */
export interface PrescriptionItemPatientView {
  itemId: EntityId;
  medicationName: string;
  strengthText: string;
  patientInstruction: string;
  frequencyText: string;
  timesPerDay: number | null;
  doseTimes: string[] | null;      // HH:mm strings for scheduled doses
  daysRemaining: number | null;    // Computed from start_date + days_supply - today
  daysSupply: number;
  startDate: IsoDate;
  endDate: IsoDate | null;
  prnFlag: boolean;
  isRefillable: boolean;
  status: string;
}

/** Simplified prescription for patient-facing view. */
export interface PrescriptionPatientView {
  prescriptionId: EntityId;
  status: string;
  prescriptionKind: PrescriptionKind;
  issuedAt: string | null;
  effectiveFrom: IsoDate;
  effectiveTo: IsoDate | null;
  daysSupplyTotal: number | null;
  patientFriendlySummary: string | null;
  items: PrescriptionItemPatientView[];
}
