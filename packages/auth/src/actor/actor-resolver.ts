/**
 * Actor context resolver.
 *
 * The central pipeline for turning an authenticated Supabase session into a
 * typed, capability-enriched actor context that the rest of the application uses.
 *
 * Flow:
 *   1. Verify session exists (requireAuthenticatedSession).
 *   2. Call `my_auth_binding_status()` RPC — returns binding data from DB.
 *   3. Classify binding data into staff, patient, or unresolved state.
 *   4. Attach FullCapabilities to resolved actors.
 *   5. Return a stable, typed ActorContext.
 *
 * DESIGN: Resolve actor context ONCE at the request/action boundary and pass
 * the result down. Do not call this multiple times per request.
 *
 * Aligns with SQL helpers:
 *   current_staff_user_account_id()  → ResolvedStaffActorContext.userAccountId
 *   current_staff_role()             → ResolvedStaffActorContext.role
 *   current_doctor_profile_id()      → ResolvedStaffActorContext.doctorProfileId
 *   current_patient_id()             → ResolvedPatientActorContext.patientId
 *   current_organization_id()        → context.organizationId
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { authBindingStatusSchema } from "@thuocare/contracts";
import { USER_ROLE_VALUES } from "@thuocare/contracts";
import type { AuthUserId, UserRole } from "@thuocare/contracts";
import { callRpc, selectOne } from "../internal/supabase-client.js";
import { requireAuthenticatedSession } from "../session/session-resolver.js";
import type {
  AnyActorContext,
  RawBindingData,
  ResolvedActorContext,
  ResolvedPatientActorContext,
  ResolvedStaffActorContext,
} from "./actor-types.js";
import { resolveFullCapabilities } from "../capabilities/capability-resolver.js";
import {
  UnresolvedActorError,
  AuthError,
} from "../errors/auth-errors.js";

function isBindingPayloadShape(o: unknown): boolean {
  return (
    typeof o === "object" &&
    o !== null &&
    !Array.isArray(o) &&
    Object.prototype.hasOwnProperty.call(o, "auth_user_id")
  );
}

const MAX_UNWRAP_DEPTH = 12;
const USER_ROLE_SET = new Set<string>(USER_ROLE_VALUES as readonly string[]);

/**
 * Normalize PostgREST / supabase-js RPC payloads for `returns jsonb` functions:
 * - JSON delivered as a string (sometimes double-encoded)
 * - Single-element arrays
 * - Wrapper objects `{ "my_auth_binding_status": <inner> }` where inner may
 *   again be a JSON string
 *
 * Stops unwrapping once the object looks like our binding row (has `auth_user_id`).
 */
function unwrapRpcJsonPayload(data: unknown, depth = 0): unknown {
  if (depth > MAX_UNWRAP_DEPTH) {
    return data;
  }

  if (data == null) {
    return data;
  }

  if (typeof data === "string") {
    const trimmed = data.trim();
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        return unwrapRpcJsonPayload(JSON.parse(trimmed) as unknown, depth + 1);
      } catch {
        return data;
      }
    }
    return data;
  }

  if (Array.isArray(data)) {
    if (data.length === 1) {
      return unwrapRpcJsonPayload(data[0], depth + 1);
    }
    return data;
  }

  if (typeof data === "object" && !Array.isArray(data)) {
    if (isBindingPayloadShape(data)) {
      return data;
    }
    const keys = Object.keys(data as object);
    if (keys.length === 1) {
      const inner = (data as Record<string, unknown>)[keys[0]];
      return unwrapRpcJsonPayload(inner, depth + 1);
    }
  }

  return data;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

/**
 * If `staff_role` is missing from the RPC payload (serialization / Zod edge) but we
 * already have a linked doctor_profile, infer `doctor` so the user is not stuck as
 * `unresolved` right after self-registration.
 */
function resolveStaffRoleForBinding(raw: RawBindingData): UserRole | null {
  if (raw.staff_role !== null) {
    return raw.staff_role;
  }
  const staffLinked =
    raw.staff_user_account_id !== null && raw.organization_id !== null;
  if (staffLinked && raw.doctor_profile_id !== null) {
    return "doctor";
  }
  return null;
}

function classifyBinding(
  authUserId: AuthUserId,
  email: string | null,
  raw: RawBindingData,
): AnyActorContext {
  const isStaffBound =
    raw.staff_user_account_id !== null && raw.organization_id !== null;
  /** Personal-lane patients may have a linked patient row without an organization. */
  const isPatientBound = raw.patient_id !== null;

  const staffRole = resolveStaffRoleForBinding(raw);

  // ── Staff actor ────────────────────────────────────────────────────────────
  if (isStaffBound && staffRole !== null) {
    const staffCtx: ResolvedStaffActorContext = {
      kind: "staff",
      authUserId,
      organizationId: raw.organization_id!,
      userAccountId: raw.staff_user_account_id!,
      role: staffRole,
      doctorProfileId: raw.doctor_profile_id ?? null,
      clinicId: null, // Populated from user_account.clinic_id via actor-data if needed
      capabilities: resolveFullCapabilities({ kind: "staff", role: staffRole }),
    };
    return staffCtx;
  }

  // ── Patient actor ──────────────────────────────────────────────────────────
  if (isPatientBound) {
    const patientCtx: ResolvedPatientActorContext = {
      kind: "patient",
      authUserId,
      organizationId: raw.organization_id ?? null,
      patientId: raw.patient_id!,
      capabilities: resolveFullCapabilities({ kind: "patient" }),
    };
    return patientCtx;
  }

  // ── Unresolved ─────────────────────────────────────────────────────────────
  // Determine why. If we got ANY binding data back, this is partial rather than
  // a clean "never claimed" state.
  const hasPartialData =
    raw.staff_user_account_id !== null ||
    raw.patient_id !== null ||
    raw.organization_id !== null;

  return {
    kind: "unresolved",
    authUserId,
    email,
    bindingState: hasPartialData ? "partial_binding" : "pending_claim",
    rawBinding: raw,
  };
}

function normalizeRole(value: unknown): UserRole | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!USER_ROLE_SET.has(normalized)) return null;
  return normalized as UserRole;
}

async function resolveActorContextFromTables(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  authUserId: AuthUserId,
  email: string | null,
): Promise<AnyActorContext | null> {
  const { data: userRow } = await selectOne(supabase, "user_account", "auth_user_id", authUserId);

  if (userRow && typeof userRow === "object" && !Array.isArray(userRow)) {
    const row = userRow as Record<string, unknown>;
    const userAccountId = typeof row.id === "string" ? row.id : null;
    const organizationId =
      typeof row.organization_id === "string" ? row.organization_id : null;
    const role = normalizeRole(row.role);

    if (userAccountId && organizationId && role) {
      let doctorProfileId: string | null = null;
      const { data: dpRow } = await selectOne(supabase, "doctor_profile", "user_account_id", userAccountId);
      if (
        dpRow &&
        typeof dpRow === "object" &&
        !Array.isArray(dpRow) &&
        typeof (dpRow as Record<string, unknown>).id === "string"
      ) {
        const status = (dpRow as Record<string, unknown>).status;
        if (status === "active" || status === undefined || status === null) {
          doctorProfileId = (dpRow as Record<string, unknown>).id as string;
        }
      }

      return {
        kind: "staff",
        authUserId,
        organizationId,
        userAccountId,
        role,
        doctorProfileId,
        clinicId: null,
        capabilities: resolveFullCapabilities({ kind: "staff", role }),
      };
    }
  }

  const { data: patientRow } = await selectOne(supabase, "patient", "auth_user_id", authUserId);
  if (patientRow && typeof patientRow === "object" && !Array.isArray(patientRow)) {
    const row = patientRow as Record<string, unknown>;
    const patientId = typeof row.id === "string" ? row.id : null;
    const organizationId =
      typeof row.organization_id === "string" ? row.organization_id : null;
    if (patientId) {
      return {
        kind: "patient",
        authUserId,
        organizationId: organizationId ?? null,
        patientId,
        capabilities: resolveFullCapabilities({ kind: "patient" }),
      };
    }
  }

  return null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Resolve the full actor context for the currently authenticated user.
 *
 * Returns an `AnyActorContext`:
 * - `ResolvedStaffActorContext` if a linked user_account is found.
 * - `ResolvedPatientActorContext` if a linked patient row is found.
 * - `UnresolvedActorContext` if the session exists but bindings are missing.
 *
 * Throws `UnauthenticatedError` if there is no valid session.
 * Throws `AuthError` (code: "actor_load_failed") if the RPC call fails.
 */
export async function resolveActorContext(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
): Promise<AnyActorContext> {
  const session = await requireAuthenticatedSession(supabase);

  const { data, error } = await callRpc(supabase, "my_auth_binding_status");

  if (error !== null) {
    const fallback = await resolveActorContextFromTables(
      supabase,
      session.authUserId,
      session.email,
    );
    if (fallback !== null) {
      return fallback;
    }
    throw new AuthError(
      "actor_load_failed",
      "Failed to resolve actor context from DB.",
      error.message,
    );
  }

  const normalized = unwrapRpcJsonPayload(data);

  if (normalized === null || normalized === undefined) {
    const fallback = await resolveActorContextFromTables(
      supabase,
      session.authUserId,
      session.email,
    );
    if (fallback !== null) {
      return fallback;
    }
    throw new AuthError(
      "actor_load_failed",
      "my_auth_binding_status() returned no data.",
      "Expected a JSON object after unwrapping the RPC payload.",
    );
  }

  // Validate the RPC response shape with Zod.
  const parseResult = authBindingStatusSchema.safeParse(normalized);
  if (!parseResult.success) {
    const fallback = await resolveActorContextFromTables(
      supabase,
      session.authUserId,
      session.email,
    );
    if (fallback !== null) {
      return fallback;
    }
    const detail =
      typeof normalized === "object"
        ? `keys=${Object.keys(normalized as object).sort().join(",")}`
        : `type=${typeof normalized}`;
    throw new AuthError(
      "actor_load_failed",
      `my_auth_binding_status() returned an unexpected shape. (${detail})`,
      parseResult.error.message,
    );
  }

  const raw: RawBindingData = {
    auth_user_id: parseResult.data.auth_user_id,
    email: parseResult.data.email,
    staff_user_account_id: parseResult.data.staff_user_account_id,
    staff_role: parseResult.data.staff_role,
    doctor_profile_id: parseResult.data.doctor_profile_id,
    patient_id: parseResult.data.patient_id,
    organization_id: parseResult.data.organization_id,
  };

  return classifyBinding(session.authUserId, session.email, raw);
}

/**
 * Resolve actor context and require it to be fully resolved.
 *
 * Throws `UnresolvedActorError` if the actor context is in the unresolved state.
 * Use this at the top of any handler that requires a fully operational actor.
 */
export async function requireResolvedActorContext(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
): Promise<ResolvedActorContext> {
  const ctx = await resolveActorContext(supabase);

  if (ctx.kind === "unresolved") {
    throw new UnresolvedActorError(
      `Actor binding state: ${ctx.bindingState}. authUserId=${ctx.authUserId}`,
    );
  }

  return ctx;
}

/**
 * Build a full request-scoped actor context object.
 *
 * This is the recommended entry point for server actions and API routes:
 * call this once at the boundary, pass the result to all downstream helpers.
 *
 * Equivalent to calling `resolveActorContext()` but documents intent clearly.
 */
export async function buildRequestActorContext(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
): Promise<AnyActorContext> {
  return resolveActorContext(supabase);
}
