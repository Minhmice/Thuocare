/**
 * Thin typed wrappers around the Supabase client.
 *
 * Uses AnyClient = any to avoid fighting SupabaseClient<Database> generics.
 * All DB errors are converted to thrown Error objects by the callers.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

/** Select multiple rows with arbitrary filter callback. */
export async function dbSelect<T>(
  client: AnyClient,
  table: string,
  columns: string,
  filters: (q: AnyClient) => AnyClient,
): Promise<T[]> {
  const base = client.from(table).select(columns);
  const { data, error } = await filters(base);
  if (error) throw new Error(`db select ${table}: ${error.message}`);
  return (data ?? []) as T[];
}

/** Select a single row; returns null if not found. */
export async function dbSelectOne<T>(
  client: AnyClient,
  table: string,
  columns: string,
  filters: (q: AnyClient) => AnyClient,
): Promise<T | null> {
  const base = client.from(table).select(columns);
  const { data, error } = await filters(base).maybeSingle();
  if (error) throw new Error(`db select one ${table}: ${error.message}`);
  return (data ?? null) as T | null;
}

/** Insert one row and return it. */
export async function dbInsert<T>(
  client: AnyClient,
  table: string,
  row: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await client
    .from(table)
    .insert(row)
    .select()
    .single();
  if (error) throw new Error(`db insert ${table}: ${error.message}`);
  return data as T;
}

/** Insert multiple rows. Returns count. */
export async function dbInsertMany(
  client: AnyClient,
  table: string,
  rows: Record<string, unknown>[],
): Promise<number> {
  if (rows.length === 0) return 0;
  const { error, count } = await client.from(table).insert(rows);
  if (error) throw new Error(`db insert many ${table}: ${error.message}`);
  return count ?? rows.length;
}

/**
 * Upsert one row (insert or update on conflict).
 * onConflict is the column(s) that define uniqueness, e.g. "prescription_item_id,scheduled_time".
 */
export async function dbUpsert<T>(
  client: AnyClient,
  table: string,
  row: Record<string, unknown>,
  onConflict: string,
): Promise<T> {
  const { data, error } = await client
    .from(table)
    .upsert(row, { onConflict })
    .select()
    .single();
  if (error) throw new Error(`db upsert ${table}: ${error.message}`);
  return data as T;
}

/** Update rows matching a filter; returns updated rows. */
export async function dbUpdate<T>(
  client: AnyClient,
  table: string,
  updates: Record<string, unknown>,
  filters: (q: AnyClient) => AnyClient,
): Promise<T[]> {
  const base = client.from(table).update(updates);
  const { data, error } = await filters(base).select();
  if (error) throw new Error(`db update ${table}: ${error.message}`);
  return (data ?? []) as T[];
}
