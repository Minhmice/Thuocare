/**
 * Exact TypeScript interfaces provided in the Backend Integration Brief.
 * These represent the core clinical and actor entities for Phase 1.
 */

export type EntityId = string; // UUID
export type IsoDate = string; // YYYY-MM-DD
export type IsoDateTime = string; // ISO 8601

export interface DoctorUser {
  id: EntityId;
  organization_id: EntityId;
  full_name: string;
  email: string;
  role: 'doctor';
  doctor_profile_id: EntityId;
  specialty: string | null;
  license_no: string | null;
}

export interface PatientUser {
  id: EntityId;
  organization_id: EntityId;
  full_name: string;
  email: string | null;
  phone: string | null;
  external_patient_code: string | null;
  status: 'active' | 'archived';
}

export interface Prescription {
  id: EntityId;
  patient_id: EntityId;
  doctor_id: EntityId | null;
  status: 'active' | 'expired' | 'cancelled';
  issued_at: IsoDateTime;
  effective_from: IsoDate;
  effective_to: IsoDate | null;
  days_supply_total: number | null;
  patient_friendly_summary: string | null;
}

export interface MedicationItem {
  id: EntityId;
  prescription_id: EntityId;
  medication_master_id: EntityId;
  generic_name?: string;
  brand_name?: string;
  dose_amount: string;
  dose_unit: string;
  route: string;
  frequency_text: string;
  patient_instruction_text: string;
  quantity_prescribed: string;
  quantity_unit: string;
  days_supply: number;
  start_date: IsoDate;
  end_date: IsoDate | null;
  is_refillable: boolean;
  status: 'active' | 'stopped';
}

export interface DoseSchedule {
  id: EntityId;
  prescription_item_id: EntityId;
  schedule_type: 'fixed_times_daily' | 'interval' | 'prn';
  times_per_day: number | null;
  structured_schedule_json: any; // Slot-based times
  grace_window_minutes: number;
}

export interface RefillPolicySnapshot {
  id: EntityId;
  prescription_item_id: EntityId;
  refill_mode: 'patient_request_allowed' | 'doctor_review_required' | 'proactive_refill';
  max_refills_allowed: number;
  earliest_refill_ratio: number | null; // e.g., 0.8
}

export interface RefillRequest {
  id: EntityId;
  patient_id: EntityId;
  source_prescription_id: EntityId;
  status: 'awaiting_doctor_review' | 'approved' | 'rejected' | 'completed';
  submitted_at: IsoDateTime;
  patient_comment: string | null;
}

export interface AdherenceLog {
  id: EntityId;
  patient_id: EntityId;
  prescription_item_id: EntityId;
  scheduled_date: IsoDate;
  scheduled_time: IsoDateTime;
  actual_taken_time: IsoDateTime | null;
  status: 'scheduled' | 'taken' | 'missed' | 'skipped';
  source: 'patient' | 'system';
  notes: string | null;
}
