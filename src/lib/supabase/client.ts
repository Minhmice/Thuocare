import { createClient } from "@supabase/supabase-js";
import { getEnvConfig } from "../env";
import { supabaseAuthStorage } from "./authStorage";

const env = getEnvConfig();

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: supabaseAuthStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});
