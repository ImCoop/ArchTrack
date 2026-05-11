import { apiClient } from '../../api/client';
import type { Notification, NotificationPreferences } from '../../types/notification';

export const notificationApi = {
  async list(filters?: { readStatus?: 'read' | 'unread' }) {
    const { data } = await apiClient.get<{ notifications: Notification[] }>('/notifications', {
      params: filters,
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
};
