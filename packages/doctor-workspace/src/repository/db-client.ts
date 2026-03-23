/**
 * Internal Supabase client helpers for the doctor-workspace module.
 *
 * Same pattern as packages/prescription/src/repository/db-client.ts:
 * Accept `any` client, work around ungenerated Database types,
 * return results that callers validate.
 *
 * Only this file touches the Supabase client at a low level.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export interface DbError {
  message: string;
  code?: string;
}

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

export async function dbSelectManyWithFilter(
  client: AnyClient,
  table: string,
  conditions: Array<[string, unknown]>,
  inFilter?: { column: string; values: unknown[] },
  options?: {
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
  },
): Promise<{ data: unknown[] | null; error: DbError | null }> {
  let query = client.from(table).select("*");
  for (const [col, val] of conditions) {
    query = query.eq(col, val);
  }
  if (inFilter && inFilter.values.length > 0) {
    query = query.in(inFilter.column, inFilter.values);
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

/** ilike filter for text search (case-insensitive contains). */
export async function dbSelectManyWithSearch(
  client: AnyClient,
  table: string,
  conditions: Array<[string, unknown]>,
  searchColumn: string,
  searchValue: string,
  options?: {
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
  },
): Promise<{ data: unknown[] | null; error: DbError | null }> {
  let query = client.from(table).select("*");
  for (const [col, val] of conditions) {
    query = query.eq(col, val);
  }
  query = query.ilike(searchColumn, `%${searchValue}%`);
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

/** Select count of rows matching conditions. */
export async function dbCount(
  client: AnyClient,
  table: string,
  conditions: Array<[string, unknown]>,
): Promise<number> {
  let query = client.from(table).select("id", { count: "exact", head: true });
  for (const [col, val] of conditions) {
    query = query.eq(col, val);
  }
  const result = await query;
  return result.count ?? 0;
}

/** Select count with an IN filter. */
export async function dbCountWithFilter(
  client: AnyClient,
  table: string,
  conditions: Array<[string, unknown]>,
  inFilter?: { column: string; values: unknown[] },
): Promise<number> {
  let query = client.from(table).select("id", { count: "exact", head: true });
  for (const [col, val] of conditions) {
    query = query.eq(col, val);
  }
  if (inFilter && inFilter.values.length > 0) {
    query = query.in(inFilter.column, inFilter.values);
  }
  const result = await query;
  return result.count ?? 0;
}
