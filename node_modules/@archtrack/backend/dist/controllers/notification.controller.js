import { notificationService } from '../services/notification.service.js';
import { createNotificationSchema, listNotificationsSchema, updateNotificationPreferencesSchema, } from '../utils/notification.schemas.js';
const param = (request, name) => {
    const value = request.params[name];
    return Array.isArray(value) ? value[0] : value;
};
export const notificationController = {
    async list(request, response) {
        const filters = listNotificationsSchema.parse(request.query);
        const notifications = await notificationService.list(request.user.id, filters);
        response.json({ notifications });
    },
    async create(request, response) {
        const input = createNotificationSchema.parse(request.body);
        const notification = await notificationService.create(input);
        response.status(201).json({ notification });
    },
    async markRead(request, response) {
        const notification = await notificationService.markRead(param(request, 'id'), request.user.id);
        response.json({ notification });
    },
    async markAllRead(request, response) {
        await notificationService.markAllRead(request.user.id);
        response.status(204).send();
    },
    async getPreferences(request, response) {
        const preferences = await notificationService.getPreferences(request.user.id);
        response.json({ preferences });
    },
    async updatePreferences(request, response) {
        const input = updateNotificationPreferencesSchema.parse(request.body);
        const preferences = await notificationService.updatePreferences(request.user.id, input);
        response.json({ preferences });
    },
    async listEmailQueue(_request, response) {
        const queue = await notificationService.listEmailQueue();
        response.json({ queue });
    },
    async processEmailQueue(_request, response) {
        const queue = await notificationService.processEmailQueue();
        response.json({ queue });
    },
};
