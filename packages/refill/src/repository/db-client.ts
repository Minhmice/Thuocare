/**
 * Thin typed DB wrappers — AnyClient = any pattern.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

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

export async function dbInsert<T>(
  client: AnyClient,
  table: string,
  row: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await client.from(table).insert(row).select().single();
  if (error) throw new Error(`db insert ${table}: ${error.message}`);
  return data as T;
}

export async function dbInsertMany<T>(
  client: AnyClient,
  table: string,
  rows: Record<string, unknown>[],
): Promise<T[]> {
  if (rows.length === 0) return [];
  const { data, error } = await client.from(table).insert(rows).select();
  if (error) throw new Error(`db insert many ${table}: ${error.message}`);
  return (data ?? []) as T[];
}

export async function dbUpdate<T>(
  client: AnyClient,
  table: string,
  updates: Record<string, unknown>,
  filters: (q: AnyClient) => AnyClient,
): Promise<T> {
  const base = client.from(table).update(updates);
  const { data, error } = await filters(base).select().single();
  if (error) throw new Error(`db update ${table}: ${error.message}`);
  return data as T;
}

export async function dbCount(
  client: AnyClient,
  table: string,
  filters: (q: AnyClient) => AnyClient,
): Promise<number> {
  const base = client.from(table).select("*", { count: "exact", head: true });
  const { count, error } = await filters(base);
  if (error) throw new Error(`db count ${table}: ${error.message}`);
  return count ?? 0;
}
