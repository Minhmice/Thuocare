import type { AppCapabilities } from "./resolve-visible-tabs";

export type DefaultEntryPath = "/(tabs)";

export function resolveDefaultEntry(_capabilities: AppCapabilities): DefaultEntryPath {
  return "/(tabs)";
}
