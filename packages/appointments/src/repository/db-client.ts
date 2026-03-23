/**
 * Low-level Supabase query helpers for @thuocare/appointments.
 * Uses AnyClient to avoid fighting ungenerated Database types.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryFn = (q: any) => any;

export async function dbSelect<T>(
  client: AnyClient,
  table: string,
  select: string,
  queryFn: QueryFn,
): Promise<T[]> {
  const { data, error } = await queryFn(client.from(table).select(select));
  if (error) throw new Error(error.message);
  return (data ?? []) as T[];
}

export async function dbSelectOne<T>(
  client: AnyClient,
  table: string,
  select: string,
  queryFn: QueryFn,
): Promise<T | null> {
  const { data, error } = await queryFn(client.from(table).select(select)).maybeSingle();
  if (error) throw new Error(error.message);
  return data as T | null;
}

export async function dbInsert<T>(
  client: AnyClient,
  table: string,
  row: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await client.from(table).insert(row).select("*").single();
  if (error) throw new Error(error.message);
  return data as T;
}

export async function dbUpdate<T>(
  client: AnyClient,
  table: string,
  patch: Record<string, unknown>,
  queryFn: QueryFn,
): Promise<T> {
  const { data, error } = await queryFn(client.from(table).update(patch)).select("*").single();
  if (error) throw new Error(error.message);
  return data as T;
}
