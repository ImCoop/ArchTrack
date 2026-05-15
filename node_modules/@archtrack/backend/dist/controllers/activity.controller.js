import { activityService } from '../services/activity.service.js';
import { listActivitySchema } from '../utils/activity.schemas.js';
export const activityController = {
    async list(request, response) {
        response.json({ activity: await activityService.list(listActivitySchema.parse(request.query)) });
    },
};
