import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Supabase Auth storage for Expo:
 * - Web: localStorage (+ memory fallback)
 * - iOS / Android: expo-secure-store (native module Expo links reliably).
 *   Avoids @react-native-async-storage on auth, which often throws
 *   "Native module is null, cannot access legacy storage" in broken / mixed builds.
 */
const memory = new Map<string, string>();

/** Stay under typical SecureStore per-item limits (Android is the tightest). */
const CHUNK_SIZE = 1800;

function readWeb(key: string): string | null {
  try {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem(key);
    }
  } catch {
    /* ignore */
  }
  return memory.get(key) ?? null;
}

function writeWeb(key: string, value: string): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, value);
      return;
    }
  } catch {
    /* ignore */
  }
  memory.set(key, value);
}

function removeWeb(key: string): void {
  memory.delete(key);
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}

function isIosAndroid(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}

async function clearChunked(key: string): Promise<void> {
  const nStr = await SecureStore.getItemAsync(`${key}.__n`).catch(() => null);
  await SecureStore.deleteItemAsync(`${key}.__n`).catch(() => undefined);
  if (nStr) {
    const n = parseInt(nStr, 10);
    if (Number.isFinite(n) && n > 0) {
      for (let i = 0; i < n; i++) {
        await SecureStore.deleteItemAsync(`${key}.__${i}`).catch(
          () => undefined
        );
      }
    }
  }
}

async function secureGet(key: string): Promise<string | null> {
  try {
    const single = await SecureStore.getItemAsync(key);
    if (single != null && single.length > 0) {
      return single;
    }
    const nStr = await SecureStore.getItemAsync(`${key}.__n`);
    if (!nStr) {
      return null;
    }
    const n = parseInt(nStr, 10);
    if (!Number.isFinite(n) || n <= 0) {
      return null;
    }
    let out = "";
    for (let i = 0; i < n; i++) {
      const part = await SecureStore.getItemAsync(`${key}.__${i}`);
      if (part == null) {
        return null;
      }
      out += part;
    }
    return out;
  } catch {
    return null;
  }
}

async function secureSet(key: string, value: string): Promise<void> {
  await clearChunked(key);
  await SecureStore.deleteItemAsync(key).catch(() => undefined);

  if (value.length <= CHUNK_SIZE) {
    await SecureStore.setItemAsync(key, value);
    return;
  }

  const n = Math.ceil(value.length / CHUNK_SIZE);
  await SecureStore.setItemAsync(`${key}.__n`, String(n));
  for (let i = 0; i < n; i++) {
    const slice = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    await SecureStore.setItemAsync(`${key}.__${i}`, slice);
  }
}

async function secureRemove(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key).catch(() => undefined);
  await clearChunked(key);
}

export const supabaseAuthStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === "web") {
      return readWeb(key);
    }
    if (isIosAndroid()) {
      try {
        const fromSecure = await secureGet(key);
        if (fromSecure != null) {
          return fromSecure;
        }
      } catch {
        /* fall through */
      }
      return memory.get(key) ?? null;
    }
    return memory.get(key) ?? null;
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === "web") {
      writeWeb(key, value);
      return;
    }
    if (isIosAndroid()) {
      try {
        await secureSet(key, value);
        memory.delete(key);
        return;
      } catch {
        memory.set(key, value);
        return;
      }
    }
    memory.set(key, value);
  },

  removeItem: async (key: string): Promise<void> => {
    memory.delete(key);
    if (Platform.OS === "web") {
      removeWeb(key);
      return;
    }
    if (isIosAndroid()) {
      try {
        await secureRemove(key);
      } catch {
        /* memory already cleared */
      }
      return;
    }
  }
};
