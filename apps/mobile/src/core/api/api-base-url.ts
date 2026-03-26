import Constants from "expo-constants";
import { Platform } from "react-native";

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function asHostUri(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  // hostUri/debuggerHost sometimes includes protocol or path.
  // We only need "<host>:<port>" (or "<host>") to build an http origin.
  const noProto = trimmed.replace(/^\w+:\/\//, "");
  const hostPort = noProto.split("/")[0];
  return hostPort ? hostPort : null;
}

function getExpoDevHostUri(): string | null {
  // Expo SDK shape varies slightly between environments (Expo Go, dev client, web).
  // Prefer stable fields, then fall back to manifest-derived ones.
  const anyConstants: any = Constants as any;

  return (
    asHostUri((Constants as any)?.expoConfig?.hostUri) ??
    asHostUri((Constants as any)?.expoGoConfig?.debuggerHost) ??
    asHostUri(anyConstants?.manifest?.debuggerHost) ??
    asHostUri(anyConstants?.manifest2?.extra?.expoGo?.debuggerHost) ??
    asHostUri(anyConstants?.manifest2?.extra?.expoClient?.hostUri) ??
    null
  );
}

/**
 * Resolve an absolute origin for calling Expo Router API routes.
 *
 * - Web: use `window.location.origin`
 * - Native dev: derive host from Expo dev server (e.g. `192.168.x.x:8081`)
 * - Production/native without a known host: return null (callers should fall back)
 */
export function getApiBaseUrl(): string | null {
  const env = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (env) return normalizeBaseUrl(env);

  if (Platform.OS === "web") {
    const origin = (globalThis as any)?.location?.origin;
    return typeof origin === "string" && origin ? normalizeBaseUrl(origin) : null;
  }

  const hostUri = getExpoDevHostUri();
  if (!hostUri) return null;

  // API routes are served by the same dev server in development.
  return normalizeBaseUrl(`http://${hostUri}`);
}

