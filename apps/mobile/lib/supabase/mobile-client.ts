import "react-native-url-polyfill/auto";

import * as SecureStore from "expo-secure-store";
import { AppState } from "react-native";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@thuocare/supabase";

const SESSION_STORAGE_KEY_PREFIX = "thuocare-mobile-auth";

function getRequiredEnv(name: "EXPO_PUBLIC_SUPABASE_URL" | "EXPO_PUBLIC_SUPABASE_ANON_KEY"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required mobile env var: ${name}`);
  }
  return value;
}

if (process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY must never be available in the mobile runtime.",
  );
}

const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(`${SESSION_STORAGE_KEY_PREFIX}:${key}`),
  setItem: (key: string, value: string) =>
    SecureStore.setItemAsync(`${SESSION_STORAGE_KEY_PREFIX}:${key}`, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(`${SESSION_STORAGE_KEY_PREFIX}:${key}`),
};

export const mobileSupabase: SupabaseClient<Database> = createClient<Database>(
  getRequiredEnv("EXPO_PUBLIC_SUPABASE_URL"),
  getRequiredEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY"),
  {
    auth: {
      storage: secureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

export function bindMobileSupabaseAutoRefresh() {
  mobileSupabase.auth.startAutoRefresh();

  const subscription = AppState.addEventListener("change", (state) => {
    if (state === "active") {
      mobileSupabase.auth.startAutoRefresh();
      return;
    }
    mobileSupabase.auth.stopAutoRefresh();
  });

  return () => {
    subscription.remove();
    mobileSupabase.auth.stopAutoRefresh();
  };
}
