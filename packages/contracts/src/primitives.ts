/**
 * Shared primitive aliases aligned with PostgreSQL / API transport.
 * Keep these lightweight — they document intent without heavy branding.
 */

/** UUID primary keys from `gen_random_uuid()` */
export type EntityId = string;

/** Supabase `auth.users.id` */
export type AuthUserId = string;

/** Calendar date (`date` column), ISO 8601 `YYYY-MM-DD` */
export type IsoDate = string;

/** `timestamptz` serialized as ISO 8601 */
export type IsoDateTime = string;

/** Human-facing organization short code (`organization.code`) */
export type OrganizationCode = string;

/** E.164 or local practice — stored as free-text in SQL */
export type Phone = string;

/** Lowercased email for matching where applicable */
export type Email = string;

/**
 * `numeric(12,4)` from PostgreSQL — use string at the boundary to preserve precision.
 */
export type DecimalQuantity = string;

/**
 * `numeric(5,4)` ratio such as `earliest_refill_ratio`.
 */
export type Ratio = string;

export type DaysSupply = number;
export type RefillCount = number;

/** Line-level patient directions (`patient_instruction_text`, summaries) */
export type PatientInstructionText = string;

/** JSONB payloads: structured schedule, onboarding details, event payloads */
export type JsonObject = Record<string, unknown>;
export type JsonArray = unknown[];
export type JsonValue = JsonObject | JsonArray | string | number | boolean | null;
