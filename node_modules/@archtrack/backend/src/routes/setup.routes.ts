import { Router } from 'express';

import { setupController } from '../controllers/setup.controller.js';

export const setupRouter = Router();

setupRouter.get('/status', setupController.status);
