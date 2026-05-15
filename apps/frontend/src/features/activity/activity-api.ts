import { apiClient } from '../../api/client';
import type { ActivityEntityType, ActivityLog } from '../../types/activity';

export const activityApi = {
  async list(filters?: { entityType?: ActivityEntityType | 'all'; entityId?: string; actorUserId?: string; relatedProjectId?: string; search?: string; limit?: number }) {
    const { data } = await apiClient.get<{ activity: ActivityLog[] }>('/activity', {
      params: {
        entityType: filters?.entityType === 'all' ? undefined : filters?.entityType,
        entityId: filters?.entityId || undefined,
        actorUserId: filters?.actorUserId || undefined,
        relatedProjectId: filters?.relatedProjectId || undefined,
        search: filters?.search || undefined,
        limit: filters?.limit,
      },
    });

    return data.activity;
  },
};
