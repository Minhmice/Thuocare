import { Alert } from "react-native";

import { isRefillError } from "@thuocare/refill";
import type { RefillRequestVM } from "@thuocare/refill";

import { useMobileAuth } from "@/lib/auth/mobile-auth";
import { usePatientRefillRequests } from "@/lib/refill/use-patient-refill-requests";
import { useCreateRefillRequest } from "@/lib/refill/use-create-refill-request";

/**
 * Aggregates refill read-state and submit-mutation for a specific prescription.
 *
 * Composes:
 * - {@link usePatientRefillRequests} — cached list of all patient refill requests
 * - {@link useCreateRefillRequest}   — mutation to submit a new refill request
 *
 * @param prescriptionId    - Filters the active request from the full list.
 * @param treatmentEpisodeId - Required when submitting a refill (passed through to create input).
 */
export function useRefillData(prescriptionId: string, treatmentEpisodeId?: string) {
  const { actor } = useMobileAuth();

  // ── Read: all requests for this patient ───────────────────────────────────
  const { requests, isLoading, refetch } = usePatientRefillRequests();

  // Derive the most recent request that targets this prescription
  const activeRequest = requests
    .filter((req: RefillRequestVM) => req.sourcePrescription?.prescriptionId === prescriptionId)
    .sort(
      (a, b) =>
        new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime(),
    )[0];

  // ── Write: submit refill via shared lib mutation ───────────────────────────
  const { mutateAsync: createRefill, isPending: isSubmitting } = useCreateRefillRequest();

  const requestRefill = async (note?: string) => {
    if (!actor || actor.kind !== "patient" || !actor.patientId || !actor.organizationId) {
      throw new Error("No patient actor");
    }
    if (!treatmentEpisodeId) {
      throw new Error("treatmentEpisodeId is required to request a refill");
    }

    try {
      await createRefill({
        patientId: actor.patientId,
        organizationId: actor.organizationId,
        treatmentEpisodeId,
        sourcePrescriptionId: prescriptionId,
        scope: "full_prescription",
        triggerSource: "manual_request",
        patientComment: note ?? null,
      });
    } catch (error: unknown) {
      if (isRefillError(error) && error.code === "duplicate_pending_request") {
        Alert.alert("Không thể gửi", "Bạn đã có một yêu cầu đang chờ duyệt cho đơn thuốc này.");
        return;
      }
      Alert.alert("Lỗi", "Không thể gửi yêu cầu cấp lại thuốc. Vui lòng thử lại sau.");
    }
  };

  return {
    activeRequest,
    isLoading,
    isSubmitting,
    requestRefill,
    refetch,
  };
}
