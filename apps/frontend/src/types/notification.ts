export const notificationTypes = ['assignment', 'deadline', 'mention', 'system', 'workflow'] as const;
export type NotificationType = (typeof notificationTypes)[number];

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  readAt?: string;
  link?: string;
  emailQueued: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  userId: string;
  inApp: boolean;
  email: boolean;
  assignmentAlerts: boolean;
  deadlineReminders: boolean;
  mentionAlerts: boolean;
}

export interface EmailQueueItem {
  id: string;
  notificationId: string;
  userId: string;
  status: 'queued' | 'sent' | 'failed';
  attempts: number;
  lastError?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailQueueSummary {
  queued: number;
  sent: number;
  failed: number;
  lastProcessedAt?: string;
}

export interface WorkerStatus {
  emailQueue: {
    lastRunAt?: string;
    lastProcessedCount: number;
    lastError?: string;
  };
  invoiceSweep: {
    lastRunAt?: string;
    lastProcessedCount: number;
    lastError?: string;
  };
}
