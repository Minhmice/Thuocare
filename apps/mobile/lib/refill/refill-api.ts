import {
  cancelRefillRequest,
  createRefillRequest,
  detectNearDepletion,
  getPatientRefillRequests,
} from "@thuocare/refill";

/** Thin mobile facade over @thuocare/refill patient-safe entrypoints (mirrors `lib/prescription/prescription-api`). */
export const refillApi = {
  detectNearDepletion,
  getPatientRefillRequests,
  createRefillRequest,
  cancelRefillRequest,
};
