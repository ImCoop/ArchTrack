import type { Request, Response } from 'express';

import { notificationService } from '../services/notification.service.js';
import { backgroundJobService } from '../services/notification.worker.js';
import {
  createNotificationSchema,
  listNotificationsSchema,
  updateNotificationPreferencesSchema,
} from '../utils/notification.schemas.js';

const param = (request: Request, name: string) => {
  const value = request.params[name];
  return Array.isArray(value) ? value[0] : value;
};

export const notificationController = {
  async list(request: Request, response: Response) {
    const filters = listNotificationsSchema.parse(request.query);
    const notifications = await notificationService.list(request.user!.id, filters);

    response.json({ notifications });
  },

  async create(request: Request, response: Response) {
    const input = createNotificationSchema.parse(request.body);
    const notification = await notificationService.create(input);

    response.status(201).json({ notification });
  },

  async markRead(request: Request, response: Response) {
    const notification = await notificationService.markRead(param(request, 'id'), request.user!.id);

    response.json({ notification });
  },

  async markAllRead(request: Request, response: Response) {
    await notificationService.markAllRead(request.user!.id);

    response.status(204).send();
  },

  async getPreferences(request: Request, response: Response) {
    const preferences = await notificationService.getPreferences(request.user!.id);

    response.json({ preferences });
  },

  async updatePreferences(request: Request, response: Response) {
    const input = updateNotificationPreferencesSchema.parse(request.body);
    const preferences = await notificationService.updatePreferences(request.user!.id, input);

    response.json({ preferences });
  },

  async listEmailQueue(_request: Request, response: Response) {
    const queue = await notificationService.listEmailQueue();

    response.json({ queue });
  },

  async emailQueueSummary(_request: Request, response: Response) {
    const summary = await notificationService.getEmailQueueSummary();
    response.json({ summary });
  },

  async processEmailQueue(_request: Request, response: Response) {
    const queue = await notificationService.processEmailQueue();

    response.json({ queue });
  },

  async workerStatus(_request: Request, response: Response) {
    response.json({ status: backgroundJobService.getStatus() });
  },

  async runJobs(_request: Request, response: Response) {
    const result = await backgroundJobService.runAll();
    response.json(result);
  },
};
