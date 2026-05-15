export const activityEntityTypes = ['customer', 'project', 'task', 'document', 'time_entry', 'quote', 'invoice', 'system'] as const;
export type ActivityEntityType = (typeof activityEntityTypes)[number];

export interface ActivityLog {
  id: string;
  entityType: ActivityEntityType;
  entityId: string;
  action: string;
  summary: string;
  actorUserId?: string;
  relatedCustomerId?: string;
  relatedProjectId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
