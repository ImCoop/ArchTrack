import { z } from 'zod';
import { activityEntityTypes } from '../types/activity.js';
export const listActivitySchema = z.object({
    entityType: z.enum(activityEntityTypes).optional(),
    entityId: z.string().optional(),
    actorUserId: z.string().optional(),
    relatedProjectId: z.string().optional(),
    search: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
});
