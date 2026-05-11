import { z } from 'zod';

import { notificationTypes } from '../types/notification.js';

export const listNotificationsSchema = z.object({
  readStatus: z.enum(['read', 'unread']).optional(),
});

export const createNotificationSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(notificationTypes).default('system'),
  title: z.string().min(1).max(160),
  message: z.string().min(1).max(1000),
  link: z.string().optional(),
  emailQueued: z.boolean().default(false),
});

export const updateNotificationPreferencesSchema = z.object({
  inApp: z.boolean().optional(),
  email: z.boolean().optional(),
  assignmentAlerts: z.boolean().optional(),
  deadlineReminders: z.boolean().optional(),
  mentionAlerts: z.boolean().optional(),
});
