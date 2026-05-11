import { id, instantRepository, now } from './instant.repository.js';
const defaultPreferences = (userId) => ({
    userId,
    inApp: true,
    email: true,
    assignmentAlerts: true,
    deadlineReminders: true,
    mentionAlerts: true,
});
export const notificationRepository = {
    async list(userId, filters) {
        const notifications = await instantRepository.list('notifications');
        return notifications
            .filter((notification) => {
            const matchesUser = notification.userId === userId;
            const matchesRead = !filters?.readStatus ||
                (filters.readStatus === 'read' ? Boolean(notification.readAt) : !notification.readAt);
            return matchesUser && matchesRead;
        })
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async create(input) {
        const notification = {
            id: id(),
            createdAt: now(),
            ...input,
        };
        await instantRepository.upsert('notifications', notification.id, notification);
        return notification;
    },
    async markRead(notificationId, userId) {
        const existing = await instantRepository.findById('notifications', notificationId);
        if (!existing || existing.userId !== userId) {
            return undefined;
        }
        const updated = { ...existing, readAt: existing.readAt ?? now() };
        await instantRepository.upsert('notifications', notificationId, updated);
        return updated;
    },
    async markAllRead(userId) {
        const timestamp = now();
        const notifications = await instantRepository.list('notifications');
        const unread = notifications.filter((notification) => notification.userId === userId && !notification.readAt);
        for (const notification of unread) {
            await instantRepository.upsert('notifications', notification.id, { ...notification, readAt: timestamp });
        }
    },
    async getPreferences(userId) {
        const existing = await instantRepository.findOneBy('notificationPreferences', { userId });
        if (existing)
            return existing;
        const created = { id: id(), ...defaultPreferences(userId) };
        await instantRepository.upsert('notificationPreferences', created.id, created);
        return created;
    },
    async updatePreferences(userId, input) {
        const existing = await this.getPreferences(userId);
        const updated = { ...existing, ...input };
        await instantRepository.upsert('notificationPreferences', updated.id, updated);
        return updated;
    },
    async enqueueEmail(notificationId, userId) {
        const item = {
            id: id(),
            notificationId,
            userId,
            status: 'queued',
            attempts: 0,
            createdAt: now(),
            updatedAt: now(),
        };
        await instantRepository.upsert('emailQueue', item.id, item);
        return item;
    },
    async listEmailQueue() {
        const queue = await instantRepository.list('emailQueue');
        return queue.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async listPendingEmailQueue(maxAttempts) {
        const queue = await instantRepository.list('emailQueue');
        return queue
            .filter((item) => item.status !== 'sent' && item.attempts < maxAttempts)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    findNotificationById(notificationId) {
        return instantRepository.findById('notifications', notificationId);
    },
    async updateEmailQueueItem(queueId, input) {
        const existing = await instantRepository.findById('emailQueue', queueId);
        if (!existing)
            return undefined;
        const updated = {
            ...existing,
            ...input,
            updatedAt: now(),
        };
        await instantRepository.upsert('emailQueue', queueId, updated);
        return updated;
    },
};
