import { Router } from 'express';

import { activityController } from '../controllers/activity.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const activityRouter = Router();

activityRouter.use(requireAuth);
activityRouter.get('/', asyncHandler(activityController.list));
