import { notificationRepository } from '../repositories/notification.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http-error.js';
import { googleWorkspaceService } from './googleWorkspace.service.js';
const maxEmailAttempts = 3;
const encodeBase64Url = (value) => Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
const buildNotificationEmail = (input) => {
    const lines = [
        `To: ${input.to}`,
        `Subject: ${input.subject}`,
        'Content-Type: text/plain; charset="UTF-8"',
        '',
        input.message,
    ];
    if (input.link) {
        lines.push('', `Open in ArchTrack: ${new URL(input.link, env.FRONTEND_URL).toString()}`);
    }
    lines.push('', 'This notification was sent by ArchTrack.');
    return lines.join('\r\n');
};
const sendGmailNotification = async (input) => {
    const raw = encodeBase64Url(buildNotificationEmail({
        to: input.to,
        subject: input.subject,
        message: input.message,
        link: input.link,
    }));
    await googleWorkspaceService.sendGmailMessage({ refreshToken: input.refreshToken, raw });
};
const formatError = (error) => (error instanceof Error ? error.message : 'Email send failed.');
export const notificationService = {
    list(userId, filters) {
        return notificationRepository.list(userId, filters);
    },
    async create(input) {
        const preferences = await notificationRepository.getPreferences(input.userId);
        if (!preferences.inApp) {
            return undefined;
        }
        const notification = await notificationRepository.create(input);
        if (preferences.email || input.emailQueued) {
            await notificationRepository.enqueueEmail(notification.id, input.userId);
        }
        return notification;
    },
    async notifyRole(role, input) {
        const users = await userRepository.list({ role });
        const created = [];
        for (const user of users) {
            const notification = await this.create({ ...input, userId: user.id });
            if (notification)
                created.push(notification);
        }
        return created;
    },
    async markRead(id, userId) {
        const notification = await notificationRepository.markRead(id, userId);
        if (!notification) {
            throw new HttpError(404, 'Notification not found.');
        }
        return notification;
    },
    markAllRead(userId) {
        return notificationRepository.markAllRead(userId);
    },
    getPreferences(userId) {
        return notificationRepository.getPreferences(userId);
    },
    updatePreferences(userId, input) {
        return notificationRepository.updatePreferences(userId, input);
    },
    listEmailQueue() {
        return notificationRepository.listEmailQueue();
    },
    async getEmailQueueSummary() {
        const queue = await notificationRepository.listEmailQueue();
        return {
            queued: queue.filter((item) => item.status === 'queued').length,
            sent: queue.filter((item) => item.status === 'sent').length,
            failed: queue.filter((item) => item.status === 'failed').length,
            lastProcessedAt: queue.filter((item) => item.sentAt).sort((a, b) => (b.sentAt ?? '').localeCompare(a.sentAt ?? ''))[0]?.sentAt,
        };
    },
    async processEmailQueue() {
        const queue = await notificationRepository.listPendingEmailQueue(maxEmailAttempts);
        const processed = [];
        for (const item of queue) {
            const notification = await notificationRepository.findNotificationById(item.notificationId);
            const user = await userRepository.findById(item.userId);
            try {
                if (!notification) {
                    throw new Error('Notification no longer exists.');
                }
                if (!user) {
                    throw new Error('Recipient no longer exists.');
                }
                if (!user.googleRefreshToken) {
                    throw new Error('Recipient has not linked Google with Gmail send access.');
                }
                await sendGmailNotification({
                    refreshToken: user.googleRefreshToken,
                    to: user.email,
                    subject: notification.title,
                    message: notification.message,
                    link: notification.link,
                });
                const sent = await notificationRepository.updateEmailQueueItem(item.id, {
                    status: 'sent',
                    attempts: item.attempts + 1,
                    lastError: undefined,
                    sentAt: new Date().toISOString(),
                });
                if (sent)
                    processed.push(sent);
            }
            catch (error) {
                const attempts = item.attempts + 1;
                const failed = await notificationRepository.updateEmailQueueItem(item.id, {
                    status: attempts >= maxEmailAttempts ? 'failed' : 'queued',
                    attempts,
                    lastError: formatError(error),
                });
                if (failed)
                    processed.push(failed);
            }
        }
        return processed;
    },
};
