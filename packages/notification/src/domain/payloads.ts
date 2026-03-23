/**
 * Typed payload shapes for each NotificationType.
 *
 * These are stored as jsonb in notification_event.payload.
 * The frontend uses them to render rich notification UI.
 * The buildNotificationMessage() function uses them to generate the message string.
 */

// ─── Per-type payloads ────────────────────────────────────────────────────────

export interface DoseReminderPayload {
  prescriptionItemId: string;
  medicationName: string;
  strengthText: string;
  doseAmount: string;
  doseUnit: string;
  /** HH:mm display time (local). */
  doseTime: string;
}

export interface MissedDoseAlertPayload {
  prescriptionItemId: string;
  medicationName: string;
  strengthText: string;
  /** HH:mm display time of the missed dose. */
  scheduledTime: string;
  scheduledDate: string;
}

export interface RefillReminderPayload {
  prescriptionItemId: string;
  prescriptionId: string;
  medicationName: string;
  strengthText: string;
  daysRemaining: number;
}

export interface RefillUpdatePayload {
  refillRequestId: string;
  status: "approved" | "rejected" | "appointment_required";
  decisionNote: string | null;
  resultPrescriptionId: string | null;
}

export interface AppointmentReminderPayload {
  appointmentId: string;
  appointmentType: string;
  scheduledStartAt: string;
  /** 'same_day' | '1_day_before' */
  reminderType: string;
  doctorId: string | null;
}

// ─── Union ────────────────────────────────────────────────────────────────────

export type NotificationPayload =
  | DoseReminderPayload
  | MissedDoseAlertPayload
  | RefillReminderPayload
  | RefillUpdatePayload
  | AppointmentReminderPayload;

// ─── Message builder ──────────────────────────────────────────────────────────

import type { NotificationType } from "./types.js";

/**
 * Build a human-readable notification message from type + payload.
 * Defaults to Vietnamese. Adjust locale in future i18n pass.
 */
export function buildNotificationMessage(
  type: NotificationType,
  payload: Record<string, unknown>,
): string {
  switch (type) {
    case "dose_reminder": {
      const p = payload as unknown as DoseReminderPayload;
      return `Đến giờ uống thuốc: ${p.medicationName} ${p.strengthText} — ${p.doseAmount} ${p.doseUnit} lúc ${p.doseTime}.`;
    }

    case "missed_dose_alert": {
      const p = payload as unknown as MissedDoseAlertPayload;
      return `Bạn đã quên uống ${p.medicationName} ${p.strengthText} lúc ${p.scheduledTime}.`;
    }

    case "refill_reminder": {
      const p = payload as unknown as RefillReminderPayload;
      return `${p.medicationName} ${p.strengthText} còn ${p.daysRemaining} ngày. Hãy yêu cầu cấp lại thuốc.`;
    }

    case "refill_update": {
      const p = payload as unknown as RefillUpdatePayload;
      if (p.status === "approved") {
        return "Yêu cầu cấp lại thuốc của bạn đã được bác sĩ duyệt.";
      }
      if (p.status === "rejected") {
        const note = p.decisionNote ? ` Lý do: ${p.decisionNote}` : "";
        return `Yêu cầu cấp lại thuốc của bạn không được duyệt.${note}`;
      }
      return "Bạn cần đặt lịch khám trước khi được cấp lại thuốc.";
    }

    case "appointment_reminder": {
      const p = payload as unknown as AppointmentReminderPayload;
      const date = p.scheduledStartAt.slice(0, 10);
      const time = p.scheduledStartAt.slice(11, 16);
      if (p.reminderType === "same_day") {
        return `Nhắc nhở: Bạn có lịch khám hôm nay lúc ${time}.`;
      }
      return `Nhắc nhở: Bạn có lịch khám vào ngày ${date} lúc ${time}.`;
    }

    default:
      return "Bạn có thông báo mới.";
  }
}
