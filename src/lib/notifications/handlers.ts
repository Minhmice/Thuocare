import React, { useCallback, useEffect, type PropsWithChildren } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import type { MedicationReminderNotificationData } from "./types";

const ANDROID_CHANNEL_ID = "medication-reminders";
let _androidChannelConfigured: Promise<void> | null = null;

function isMedicationReminderData(
  value: unknown
): value is MedicationReminderNotificationData {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v["type"] !== "medication_reminder") return false;
  if (typeof v["doseId"] !== "string") return false;
  if (typeof v["scheduledDate"] !== "string") return false;
  if (typeof v["scheduledAt"] !== "string") return false;
  if (!Array.isArray(v["medicationIds"])) return false;
  return (v["medicationIds"] as unknown[]).every((x) => typeof x === "string");
}

function warnDev(message: string, error?: unknown) {
  if (!__DEV__) return;
  if (error) {
    console.warn(message, error);
  } else {
    console.warn(message);
  }
}

function isDoseIdValid(doseId: string): boolean {
  const raw = typeof doseId === "string" ? doseId.trim() : "";
  if (!raw) return false;
  const i = raw.indexOf("T");
  if (i <= 0 || i >= raw.length - 1) return false;
  return Boolean(raw.slice(0, i).trim()) && Boolean(raw.slice(i + 1).trim());
}

export function setNotificationHandlerOnce() {
  if (
    (globalThis as unknown as { __thuocare_handler_set?: boolean })
      .__thuocare_handler_set
  ) {
    return;
  }
  (globalThis as unknown as { __thuocare_handler_set?: boolean }).__thuocare_handler_set =
    true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false
    })
  });
}

/**
 * Sets up the Android notification channel and installs the global
 * notification handler. Idempotent — safe to call more than once.
 */
export async function configureMedicationNotifications(): Promise<void> {
  setNotificationHandlerOnce();

  if (Platform.OS === "android") {
    if (!_androidChannelConfigured) {
      _androidChannelConfigured = Notifications.setNotificationChannelAsync(
        ANDROID_CHANNEL_ID,
        {
          name: "Medication reminders",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          sound: "default",
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC
        }
      ).then(
        () => {},
        (err) => {
          _androidChannelConfigured = null;
          warnDev("Failed to configure Android notification channel.", err);
        }
      );
    }
    await _androidChannelConfigured;
  }
}

/**
 * Drop-in provider that wires up medication notification routing.
 * Intended to wrap the app near the root (wrapping `<Stack />` is fine).
 * Uses `useRouter()` for navigation from within the React tree.
 */
export function NotificationProvider({ children }: PropsWithChildren) {
  const router = useRouter();

  const routeToDose = useCallback(
    (doseId: string) => {
      router.push({ pathname: "/reminder/[doseId]", params: { doseId } });
    },
    [router]
  );

  useEffect(() => {
    void configureMedicationNotifications();

    function handleResponseData(data: unknown) {
      if (!isMedicationReminderData(data)) return;
      if (data.type !== "medication_reminder") return;
      if (typeof data.doseId !== "string") return;
      if (!isDoseIdValid(data.doseId)) return;
      routeToDose(data.doseId);
    }

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      try {
        handleResponseData(response.notification.request.content.data);
      } catch (err) {
        warnDev("Failed to handle notification response.", err);
      }
    });

    void (async () => {
      try {
        const response = await Notifications.getLastNotificationResponseAsync();
        handleResponseData(response?.notification.request.content.data);
      } catch (err) {
        warnDev("Failed to get initial notification response.", err);
      }
    })();

    return () => sub.remove();
  }, [routeToDose]);

  return React.createElement(React.Fragment, null, children);
}
