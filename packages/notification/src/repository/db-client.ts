// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export async function dbSelect<T>(
  client: AnyClient,
  table: string,
  columns: string,
  filters: (q: AnyClient) => AnyClient,
): Promise<T[]> {
  const { data, error } = await filters(client.from(table).select(columns));
  if (error) throw new Error(`db select ${table}: ${error.message}`);
  return (data ?? []) as T[];
}

export async function dbSelectOne<T>(
  client: AnyClient,
  table: string,
  columns: string,
  filters: (q: AnyClient) => AnyClient,
): Promise<T | null> {
  const { data, error } = await filters(client.from(table).select(columns)).maybeSingle();
  if (error) throw new Error(`db select one ${table}: ${error.message}`);
  return (data ?? null) as T | null;
}

export async function dbInsert<T>(
  client: AnyClient,
  table: string,
  row: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await client.from(table).insert(row).select().single();
  if (error) throw new Error(`db insert ${table}: ${error.message}`);
  return data as T;
}

/**
 * Upsert with ignoreDuplicates = true.
 * INSERT ... ON CONFLICT DO NOTHING — safe re-run for triggers.
 * Returns the row if inserted, null if skipped (duplicate).
 */
export async function dbUpsertIgnore<T>(
  client: AnyClient,
  table: string,
  row: Record<string, unknown>,
  onConflict: string,
): Promise<T | null> {
  const { data, error } = await client
    .from(table)
    .upsert(row, { onConflict, ignoreDuplicates: true })
    .select()
    .maybeSingle();
  if (error) throw new Error(`db upsert ignore ${table}: ${error.message}`);
  return (data ?? null) as T | null;
}

export async function dbUpdate<T>(
  client: AnyClient,
  table: string,
  updates: Record<string, unknown>,
  filters: (q: AnyClient) => AnyClient,
): Promise<T> {
  const { data, error } = await filters(client.from(table).update(updates)).select().single();
  if (error) throw new Error(`db update ${table}: ${error.message}`);
  return data as T;
}
