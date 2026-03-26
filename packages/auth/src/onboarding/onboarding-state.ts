/**
 * Onboarding state resolution and claim flow helpers.
 *
 * Context:
 * When a user signs up, the DB trigger `handle_auth_user_onboarding` attempts
 * to auto-link the auth user to a matching user_account or patient row by email.
 * If the trigger fails (wrong email, org not found, multiple matches, etc.), it
 * logs an entry in `onboarding_issue_log` and leaves the account unlinked.
 *
 * Users in this state must go through a "claim" or registration flow:
 *   - Staff:   `claim_my_staff_account(organization_code?)`
 *   - Doctor:  `register_my_doctor_account(organization_code, full_name)` (creates profile or links)
 *   - Patient: `claim_my_patient_account(organization_code?)`
 *
 * This module provides:
 * - `OnboardingState` — typed description of the current onboarding situation.
 * - `resolveOnboardingState()` — inspect binding + issues and return state.
 * - `claimStaffAccount()` / `claimPatientAccount()` / `registerMyDoctorAccount()` — invoke RPCs.
 * - `resolveOnboardingIssues()` — for admin actors managing stuck accounts.
 *
 * NOTE: This module handles runtime state only.
 * It does NOT build onboarding UI or manage redirect flows.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { OnboardingIssueCode } from "@thuocare/contracts";
import { ONBOARDING_ISSUE_CODE_VALUES } from "@thuocare/contracts";
import { loadOpenOnboardingIssues } from "../data/actor-data.js";
import { callRpc, selectMany } from "../internal/supabase-client.js";
import { requireAuthenticatedSession } from "../session/session-resolver.js";
import type { AnyActorContext, UnresolvedActorContext } from "../actor/actor-types.js";
import {
  AuthError,
  OnboardingIncompleteError,
} from "../errors/auth-errors.js";
import type { EntityId } from "@thuocare/contracts";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * The onboarding situation of the current auth user.
 */
export type OnboardingStatus =
  | "complete"            // Actor fully resolved — no onboarding action needed
  | "pending_claim"       // No bindings found — user needs to claim an account
  | "claim_conflict"      // Multiple matching profiles found — admin must resolve
  | "already_linked"      // Email already linked to another auth user
  | "org_not_found"       // Organization code in signup metadata was invalid
  | "no_matching_profile" // No user_account or patient matched the signup email
  | "unknown_issue";      // An issue was logged but it doesn't match known codes

export interface OnboardingState {
  status: OnboardingStatus;
  /**
   * The most recent open onboarding issue, if any.
   * Null if no issues exist or all have been resolved.
   */
  latestIssue: OnboardingIssueDetail | null;
  /** Whether the auth user has a staff binding. */
  hasStaffBinding: boolean;
  /** Whether the auth user has a patient binding. */
  hasPatientBinding: boolean;
}

export interface OnboardingIssueDetail {
  id: EntityId;
  issueCode: OnboardingIssueCode;
  actorType: "staff" | "patient" | "unknown";
  organizationCode: string | null;
  createdAt: string;
  resolved: boolean;
}

/** Result of a claim RPC call. */
export type ClaimResult =
  | { success: true; message: string }
  | { success: false; error: string; issueCode?: OnboardingIssueCode };

export type SelfServeCareLane = "personal" | "family";

// ─── Zod schemas for RPC responses ───────────────────────────────────────────

const onboardingIssueRowSchema = z.object({
  id: z.string(),
  issue_code: z.enum(ONBOARDING_ISSUE_CODE_VALUES),
  actor_type: z.enum(["staff", "patient", "unknown"]),
  organization_code: z.string().nullable(),
  resolved_at: z.string().nullable(),
  created_at: z.string(),
});

/**
 * PostgREST returns `claim_my_*_account` as a scalar **uuid** on success, or **null**
 * when linking failed (issue logged in onboarding_issue_log). Older code wrongly
 * expected a JSON envelope — that shape does not exist in SQL.
 */
function unwrapRpcScalarPayload(data: unknown, depth = 0): unknown {
  if (depth > 8 || data == null) return data;

  if (typeof data === "string") {
    const t = data.trim();
    if (
      (t.startsWith("{") && t.endsWith("}")) ||
      (t.startsWith("[") && t.endsWith("]"))
    ) {
      try {
        return unwrapRpcScalarPayload(JSON.parse(t) as unknown, depth + 1);
      } catch {
        return data;
      }
    }
    return data;
  }

  if (Array.isArray(data) && data.length === 1) {
    return unwrapRpcScalarPayload(data[0], depth + 1);
  }

  if (typeof data === "object" && !Array.isArray(data)) {
    const keys = Object.keys(data as object);
    if (keys.length === 1) {
      return unwrapRpcScalarPayload(
        (data as Record<string, unknown>)[keys[0]],
        depth + 1,
      );
    }
  }

  return data;
}

function parseUuidClaimRpc(data: unknown): string | null {
  const u = unwrapRpcScalarPayload(data);
  if (u === null || u === undefined) return null;
  if (typeof u !== "string") return null;
  const t = u.trim();
  return z.uuid().safeParse(t).success ? t : null;
}

// ─── Onboarding state resolution ─────────────────────────────────────────────

/**
 * Resolve the onboarding state for the current auth user.
 *
 * Accepts either a raw supabase client (resolves session internally) or
 * an already-resolved `UnresolvedActorContext` for efficiency when the
 * caller already has the actor context loaded.
 */
export async function resolveOnboardingState(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  actor: AnyActorContext,
): Promise<OnboardingState> {
  if (actor.kind !== "unresolved") {
    // Actor is fully resolved — onboarding is complete
    return {
      status: "complete",
      latestIssue: null,
      hasStaffBinding: actor.kind === "staff",
      hasPatientBinding: actor.kind === "patient",
    };
  }

  const unresolvedActor: UnresolvedActorContext = actor;
  const hasStaffBinding = unresolvedActor.rawBinding.staff_user_account_id !== null;
  const hasPatientBinding = unresolvedActor.rawBinding.patient_id !== null;

  // Fetch open onboarding issues for this auth user
  const { data: rawIssues, error } = await selectMany(
    supabase,
    "onboarding_issue_log",
    "auth_user_id",
    unresolvedActor.authUserId,
  );

  if (error !== null) {
    // Can't load issues — treat as unknown state, do not throw (onboarding is non-critical path)
    return {
      status: "unknown_issue",
      latestIssue: null,
      hasStaffBinding,
      hasPatientBinding,
    };
  }

  // Parse and filter to unresolved issues
  const issues: OnboardingIssueDetail[] = [];
  for (const raw of rawIssues ?? []) {
    const parsed = onboardingIssueRowSchema.safeParse(raw);
    if (parsed.success) {
      issues.push({
        id: parsed.data.id,
        issueCode: parsed.data.issue_code,
        actorType: parsed.data.actor_type,
        organizationCode: parsed.data.organization_code,
        createdAt: parsed.data.created_at,
        resolved: parsed.data.resolved_at !== null,
      });
    }
  }

  const openIssues = issues.filter((i) => !i.resolved);
  const latestIssue = openIssues.at(0) ?? null;

  const status = deriveOnboardingStatus(unresolvedActor, latestIssue);

  return {
    status,
    latestIssue,
    hasStaffBinding,
    hasPatientBinding,
  };
}

function deriveOnboardingStatus(
  actor: UnresolvedActorContext,
  latestIssue: OnboardingIssueDetail | null,
): OnboardingStatus {
  if (latestIssue === null) {
    // No issues logged — actor simply hasn't claimed yet
    return actor.bindingState === "pending_claim" ? "pending_claim" : "unknown_issue";
  }

  switch (latestIssue.issueCode) {
    case "claim_conflict":
    case "multiple_matching_profiles":
    case "profile_already_linked":
      return "claim_conflict";
    case "org_not_found":
      return "org_not_found";
    case "missing_organization_code":
      return "org_not_found";
    case "no_matching_profile":
      return "no_matching_profile";
    case "registration_full_name_required":
      return "unknown_issue";
    case "missing_actor_type":
    case "unsupported_actor_type":
    case "missing_email":
      return "unknown_issue";
    default:
      return "unknown_issue";
  }
}

// ─── Claim RPCs ───────────────────────────────────────────────────────────────

function describeStaffClaimFailure(
  issueCode: string | undefined,
  organizationCode: string | null | undefined,
  sessionEmail: string | null | undefined,
): string {
  const oc = organizationCode?.trim() || null;
  const em = sessionEmail ?? null;
  switch (issueCode) {
    case "org_not_found":
      return `Organization code "${oc ?? "(none)"}" was not found. Run supabase/seed.sql in the SQL Editor (code DEMO) or fix the spelling.`;
    case "no_matching_profile":
      return `No staff profile matches your login email${em ? ` (${em})` : ""} in this organization. Demo seed expects user_account email doctor@demo.com — use that email to sign in, or ask an admin to add your email.`;
    case "missing_email":
      return "Your login session has no email. Sign out and sign in again with email/password.";
    case "multiple_matching_profiles":
      return "More than one staff profile matches your email. Enter the organization code (e.g. DEMO) or contact an admin.";
    case "profile_already_linked":
      return "This staff profile is already linked to a different login.";
    case "claim_conflict":
      return "Account linking conflict. Contact an administrator.";
    case "missing_organization_code":
      return "Organization code is required. Enter the code for your organization (e.g. DEMO after running seed).";
    case "registration_full_name_required":
      return "Full name is required to finish doctor registration. Enter your name below or sign up again with your full name.";
    default:
      return "Could not link your staff account. Check email, organization code, and that seed data exists.";
  }
}

/**
 * Invoke `claim_my_staff_account()` for the current auth user.
 *
 * The RPC matches the auth user's email against user_account.email within
 * the given organization and links auth_user_id if exactly one match exists.
 *
 * @param organizationCode - Optional org code for disambiguation when the user
 *   belongs to multiple orgs. Pass null/undefined to let the DB auto-resolve.
 */
export async function claimStaffAccount(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  organizationCode?: string | null,
): Promise<ClaimResult> {
  const session = await requireAuthenticatedSession(supabase);

  const args = organizationCode != null ? { p_organization_code: organizationCode } : {};
  const { data, error } = await callRpc(supabase, "claim_my_staff_account", args);

  if (error !== null) {
    throw new AuthError(
      "actor_load_failed",
      "claim_my_staff_account() RPC failed.",
      error.message,
    );
  }

  const id = parseUuidClaimRpc(data);
  if (id !== null) {
    return { success: true, message: "Staff account linked successfully." };
  }

  const issues = await loadOpenOnboardingIssues(supabase, session.authUserId);
  const latest = issues
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  const issueCodeRaw = latest?.issue_code;

  const failure: Extract<ClaimResult, { success: false }> = {
    success: false,
    error: describeStaffClaimFailure(
      issueCodeRaw,
      organizationCode ?? latest?.organization_code ?? undefined,
      session.email,
    ),
  };
  if (
    issueCodeRaw &&
    (ONBOARDING_ISSUE_CODE_VALUES as readonly string[]).includes(issueCodeRaw)
  ) {
    failure.issueCode = issueCodeRaw as OnboardingIssueCode;
  }
  return failure;
}

/**
 * Invoke `register_my_doctor_account(organization_code, full_name)` for the current user.
 * Creates `user_account` + `doctor_profile` when no row exists for this email in the org;
 * otherwise links like `claim_my_staff_account`.
 */
export async function registerMyDoctorAccount(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  organizationCode: string,
  fullName: string,
): Promise<ClaimResult> {
  const session = await requireAuthenticatedSession(supabase);

  const oc = organizationCode.trim();
  const fn = fullName.trim();
  if (oc === "") {
    return {
      success: false,
      error: describeStaffClaimFailure("missing_organization_code", null, session.email),
      issueCode: "missing_organization_code",
    };
  }
  if (fn === "") {
    return {
      success: false,
      error: describeStaffClaimFailure("registration_full_name_required", oc, session.email),
      issueCode: "registration_full_name_required",
    };
  }

  const { data, error } = await callRpc(supabase, "register_my_doctor_account", {
    p_organization_code: oc,
    p_full_name: fn,
  });

  if (error !== null) {
    const e = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };
    const detail = [e.message, e.details, e.hint].filter(Boolean).join(" | ");
    throw new AuthError(
      "actor_load_failed",
      `register_my_doctor_account() failed${detail ? `: ${detail}` : ""}.`,
      detail || undefined,
    );
  }

  const id = parseUuidClaimRpc(data);
  if (id !== null) {
    return { success: true, message: "Doctor account registered successfully." };
  }

  const issues = await loadOpenOnboardingIssues(supabase, session.authUserId);
  const latest = issues
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  const issueCodeRaw = latest?.issue_code;

  const failure: Extract<ClaimResult, { success: false }> = {
    success: false,
    error: describeStaffClaimFailure(
      issueCodeRaw,
      latest?.organization_code ?? oc,
      session.email,
    ),
  };
  if (
    issueCodeRaw &&
    (ONBOARDING_ISSUE_CODE_VALUES as readonly string[]).includes(issueCodeRaw)
  ) {
    failure.issueCode = issueCodeRaw as OnboardingIssueCode;
  }
  if (!failure.issueCode && issues.length === 0) {
    failure.error = `${failure.error} Apply Supabase migrations for register_my_doctor_account on this project, or sign out and sign in again.`;
  }
  return failure;
}

/**
 * Invoke `claim_my_patient_account()` for the current auth user.
 *
 * Same semantics as `claimStaffAccount` but for patient rows.
 */
function describePatientClaimFailure(
  issueCode: string | undefined,
  organizationCode: string | null | undefined,
  sessionEmail: string | null | undefined,
): string {
  const oc = organizationCode?.trim() || null;
  const em = sessionEmail ?? null;
  switch (issueCode) {
    case "org_not_found":
      return `Organization code "${oc ?? "(none)"}" was not found. Check spelling or leave the code empty if you are not clinic-linked.`;
    case "no_matching_profile":
      return `No hospital patient record matches your email${em ? ` (${em})` : ""}. If you meant to track your own medications only, continue with personal account setup.`;
    case "multiple_matching_profiles":
      return "More than one patient record matches your email. Enter your organization code or contact your clinic.";
    case "profile_already_linked":
      return "This patient record is already linked to a different login.";
    case "claim_conflict":
      return "Account linking conflict. Contact an administrator.";
    case "missing_email":
      return "Your login session has no email. Sign out and sign in again with email/password.";
    default:
      return "Could not link a clinic patient record to this login. Check your email and organization code.";
  }
}

/**
 * After a failed `claimPatientAccount`, self-serve bootstrap (`bootstrap_self_serve_account`)
 * must run only when the claim failed because no clinic patient matched — not on conflicts
 * or already-linked profiles.
 */
export function patientClaimFailureAllowsSelfServeBootstrap(result: ClaimResult): boolean {
  return !result.success && result.issueCode === "no_matching_profile";
}

export async function bootstrapSelfServePatientAccount(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  careLane: SelfServeCareLane,
): Promise<ClaimResult> {
  const lane = careLane === "family" ? "family" : "personal";

  const { data, error } = await callRpc(supabase, "bootstrap_self_serve_account", {
    p_care_lane: lane,
  });

  if (error !== null) {
    const missingFn = error.message.includes("Could not find the function");
    if (missingFn) {
      return {
        success: false,
        error:
          "Account setup is not yet fully deployed on this instance. A database migration is pending (bootstrap_self_serve_account). Please contact support or try again later.",
      };
    }

    return {
      success: false,
      error: error.message || "Account setup failed. Please try again.",
    };
  }

  const id = parseUuidClaimRpc(data);
  if (id !== null) {
    return { success: true, message: "Self-serve patient account bootstrapped successfully." };
  }

  return {
    success: false,
    error: "Account setup failed. Please try again.",
  };
}

export async function claimPatientAccount(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  organizationCode?: string | null,
): Promise<ClaimResult> {
  const session = await requireAuthenticatedSession(supabase);

  const args = organizationCode != null ? { p_organization_code: organizationCode } : {};
  const { data, error } = await callRpc(supabase, "claim_my_patient_account", args);

  if (error !== null) {
    throw new AuthError(
      "actor_load_failed",
      "claim_my_patient_account() RPC failed.",
      error.message,
    );
  }

  const id = parseUuidClaimRpc(data);
  if (id !== null) {
    return { success: true, message: "Patient account linked successfully." };
  }

  const issues = await loadOpenOnboardingIssues(supabase, session.authUserId);
  const latest = issues
    .filter((row) => row.actor_type === "patient")
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  const issueCodeRaw = latest?.issue_code;

  const failure: Extract<ClaimResult, { success: false }> = {
    success: false,
    error: describePatientClaimFailure(
      issueCodeRaw,
      organizationCode ?? latest?.organization_code ?? undefined,
      session.email,
    ),
  };
  if (
    issueCodeRaw &&
    (ONBOARDING_ISSUE_CODE_VALUES as readonly string[]).includes(issueCodeRaw)
  ) {
    failure.issueCode = issueCodeRaw as OnboardingIssueCode;
  }
  return failure;
}

/**
 * Guard for onboarding-incomplete states.
 *
 * If the actor is unresolved, throws `OnboardingIncompleteError` with a
 * state-aware message so the UI knows which flow to show.
 */
export function assertOnboardingComplete(actor: AnyActorContext): void {
  if (actor.kind === "unresolved") {
    throw new OnboardingIncompleteError(
      `Binding state: ${actor.bindingState}. Auth user: ${actor.authUserId}`,
    );
  }
}
