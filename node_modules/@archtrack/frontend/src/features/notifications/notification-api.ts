import { apiClient } from '../../api/client';
import type { EmailQueueItem, EmailQueueSummary, Notification, NotificationPreferences, WorkerStatus } from '../../types/notification';

export const notificationApi = {
  async list(filters?: { readStatus?: 'read' | 'unread' | 'all' }) {
    const { data } = await apiClient.get<{ notifications: Notification[] }>('/notifications', {
      params: { readStatus: filters?.readStatus === 'all' ? undefined : filters?.readStatus },
    });
    return data.notifications;
  },

  async markRead(id: string) {
    const { data } = await apiClient.patch<{ notification: Notification }>(`/notifications/${id}/read`);
    return data.notification;
  },

  async markAllRead() {
    await apiClient.post('/notifications/read-all');
  },

  async getPreferences() {
    const { data } = await apiClient.get<{ preferences: NotificationPreferences }>('/notifications/preferences');
    return data.preferences;
  },

  async updatePreferences(input: Partial<Omit<NotificationPreferences, 'userId'>>) {
    const { data } = await apiClient.patch<{ preferences: NotificationPreferences }>('/notifications/preferences', input);
    return data.preferences;
  },

  async emailQueueSummary() {
    const { data } = await apiClient.get<{ summary: EmailQueueSummary }>('/notifications/email-queue/summary');
    return data.summary;
  },

  async listEmailQueue() {
    const { data } = await apiClient.get<{ queue: EmailQueueItem[] }>('/notifications/email-queue');
    return data.queue;
  },

  async processEmailQueue() {
    const { data } = await apiClient.post<{ queue: EmailQueueItem[] }>('/notifications/email-queue/process');
    return data.queue;
  },

  async workerStatus() {
    const { data } = await apiClient.get<{ status: WorkerStatus }>('/notifications/worker-status');
    return data.status;
  },

  async runJobs() {
    const { data } = await apiClient.post<{ overdueInvoices: number; emailQueue: EmailQueueItem[] }>('/notifications/jobs/run');
    return data;
  },
};
