/**
 * View models for patient-facing notification APIs.
 */

import type { EntityId, IsoDateTime } from "@thuocare/contracts";
import type { NotificationStatus, NotificationType } from "./types.js";

/** One notification shown in the patient's notification inbox. */
export interface NotificationVM {
  id: EntityId;
  type: NotificationType;
  /** Pre-rendered human-readable message (Vietnamese). */
  message: string;
  scheduledAt: IsoDateTime;
  createdAt: IsoDateTime;
  isRead: boolean;
  status: NotificationStatus;
  referenceType: string | null;
  referenceId: EntityId;
  /** Raw payload for the frontend to render a richer card if needed. */
  payload: Record<string, unknown>;
}

/** Result from processNotificationQueue. */
export interface QueueProcessResult {
  processed: number;
  succeeded: number;
  failed: number;
}

/** Result from trigger functions. */
export interface TriggerResult {
  created: number;
  skipped: number;
}
