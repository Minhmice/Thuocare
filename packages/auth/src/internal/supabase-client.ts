/**
 * Internal helpers for calling Supabase RPCs and table queries.
 *
 * CONTEXT: packages/supabase/src/database.types.ts is a placeholder until
 * `supabase gen types typescript --local` is run against the live DB. Until
 * then, Database.public.Functions is `Record<string, never>`, which makes
 * TypeScript reject all `.rpc()` calls. Additionally, the postgrest-js v2.99+
 * rpc() signature uses `Args = never` as the default, which makes generic
 * Record-based casting unreliable.
 *
 * APPROACH: Define `AuthDbClient` — a minimal structural interface describing
 * exactly the DB operations this package needs. Any SupabaseClient satisfies
 * this interface structurally. This avoids fighting the rpc() generic constraints
 * while keeping strong typing on return values.
 *
 * This module is the ONLY place in the auth package that touches Supabase
 * at a low level. All return values are validated with Zod in callers.
 */

// ─── Minimal DB client interface ──────────────────────────────────────────────

/** Minimal subset of the Supabase client that the auth package requires. */
export interface AuthDbClient {
  auth: {
    getUser(): Promise<{
      data: { user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null };
      error: { message: string } | null;
    }>;
  };
  /**
   * RPC call with loose typing.
   * Typed as returning `unknown` — callers validate with Zod.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rpc(fn: string, args?: Record<string, unknown>): PromiseLike<{ data: any; error: { message: string } | null }>;
  from(table: string): {
    select(query?: string): {
      eq(column: string, value: string): {
        maybeSingle(): Promise<{ data: unknown; error: { message: string } | null }>;
        then: PromiseLike<{ data: unknown[]; error: { message: string } | null }>["then"];
      };
    };
  };
}

/**
 * Cast any Supabase client (typed or untyped) to `AuthDbClient`.
 * Called once at the entry point of each auth function.
 * The cast is safe because SupabaseClient satisfies AuthDbClient structurally.
 */
export function toAuthClient(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
): AuthDbClient {
  return client as AuthDbClient;
}

// ─── RPC helper ───────────────────────────────────────────────────────────────

/** Call a Supabase RPC, returning raw data as `unknown`. Validate with Zod in callers. */
export async function callRpc(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  fn: string,
  args?: Record<string, unknown>,
): Promise<{ data: unknown; error: { message: string } | null }> {
  const result = await toAuthClient(client).rpc(fn, args);
  return { data: result.data as unknown, error: result.error };
}

// ─── Table helpers ────────────────────────────────────────────────────────────

/**
 * SELECT a single row by a column = value filter (maybeSingle).
 * Returns the raw row as `unknown` or null. Callers validate with Zod.
 */
export async function selectOne(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  table: string,
  column: string,
  value: unknown,
): Promise<{ data: unknown; error: { message: string } | null }> {
  const result = await toAuthClient(client)
    .from(table)
    .select("*")
    .eq(column, String(value))
    .maybeSingle();
  return { data: result.data, error: result.error };
}

/**
 * SELECT multiple rows matching column = value.
 * Returns raw rows as `unknown[]`. Callers validate / map.
 *
 * This uses a PromiseLike chain since the query builder in supabase-js
 * returns a thenable rather than a native Promise.
 */
export async function selectMany(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  table: string,
  column: string,
  value: unknown,
): Promise<{ data: unknown[] | null; error: { message: string } | null }> {
  // supabase-js query builder is thenable; await resolves it.
  // The result shape is { data: Row[] | null, error: ... }.
  const raw = await new Promise<{ data: unknown[] | null; error: { message: string } | null }>(
    (resolve, reject) => {
      toAuthClient(client)
        .from(table)
        .select("*")
        .eq(column, String(value))
        .then(
          (result) => resolve(result as { data: unknown[] | null; error: { message: string } | null }),
          reject,
        );
    },
  );
  return raw;
}
