import type { EmailQueueItem, Notification, NotificationPreferences } from '../types/notification.js';
import { id, instantRepository, now } from './instant.repository.js';

const defaultPreferences = (userId: string): NotificationPreferences => ({
  userId,
  inApp: true,
  email: true,
  assignmentAlerts: true,
  deadlineReminders: true,
  mentionAlerts: true,
});

export const notificationRepository = {
  async list(userId: string, filters?: { readStatus?: 'read' | 'unread' }) {
    const notifications = await instantRepository.list<Notification>('notifications');
    return notifications
      .filter((notification) => {
        const matchesUser = notification.userId === userId;
        const matchesRead =
          !filters?.readStatus ||
          (filters.readStatus === 'read' ? Boolean(notification.readAt) : !notification.readAt);

        return matchesUser && matchesRead;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async create(input: Omit<Notification, 'id' | 'readAt' | 'createdAt'>) {
    const notification: Notification = {
      id: id(),
      createdAt: now(),
      ...input,
    };

    await instantRepository.upsert<Notification>('notifications', notification.id, notification);
    return notification;
  },

  async markRead(notificationId: string, userId: string) {
    const existing = await instantRepository.findById<Notification>('notifications', notificationId);

    if (!existing || existing.userId !== userId) {
      return undefined;
    }

    const updated = { ...existing, readAt: existing.readAt ?? now() };
    await instantRepository.upsert<Notification>('notifications', notificationId, updated);
    return updated;
  },

  async markAllRead(userId: string) {
    const timestamp = now();
    const notifications = await instantRepository.list<Notification>('notifications');
    const unread = notifications.filter((notification) => notification.userId === userId && !notification.readAt);

    for (const notification of unread) {
      await instantRepository.upsert<Notification>('notifications', notification.id, { ...notification, readAt: timestamp });
    }
  },

  async getPreferences(userId: string) {
    const existing = await instantRepository.findOneBy<NotificationPreferences & { id: string }>('notificationPreferences', { userId });

    if (existing) return existing;

    const created = { id: id(), ...defaultPreferences(userId) };
    await instantRepository.upsert<typeof created>('notificationPreferences', created.id, created);
    return created;
  },

  async updatePreferences(userId: string, input: Partial<Omit<NotificationPreferences, 'userId'>>) {
    const existing = await this.getPreferences(userId);
    const updated = { ...existing, ...input };
    await instantRepository.upsert<typeof updated>('notificationPreferences', updated.id, updated);
    return updated;
  },

  async enqueueEmail(notificationId: string, userId: string) {
    const item: EmailQueueItem = {
      id: id(),
      notificationId,
      userId,
      status: 'queued',
      attempts: 0,
      createdAt: now(),
      updatedAt: now(),
    };

    await instantRepository.upsert<EmailQueueItem>('emailQueue', item.id, item);
    return item;
  },

  async listEmailQueue() {
    const queue = await instantRepository.list<EmailQueueItem>('emailQueue');
    return queue.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async listPendingEmailQueue(maxAttempts: number) {
    const queue = await instantRepository.list<EmailQueueItem>('emailQueue');
    return queue
      .filter((item) => item.status !== 'sent' && item.attempts < maxAttempts)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  findNotificationById(notificationId: string) {
    return instantRepository.findById<Notification>('notifications', notificationId);
  },

  async updateEmailQueueItem(queueId: string, input: Partial<EmailQueueItem>) {
    const existing = await instantRepository.findById<EmailQueueItem>('emailQueue', queueId);

    if (!existing) return undefined;

    const updated: EmailQueueItem = {
      ...existing,
      ...input,
      updatedAt: now(),
    };

    await instantRepository.upsert<EmailQueueItem>('emailQueue', queueId, updated);
    return updated;
  },
};
