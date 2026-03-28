import { createClient } from "@supabase/supabase-js";
import { getEnvConfig } from "../env";

const env = getEnvConfig();

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});
