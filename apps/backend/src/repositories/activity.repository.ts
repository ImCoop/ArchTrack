import type { ActivityLog } from '../types/activity.js';
import { id, instantRepository, now } from './instant.repository.js';

export const activityRepository = {
  async list(filters?: {
    entityType?: ActivityLog['entityType'];
    entityId?: string;
    actorUserId?: string;
    relatedProjectId?: string;
    search?: string;
    limit?: number;
  }) {
    const records = await instantRepository.list<ActivityLog>('activityLogs');
    const search = filters?.search?.trim().toLowerCase();

    const filtered = records
      .filter((record) => {
        const matchesType = !filters?.entityType || record.entityType === filters.entityType;
        const matchesEntity = !filters?.entityId || record.entityId === filters.entityId;
        const matchesActor = !filters?.actorUserId || record.actorUserId === filters.actorUserId;
        const matchesProject = !filters?.relatedProjectId || record.relatedProjectId === filters.relatedProjectId;
        const matchesSearch =
          !search ||
          [record.summary, record.action, record.entityType, record.entityId, record.relatedProjectId ?? '', record.relatedCustomerId ?? '']
            .join(' ')
            .toLowerCase()
            .includes(search);

        return matchesType && matchesEntity && matchesActor && matchesProject && matchesSearch;
      })
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    return typeof filters?.limit === 'number' ? filtered.slice(0, filters.limit) : filtered;
  },

  async create(input: Omit<ActivityLog, 'id' | 'createdAt'>) {
    const record: ActivityLog = {
      id: id(),
      createdAt: now(),
      ...input,
    };

    await instantRepository.upsert<ActivityLog>('activityLogs', record.id, record);
    return record;
  },
};
