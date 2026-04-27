import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "../../components/state/EmptyState";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { ReminderExperience } from "../../features/components/composed/reminder-experience";
import { Dialog } from "../../features/components/wrapper/dialog";
import {
  getReminderDoseVM,
  markDoseTaken,
  skipDose,
  snoozeDose
} from "../../features/reminder/repository";
import { parseDoseId } from "../../lib/reminder/doseId";
import { useMedicationsData } from "../../lib/meds/MedicationsProvider";
import { useMinuteTicker } from "../../lib/reminder/useMinuteTicker";
import type { ReminderDoseVM } from "../../lib/reminder/vm";
import type { NextDoseGroup } from "../../types/home";

type VmState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "not_found" }
  | { status: "ready"; vm: ReminderDoseVM };

function buildNextDoseGroup(
  vm: ReminderDoseVM,
  doseId: string,
  now: Date
): NextDoseGroup {
  const { scheduledDate, scheduledAt } = parseDoseId(doseId);

  // How many minutes past the 2-hour window end (0 when not yet overdue)
  let minutesLate = 0;
  const parts = scheduledAt.split(":");
  const hh = parseInt(parts[0] ?? "0", 10);
  const mm = parseInt(parts[1] ?? "0", 10);
  if (!isNaN(hh) && !isNaN(mm)) {
    const windowEnd = new Date(now);
    windowEnd.setHours(hh, mm + 120, 0, 0);
    const diffMs = now.getTime() - windowEnd.getTime();
    if (diffMs > 0) minutesLate = Math.round(diffMs / 60000);
  }

  return {
    scheduledDate,
    scheduledAt: vm.scheduledTimeLabel,
    minutesLate,
    medications: vm.medicines.map((m) => ({
      id: m.prescriptionItemId,
      name: m.medicineName,
      instruction: m.tipLabel ?? m.doseLabel,
      note: m.doseLabel
    }))
  };
}

export default function ReminderDoseScreen() {
  const params = useLocalSearchParams<{ doseId: string }>();
  const doseId = Array.isArray(params.doseId) ? params.doseId[0] : params.doseId;
  const router = useRouter();

  const now = useMinuteTicker();
  const {
    items: medications,
    loading: medsLoading,
    error: medsError,
    refresh
  } = useMedicationsData();
  const { height: viewportHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [vmState, setVmState] = useState<VmState>({ status: "idle" });
  const [skipDialogVisible, setSkipDialogVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadVm = useCallback(async () => {
    if (!doseId || medsLoading) return;
    setVmState({ status: "loading" });
    try {
      const result = await getReminderDoseVM({ doseId, medications, now });
      if (result == null) {
        setVmState({ status: "not_found" });
      } else {
        setVmState({ status: "ready", vm: result });
      }
    } catch (err) {
      setVmState({
        status: "error",
        message: err instanceof Error ? err.message : "Failed to load dose"
      });
    }
  }, [doseId, medications, medsLoading, now]);

  // Re-compute VM on every minute tick and when medications change
  useEffect(() => {
    void loadVm();
  }, [loadVm]);

  const handleConfirm = useCallback(async () => {
    if (vmState.status !== "ready" || !doseId) return;
    try {
      setActionLoading(true);
      await markDoseTaken({
        doseId,
        takenAtISO: new Date().toISOString(),
        medicineIds: vmState.vm.medicines.map((m) => m.prescriptionItemId),
        medications
      });
      router.back();
    } catch (err) {
      setVmState({
        status: "error",
        message: err instanceof Error ? err.message : "Failed to mark dose taken"
      });
    } finally {
      setActionLoading(false);
    }
  }, [vmState, doseId, medications, router]);

  const handleSnooze = useCallback(async () => {
    if (!doseId) return;
    const snoozedUntilISO = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
    try {
      setActionLoading(true);
      await snoozeDose({ doseId, snoozedUntilISO });
      router.back();
    } catch (err) {
      setVmState({
        status: "error",
        message: err instanceof Error ? err.message : "Failed to snooze dose"
      });
    } finally {
      setActionLoading(false);
    }
  }, [doseId, now, router]);

  const handleSkipPress = useCallback(() => {
    setSkipDialogVisible(true);
  }, []);

  const handleSkipDismiss = useCallback(() => {
    setSkipDialogVisible(false);
  }, []);

  const handleSkipConfirm = useCallback(async () => {
    if (!doseId) return;
    setSkipDialogVisible(false);
    try {
      setActionLoading(true);
      await skipDose({ doseId, skippedAtISO: new Date().toISOString() });
      router.back();
    } catch (err) {
      setVmState({
        status: "error",
        message: err instanceof Error ? err.message : "Failed to skip dose"
      });
    } finally {
      setActionLoading(false);
    }
  }, [doseId, router]);

  // ── State rendering ──────────────────────────────────────────────────────────

  if (medsLoading && medications.length === 0) {
    return <LoadingState message="Loading medications..." />;
  }

  if (medsError && medications.length === 0) {
    return <ErrorState message={medsError} onRetry={refresh} />;
  }

  if (vmState.status === "idle" || vmState.status === "loading") {
    return <LoadingState message="Loading dose..." />;
  }

  if (vmState.status === "error") {
    return <ErrorState message={vmState.message} onRetry={loadVm} />;
  }

  if (vmState.status === "not_found") {
    return (
      <EmptyState
        title="Dose not found"
        message="This dose could not be found. It may have already been completed or the link is invalid."
      />
    );
  }

  const { vm } = vmState;
  const nextDose = buildNextDoseGroup(vm, doseId ?? "", now);

  return (
    <View style={{ flex: 1 }}>
      <ReminderExperience
        nextDose={nextDose}
        viewportHeight={viewportHeight}
        topInset={insets.top}
        onConfirm={handleConfirm}
        onSnooze={handleSnooze}
        onSkip={handleSkipPress}
      >
        {null}
      </ReminderExperience>

      <Dialog
        visible={skipDialogVisible}
        onDismiss={handleSkipDismiss}
        title="Skip this dose?"
        description="Skipping will mark this dose as skipped. You can still view it in your medication history."
        confirmLabel="Skip dose"
        cancelLabel="Keep it"
        confirmVariant="error"
        onConfirm={handleSkipConfirm}
        loading={actionLoading}
      >
        {null}
      </Dialog>
    </View>
  );
}
