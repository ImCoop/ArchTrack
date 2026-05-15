import { activityRepository } from '../repositories/activity.repository.js';
import type { ActivityLog } from '../types/activity.js';

export const activityService = {
  list(filters?: {
    entityType?: ActivityLog['entityType'];
    entityId?: string;
    actorUserId?: string;
    relatedProjectId?: string;
    search?: string;
    limit?: number;
  }) {
    return activityRepository.list(filters);
  },

  record(input: Omit<ActivityLog, 'id' | 'createdAt'>) {
    return activityRepository.create(input);
  },
};
