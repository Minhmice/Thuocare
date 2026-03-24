import { z } from "zod";
import { USER_ROLE_VALUES } from "../enums.js";

const userRoleSchema = z.enum(USER_ROLE_VALUES);

const roleLiterals = USER_ROLE_VALUES as readonly string[];

/**
 * Postgres / app entity ids are 8-4-4-4-12 hex. Zod 4's `z.uuid()` enforces RFC variant
 * and version nibbles, so demo seeds like `a0000000-0000-0000-0000-000000000003` fail there
 * and would null out `patient_id` / `organization_id` after RPC parse → stuck `unresolved`.
 */
const UUID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function normalizeUuidRpc(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val !== "string") return null;
  const t = val.trim().toLowerCase();
  if (t === "") return null;
  if (UUID_LIKE.test(t)) return t;
  const compact = t.replace(/-/g, "");
  if (compact.length === 32 && /^[0-9a-f]+$/.test(compact)) {
    const withHyphens = `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20)}`;
    return UUID_LIKE.test(withHyphens) ? withHyphens : null;
  }
  return null;
}

const rpcUuidNullable = z.preprocess(
  normalizeUuidRpc,
  z.union([z.string().regex(UUID_LIKE), z.null()]),
);

/**
 * Email from `current_user_email()` / JWT: null, empty, whitespace, or rare non-string JSON.
 */
const rpcEmailSchema = z.preprocess((val) => {
  if (val === null || val === undefined) return null;
  if (typeof val !== "string") return null;
  const t = val.trim();
  return t === "" ? null : t;
}, z.union([z.email(), z.null()]));

/** DB enum drift or odd serialization → null instead of failing the whole RPC parse. */
const rpcStaffRoleSchema = z.preprocess((val) => {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val !== "string") return null;
  const normalized = val.trim().toLowerCase();
  return roleLiterals.includes(normalized) ? normalized : null;
}, z.union([userRoleSchema, z.null()]));

export const authBindingStatusSchema = z
  .object({
    auth_user_id: rpcUuidNullable.optional(),
    email: rpcEmailSchema.optional(),
    staff_user_account_id: rpcUuidNullable.optional(),
    staff_role: rpcStaffRoleSchema.optional(),
    doctor_profile_id: rpcUuidNullable.optional(),
    patient_id: rpcUuidNullable.optional(),
    organization_id: rpcUuidNullable.optional(),
  })
  .transform((o) => ({
    auth_user_id: o.auth_user_id ?? null,
    email: o.email ?? null,
    staff_user_account_id: o.staff_user_account_id ?? null,
    staff_role: o.staff_role ?? null,
    doctor_profile_id: o.doctor_profile_id ?? null,
    patient_id: o.patient_id ?? null,
    organization_id: o.organization_id ?? null,
  }));

export const claimAccountPayloadSchema = z.object({
  organizationCode: z.string().trim().min(1).optional().nullable(),
});

export const authOnboardingMetadataSchema = z.object({
  actor_type: z.enum(["staff", "patient", "doctor"]),
  organization_code: z.string().trim().optional().nullable(),
  full_name: z.string().trim().optional().nullable(),
});
