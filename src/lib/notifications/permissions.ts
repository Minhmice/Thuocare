import * as Notifications from "expo-notifications";
import type { NotificationPermissionStatus } from "./types";

export type NotificationPermissionSnapshot = {
  readonly status: NotificationPermissionStatus;
  readonly canAskAgain: boolean;
};

function mapPermissionStatus(
  raw: Notifications.PermissionStatus
): NotificationPermissionStatus {
  if (raw === Notifications.PermissionStatus.GRANTED) return "granted";
  if (raw === Notifications.PermissionStatus.DENIED) return "denied";
  if (raw === Notifications.PermissionStatus.UNDETERMINED) return "undetermined";
  return "unavailable";
}

export async function getNotificationPermissionStatus(): Promise<NotificationPermissionSnapshot> {
  try {
    const perms = await Notifications.getPermissionsAsync();
    return {
      status: mapPermissionStatus(perms.status),
      canAskAgain: perms.canAskAgain
    };
  } catch {
    return { status: "unavailable", canAskAgain: false };
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermissionSnapshot> {
  try {
    const perms = await Notifications.requestPermissionsAsync();
    return {
      status: mapPermissionStatus(perms.status),
      canAskAgain: perms.canAskAgain
    };
  } catch {
    return { status: "unavailable", canAskAgain: false };
  }
}

/**
 * Returns current permission status without prompting unless the caller
 * explicitly passes `{ autoPrompt: true }`.
 */
export async function ensureNotificationPermission(
  opts?: { readonly autoPrompt?: boolean }
): Promise<NotificationPermissionSnapshot> {
  const current = await getNotificationPermissionStatus();
  if (current.status === "granted") return current;
  if (opts?.autoPrompt && current.canAskAgain) {
    return requestNotificationPermission();
  }
  return current;
}
