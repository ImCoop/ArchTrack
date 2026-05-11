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
