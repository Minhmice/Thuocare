/**
 * Thin data access helpers for actor context loading.
 *
 * These helpers load the minimum data needed for auth/access resolution.
 * They are NOT general-purpose repositories — later feature modules should
 * build their own query layers for business data needs.
 *
 * All functions accept a Supabase client and validate responses with Zod.
 * They return typed contract rows from @thuocare/contracts.
 *
 * WHEN TO USE:
 * - Enriching an actor context after initial resolution (e.g., loading clinic_id
 *   onto a staff actor if needed beyond what my_auth_binding_status returns).
 * - Checking onboarding issue state before routing.
 * - Verifying caregiver link existence for access decisions.
 *
 * DO NOT USE for business queries (list all patients, get treatment episodes, etc.)
 * Those belong in feature-level data layers.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type {
  DoctorProfileRow,
  OnboardingIssueLogRow,
  PatientRow,
  UserAccountRow,
} from "@thuocare/contracts";
import type { AuthUserId, EntityId } from "@thuocare/contracts";
import { selectMany, selectOne } from "../internal/supabase-client.js";

// ─── Zod schemas for row validation ──────────────────────────────────────────
// These validate raw DB responses before casting to typed rows.
// Fields match the column names in the SQL schema exactly.

const userAccountRowSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  clinic_id: z.string().nullable(),
  role: z.string(),
  full_name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  status: z.string(),
  auth_user_id: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

const doctorProfileRowSchema = z.object({
  id: z.string(),
  user_account_id: z.string(),
  license_no: z.string().nullable(),
  specialty: z.string().nullable(),
  title: z.string().nullable(),
  default_clinic_id: z.string().nullable(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

const patientRowSchema = z.object({
  id: z.string(),
  /** Null for self-serve personal/family patients (Phase 12). */
  organization_id: z.string().nullable(),
  external_patient_code: z.string().nullable(),
  full_name: z.string(),
  date_of_birth: z.string().nullable(),
  sex: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  address_text: z.string().nullable(),
  preferred_language: z.string().nullable(),
  communication_preference: z.string(),
  status: z.string(),
  auth_user_id: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

const onboardingIssueLogRowSchema = z.object({
  id: z.string(),
  organization_id: z.string().nullable(),
  actor_type: z.string(),
  auth_user_id: z.string(),
  auth_email: z.string().nullable(),
  organization_code: z.string().nullable(),
  issue_code: z.string(),
  details: z.record(z.string(), z.unknown()),
  resolved_at: z.string().nullable(),
  resolved_by_user_account_id: z.string().nullable(),
  resolution_note: z.string().nullable(),
  created_at: z.string(),
});

// ─── User account helpers ─────────────────────────────────────────────────────

/**
 * Load the user_account row linked to the given auth_user_id.
 * Returns null if no row is found.
 *
 * Use this to enrich a staff actor context with full user_account details
 * (e.g., full_name, email, clinic_id) beyond what the binding status RPC returns.
 */
export async function loadUserAccountByAuthId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  authUserId: AuthUserId,
): Promise<UserAccountRow | null> {
  const { data, error } = await selectOne(supabase, "user_account", "auth_user_id", authUserId);
  if (error !== null || data === null) return null;
  const parsed = userAccountRowSchema.safeParse(data);
  if (!parsed.success) return null;
  return parsed.data as UserAccountRow;
}

/**
 * Load the user_account row by its primary key.
 * Returns null if not found or parse fails.
 */
export async function loadUserAccountById(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userAccountId: EntityId,
): Promise<UserAccountRow | null> {
  const { data, error } = await selectOne(supabase, "user_account", "id", userAccountId);
  if (error !== null || data === null) return null;
  const parsed = userAccountRowSchema.safeParse(data);
  if (!parsed.success) return null;
  return parsed.data as UserAccountRow;
}

// ─── Doctor profile helpers ───────────────────────────────────────────────────

/**
 * Load the doctor_profile row for the given user_account_id.
 * Returns null if the user has no doctor_profile (role != doctor or profile not created).
 */
export async function loadDoctorProfileByUserAccountId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userAccountId: EntityId,
): Promise<DoctorProfileRow | null> {
  const { data, error } = await selectOne(
    supabase,
    "doctor_profile",
    "user_account_id",
    userAccountId,
  );
  if (error !== null || data === null) return null;
  const parsed = doctorProfileRowSchema.safeParse(data);
  if (!parsed.success) return null;
  // Only return active profiles
  if (parsed.data.status !== "active") return null;
  return parsed.data as DoctorProfileRow;
}

// ─── Patient helpers ──────────────────────────────────────────────────────────

/**
 * Load the patient row linked to the given auth_user_id.
 * Returns null if not found.
 */
export async function loadPatientByAuthId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  authUserId: AuthUserId,
): Promise<PatientRow | null> {
  const { data, error } = await selectOne(supabase, "patient", "auth_user_id", authUserId);
  if (error !== null || data === null) return null;
  const parsed = patientRowSchema.safeParse(data);
  if (!parsed.success) return null;
  return parsed.data as PatientRow;
}

/**
 * Load the patient row by its primary key.
 * Returns null if not found or parse fails.
 */
export async function loadPatientById(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  patientId: EntityId,
): Promise<PatientRow | null> {
  const { data, error } = await selectOne(supabase, "patient", "id", patientId);
  if (error !== null || data === null) return null;
  const parsed = patientRowSchema.safeParse(data);
  if (!parsed.success) return null;
  return parsed.data as PatientRow;
}

// ─── Onboarding issue helpers ─────────────────────────────────────────────────

/**
 * Load open (unresolved) onboarding issue log entries for an auth user.
 *
 * Used by:
 * - Onboarding state resolution to determine claim flow.
 * - Admin tools to list users with stuck onboarding.
 */
export async function loadOpenOnboardingIssues(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  authUserId: AuthUserId,
): Promise<OnboardingIssueLogRow[]> {
  const { data, error } = await selectMany(
    supabase,
    "onboarding_issue_log",
    "auth_user_id",
    authUserId,
  );

  if (error !== null || data === null) return [];

  const rows: OnboardingIssueLogRow[] = [];
  for (const raw of data) {
    const parsed = onboardingIssueLogRowSchema.safeParse(raw);
    if (parsed.success && parsed.data.resolved_at === null) {
      rows.push(parsed.data as unknown as OnboardingIssueLogRow);
    }
  }
  return rows;
}

/**
 * Check whether the given auth user has any open onboarding issues.
 */
export async function hasOpenOnboardingIssues(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  authUserId: AuthUserId,
): Promise<boolean> {
  const issues = await loadOpenOnboardingIssues(supabase, authUserId);
  return issues.length > 0;
}
