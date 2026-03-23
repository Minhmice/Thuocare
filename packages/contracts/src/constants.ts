import type { UserRole } from "./enums.js";
import {
  APPOINTMENT_STATUS_VALUES,
  EPISODE_STATUS_VALUES,
  PRESCRIPTION_STATUS_VALUES,
  REFILL_REQUEST_STATUS_VALUES,
  USER_ROLE_VALUES,
} from "./enums.js";

/** Re-exported enum value arrays for iteration / selects */
export const ENUM_LISTS = {
  userRole: USER_ROLE_VALUES,
  episodeStatus: EPISODE_STATUS_VALUES,
  prescriptionStatus: PRESCRIPTION_STATUS_VALUES,
  refillRequestStatus: REFILL_REQUEST_STATUS_VALUES,
  appointmentStatus: APPOINTMENT_STATUS_VALUES,
} as const;

export const TERMINAL_EPISODE_STATUSES = new Set<
  (typeof EPISODE_STATUS_VALUES)[number]
>(["completed", "discontinued", "cancelled"]);

export const ACTIVE_PRESCRIPTION_STATUSES = new Set<
  (typeof PRESCRIPTION_STATUS_VALUES)[number]
>(["issued", "active", "paused"]);

export const OPEN_REFILL_REQUEST_STATUSES = new Set<
  (typeof REFILL_REQUEST_STATUS_VALUES)[number]
>(["submitted", "triaging", "awaiting_doctor_review", "appointment_required"]);

/**
 * Static role → capability map for UI hints only.
 * Authoritative enforcement remains in Postgres RLS + helpers.
 */
export const ROLE_PRESETS: Record<
  UserRole,
  {
    canWriteClinicalData: boolean;
    canWritePrescriptions: boolean;
    canManageRefills: boolean;
    canManageMedicationCatalog: boolean;
  }
> = {
  doctor: {
    canWriteClinicalData: true,
    canWritePrescriptions: true,
    canManageRefills: true,
    canManageMedicationCatalog: false,
  },
  nurse: {
    canWriteClinicalData: true,
    canWritePrescriptions: false,
    canManageRefills: true,
    canManageMedicationCatalog: false,
  },
  pharmacist: {
    canWriteClinicalData: false,
    canWritePrescriptions: false,
    canManageRefills: true,
    canManageMedicationCatalog: true,
  },
  admin: {
    canWriteClinicalData: true,
    canWritePrescriptions: true,
    canManageRefills: true,
    canManageMedicationCatalog: true,
  },
  care_coordinator: {
    canWriteClinicalData: true,
    canWritePrescriptions: false,
    canManageRefills: true,
    canManageMedicationCatalog: false,
  },
};
