import type { AnyActorContext } from '@thuocare/auth';
import {
  getPatientTimeline,
  markDoseSkipped,
  markDoseTaken,
  type GetTimelineInput,
  type MarkDoseSkippedInput,
  type MarkDoseTakenInput,
} from '@thuocare/adherence';

import { mobileSupabase } from '@/lib/supabase/mobile-client';

const VERIFY_ENABLED =
  __DEV__ ||
  process.env.EXPO_PUBLIC_VERIFY_ADHERENCE_CONTRACTS === '1' ||
  process.env.EXPO_PUBLIC_VERIFY_ADHERENCE_CONTRACTS === 'true';

function isPatientActor(actor: AnyActorContext | null): actor is Extract<AnyActorContext, { kind: 'patient' }> {
  return actor?.kind === 'patient';
}

function asBool(value: string | undefined): boolean {
  return value === '1' || value === 'true';
}

function getTimelineDate(): string {
  const raw = process.env.EXPO_PUBLIC_VERIFY_TIMELINE_DATE?.trim();
  if (raw) return raw;
  return new Date().toISOString().slice(0, 10);
}

function getScheduledTime(): string {
  const raw = process.env.EXPO_PUBLIC_VERIFY_SCHEDULED_TIME?.trim();
  if (raw) return raw;

  const date = getTimelineDate();
  return `${date}T08:00:00`;
}

function getRequiredMutationIds(actorPatientId: string) {
  const patientId = process.env.EXPO_PUBLIC_VERIFY_PATIENT_ID?.trim() || actorPatientId;
  const organizationId = process.env.EXPO_PUBLIC_VERIFY_ORGANIZATION_ID?.trim();
  const prescriptionItemId = process.env.EXPO_PUBLIC_VERIFY_PRESCRIPTION_ITEM_ID?.trim();

  if (!organizationId || !prescriptionItemId) {
    return null;
  }

  return { patientId, organizationId, prescriptionItemId };
}

function getVerificationConfig(actorPatientId: string) {
  return {
    timelinePatientId: process.env.EXPO_PUBLIC_VERIFY_PATIENT_ID?.trim() || actorPatientId,
    timelineDate: getTimelineDate(),
    runMutations: asBool(process.env.EXPO_PUBLIC_VERIFY_MUTATIONS),
    mutationIds: getRequiredMutationIds(actorPatientId),
    scheduledTime: getScheduledTime(),
  };
}

function logTimelineShape(result: Awaited<ReturnType<typeof getPatientTimeline>>) {
  const slotCount = Array.isArray(result.doses) ? result.doses.length : 0;
  console.info('[adherence:verify] timeline_output_shape', {
    keys: Object.keys(result),
    slotCount,
    firstDoseKeys: slotCount > 0 && result.doses[0] ? Object.keys(result.doses[0]) : [],
  });
}

export async function runAdherenceContractVerification(actor: AnyActorContext | null): Promise<void> {
  if (!VERIFY_ENABLED) return;
  if (!isPatientActor(actor)) {
    console.info('[adherence:verify] skipped_non_patient_actor');
    return;
  }

  const config = getVerificationConfig(actor.patientId);

  const timelineInput: GetTimelineInput = {
    patientId: config.timelinePatientId,
    date: config.timelineDate,
  };

  console.info('[adherence:verify] timeline_input', {
    date: timelineInput.date,
    patientId: timelineInput.patientId,
  });

  try {
    const timeline = await getPatientTimeline(mobileSupabase, actor, timelineInput);
    logTimelineShape(timeline);
  } catch (error) {
    console.warn('[adherence:verify] timeline_call_failed', {
      message: error instanceof Error ? error.message : 'unknown_error',
    });
  }

  if (!config.runMutations) {
    console.info('[adherence:verify] mutation_checks_disabled');
    return;
  }

  if (!config.mutationIds) {
    console.info('[adherence:verify] mutation_checks_skipped_missing_ids', {
      requiredEnv: ['EXPO_PUBLIC_VERIFY_ORGANIZATION_ID', 'EXPO_PUBLIC_VERIFY_PRESCRIPTION_ITEM_ID'],
    });
    return;
  }

  const baseMutationInput = {
    patientId: config.mutationIds.patientId,
    organizationId: config.mutationIds.organizationId,
    prescriptionItemId: config.mutationIds.prescriptionItemId,
    scheduledTime: config.scheduledTime,
  };

  const takenInput: MarkDoseTakenInput = {
    ...baseMutationInput,
    source: 'patient',
    notes: '[dev verification] markDoseTaken',
  };

  const skippedInput: MarkDoseSkippedInput = {
    ...baseMutationInput,
    source: 'patient',
    notes: '[dev verification] markDoseSkipped',
  };

  try {
    const takenResult = await markDoseTaken(mobileSupabase, actor, takenInput);
    console.info('[adherence:verify] markDoseTaken_success', {
      resultKeys: Object.keys(takenResult),
      status: takenResult.status,
    });
  } catch (error) {
    console.warn('[adherence:verify] markDoseTaken_failed', {
      message: error instanceof Error ? error.message : 'unknown_error',
    });
  }

  try {
    const skippedResult = await markDoseSkipped(mobileSupabase, actor, skippedInput);
    console.info('[adherence:verify] markDoseSkipped_success', {
      resultKeys: Object.keys(skippedResult),
      status: skippedResult.status,
    });
  } catch (error) {
    console.warn('[adherence:verify] markDoseSkipped_failed', {
      message: error instanceof Error ? error.message : 'unknown_error',
    });
  }
}
