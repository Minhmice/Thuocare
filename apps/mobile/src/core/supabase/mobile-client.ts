import "react-native-url-polyfill/auto";

import * as SecureStore from "expo-secure-store";
import { AppState, Platform } from "react-native";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@thuocare/supabase";

/** Supabase auth storage shape (async get/set/remove). */
type AuthStorageAdapter = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const SESSION_STORAGE_KEY_PREFIX = "thuocare-mobile-auth";

function sanitizeKeyPart(keyPart: string): string {
  // Expo SecureStore only allows: [a-zA-Z0-9._-]
  const sanitized = keyPart.replace(/[^a-zA-Z0-9._-]/g, "");
  if (sanitized.length > 0) return sanitized;

  // If the key part becomes empty (all illegal chars), fall back to a deterministic non-empty value.
  // Keep it within allowed chars.
  let hash = 0;
  for (let i = 0; i < keyPart.length; i++) {
    hash = (hash * 31 + keyPart.charCodeAt(i)) >>> 0; // unsigned
  }
  return `k${hash.toString(36)}`;
}

function buildAuthStorageKey(key: string): string {
  // Prefix is constant (non-empty, already safe). Use '.' as a separator (allowed by SecureStore).
  return `${SESSION_STORAGE_KEY_PREFIX}.${sanitizeKeyPart(key)}`;
}

/** expo-secure-store is not available during Expo web SSR (Node); native module is missing there. */
const webSsrNoopStorage: AuthStorageAdapter = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

function createWebLocalStorageAdapter(): AuthStorageAdapter {
  return {
    getItem: async (key) => {
      try {
        return window.localStorage.getItem(buildAuthStorageKey(key));
      } catch {
        return null;
      }
    },
    setItem: async (key, value) => {
      try {
        window.localStorage.setItem(buildAuthStorageKey(key), value);
      } catch {
        /* quota / private mode */
      }
    },
    removeItem: async (key) => {
      try {
        window.localStorage.removeItem(buildAuthStorageKey(key));
      } catch {
        /* ignore */
      }
    },
  };
}

function getAuthStorage(): AuthStorageAdapter {
  if (Platform.OS === "web") {
    if (typeof window === "undefined") {
      return webSsrNoopStorage;
    }
    return createWebLocalStorageAdapter();
  }

  return {
    getItem: (key) => SecureStore.getItemAsync(buildAuthStorageKey(key)),
    setItem: (key, value) => SecureStore.setItemAsync(buildAuthStorageKey(key), value),
    removeItem: (key) => SecureStore.deleteItemAsync(buildAuthStorageKey(key)),
  };
}

function getRequiredEnv(name: "EXPO_PUBLIC_SUPABASE_URL" | "EXPO_PUBLIC_SUPABASE_ANON_KEY"): string {
  const value = process.env[name]?.trim();
  if (!value) {
    const useMocks = process.env.EXPO_PUBLIC_USE_MOCKS === "1" || process.env.EXPO_PUBLIC_USE_MOCKS === "true";
    if (useMocks) {
      // Mock-first MVP: allow app to boot without Supabase env.
      return name === "EXPO_PUBLIC_SUPABASE_URL" ? "https://example.supabase.co" : "public-anon-placeholder";
    }
    throw new Error(`[mobile-supabase] Missing required env var ${name}. Set ${name} in apps/mobile/.env.local.`);
  }
  return value;
}

function getValidatedSupabaseUrl(): string {
  const url = getRequiredEnv("EXPO_PUBLIC_SUPABASE_URL");
  if (!url.startsWith("https://")) {
    throw new Error(
      `[mobile-supabase] EXPO_PUBLIC_SUPABASE_URL must start with "https://". Received: "${url}".`,
    );
  }
  return url;
}

if (process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
  throw new Error(
    "[mobile-supabase] SUPABASE_SERVICE_ROLE_KEY detected in mobile runtime. Remove it from mobile env files immediately.",
  );
}

export const mobileSupabase: SupabaseClient<Database> = createClient<Database>(
  getValidatedSupabaseUrl(),
  getRequiredEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY"),
  {
    auth: {
      storage: getAuthStorage(),
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
