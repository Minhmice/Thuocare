import type { User } from "@supabase/supabase-js";
import type {
  OnboardingSurveyAnswers,
  RoutineSegment
} from "../../types/onboarding-survey";
import type {
  ReminderPreference,
  RoutineStage,
  StoredAuthRecord
} from "../auth/storage";
import { normalizeVnPhoneForDisplay } from "../phone/vnDisplay";
import { supabase } from "./client";

export const PROFILE_AUTH_COLUMNS =
  "user_id, profile_slug, full_name, email, phone, timezone, created_at, onboarding_completed, onboarding_survey, reminder_preference, routine_stage, routine_segment" as const;

export type ProfileAuthRow = {
  user_id: string;
  profile_slug: string;
  full_name: string;
  email: string;
  phone: string | null;
  timezone: string;
  created_at: string | null;
  onboarding_completed: boolean;
  onboarding_survey: OnboardingSurveyAnswers | null;
  reminder_preference: string | null;
  routine_stage: string | null;
  routine_segment: string | null;
};

export async function fetchProfileRow(
  userId: string
): Promise<ProfileAuthRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_AUTH_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as ProfileAuthRow | null;
}

export async function fetchProfileRowWithRetry(
  userId: string,
  attempts = 6
): Promise<ProfileAuthRow | null> {
  for (let i = 0; i < attempts; i++) {
    const row = await fetchProfileRow(userId);
    if (row) {
      return row;
    }
    await new Promise((r) => setTimeout(r, 250 * (i + 1)));
  }
  return null;
}

export type ProfileContactSyncInput = {
  phone?: string;
  fullName?: string;
  email?: string;
};

/**
 * Writes contact fields to public.profiles (RLS). Use after sign-up so phone is stored even if
 * the auth trigger missed metadata; Supabase Auth "Phone" column is for SMS login, not this value.
 */
export async function syncProfileContact(
  userId: string,
  input: ProfileContactSyncInput
): Promise<void> {
  const patch: Record<string, string> = {};
  if (input.phone !== undefined) {
    const p = normalizeVnPhoneForDisplay(input.phone.trim());
    if (p) {
      patch.phone = p;
    }
  }
  if (input.fullName !== undefined && input.fullName.trim().length > 0) {
    patch.full_name = input.fullName.trim();
  }
  if (input.email !== undefined && input.email.trim().length > 0) {
    patch.email = input.email.trim().toLowerCase();
  }
  if (Object.keys(patch).length === 0) {
    return;
  }

  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("user_id", userId);
  if (error) {
    throw new Error(error.message);
  }
}

function phoneFromUserMetadata(user: User): string {
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const raw =
    (typeof meta?.phone === "string" && meta.phone) ||
    (typeof meta?.phone_number === "string" && meta.phone_number) ||
    "";
  return normalizeVnPhoneForDisplay(raw.trim());
}

/** If profiles.phone is empty but JWT metadata has a phone, persist it (older signups / trigger gaps). */
export async function backfillProfilePhoneIfMissing(
  user: User,
  row: ProfileAuthRow
): Promise<ProfileAuthRow> {
  const hasRowPhone = Boolean(row.phone && row.phone.trim());
  if (hasRowPhone) {
    return row;
  }
  const fromMeta = phoneFromUserMetadata(user);
  if (!fromMeta) {
    return row;
  }
  await syncProfileContact(user.id, { phone: fromMeta });
  const refreshed = await fetchProfileRow(user.id);
  return refreshed ?? row;
}

export function profileRowToStoredRecord(
  user: User,
  row: ProfileAuthRow
): StoredAuthRecord {
  const meta = user.user_metadata as
    | Record<string, string | undefined>
    | undefined;
  const phoneFromMeta =
    typeof meta?.phone === "string" ? meta.phone.trim() : "";
  const phone = (row.phone ?? phoneFromMeta ?? "").trim();

  return {
    id: user.id,
    phone,
    email: user.email ?? (row.email ? row.email.trim() : null),
    fullName:
      row.full_name.trim() ||
      (typeof meta?.full_name === "string" ? meta.full_name : "—"),
    onboardingCompleted: row.onboarding_completed,
    routineStage: (row.routine_stage as RoutineStage | null) ?? null,
    reminderPreference:
      (row.reminder_preference as ReminderPreference | null) ?? null,
    onboardingSurvey: row.onboarding_survey ?? null,
    routineSegment: (row.routine_segment as RoutineSegment | null) ?? null,
    createdAt: row.created_at ?? user.created_at ?? new Date().toISOString()
  };
}
