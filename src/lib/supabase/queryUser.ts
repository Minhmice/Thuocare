import { supabase } from "./client";

/** Signed-in Supabase user id, or null when there is no session. */
export async function getQueryUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}
