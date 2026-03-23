/**
 * Internal Supabase client helpers for the prescription module.
 *
 * Same pattern as packages/auth/src/internal/supabase-client.ts:
 * Accept `any` client, work around the ungenerated Database types,
 * and return strongly-typed results validated by callers.
 *
 * This is the ONLY file in the prescription package that touches the
 * Supabase client at a low level. All other functions receive typed results.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export interface DbError {
  message: string;
  code?: string;
}

// ─── INSERT ───────────────────────────────────────────────────────────────────

/**
 * Insert a row into `table` and return the first inserted row.
 * `data` should match the table's Insert type from contracts.
 */
export async function dbInsert(
  client: AnyClient,
  table: string,
  data: Record<string, unknown>,
): Promise<{ data: unknown; error: DbError | null }> {
  const result = await client.from(table).insert(data).select().single();
  return { data: result.data, error: result.error };
}

// ─── SELECT ───────────────────────────────────────────────────────────────────

/**
 * Select a single row by one or more column = value conditions.
 * Returns null if not found (maybeSingle — no error on empty).
 */
export async function dbSelectOne(
  client: AnyClient,
  table: string,
  conditions: Array<[string, unknown]>,
): Promise<{ data: unknown; error: DbError | null }> {
  let query = client.from(table).select("*");
  for (const [col, val] of conditions) {
    query = query.eq(col, val);
  }
  const result = await query.maybeSingle();
  return { data: result.data, error: result.error };
}

/**
 * Select multiple rows matching all given conditions, with optional ordering.
 */
export async function dbSelectMany(
  client: AnyClient,
  table: string,
  conditions: Array<[string, unknown]>,
  options?: {
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
  },
): Promise<{ data: unknown[] | null; error: DbError | null }> {
  let query = client.from(table).select("*");
  for (const [col, val] of conditions) {
    query = query.eq(col, val);
  }
  if (options?.orderBy) {
    query = query.order(options.orderBy.column, {
      ascending: options.orderBy.ascending ?? true,
    });
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  const result = await query;
  return { data: result.data, error: result.error };
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

/**
 * Update rows matching all given conditions and return the updated rows.
 */
export async function dbUpdate(
  client: AnyClient,
  table: string,
  data: Record<string, unknown>,
  conditions: Array<[string, unknown]>,
): Promise<{ data: unknown[] | null; error: DbError | null }> {
  let query = client.from(table).update(data);
  for (const [col, val] of conditions) {
    query = query.eq(col, val);
  }
  const result = await query.select();
  return { data: result.data, error: result.error };
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

/**
 * Delete rows matching all given conditions.
 */
export async function dbDelete(
  client: AnyClient,
  table: string,
  conditions: Array<[string, unknown]>,
): Promise<{ error: DbError | null }> {
  let query = client.from(table).delete();
  for (const [col, val] of conditions) {
    query = query.eq(col, val);
  }
  const result = await query;
  return { error: result.error };
}

// ─── COUNT (max) ──────────────────────────────────────────────────────────────

/**
 * Get the maximum integer value of a column matching conditions.
 * Returns 0 if no rows match (useful for line_no auto-increment).
 */
export async function dbMaxInt(
  client: AnyClient,
  table: string,
  column: string,
  conditions: Array<[string, unknown]>,
): Promise<number> {
  let query = client.from(table).select(column);
  for (const [col, val] of conditions) {
    query = query.eq(col, val);
  }
  query = query.order(column, { ascending: false }).limit(1);
  const result = await query.maybeSingle();
  if (result.error || result.data === null) return 0;
  const val = (result.data as Record<string, unknown>)[column];
  return typeof val === "number" ? val : 0;
}
