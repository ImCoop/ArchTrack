import { Router } from 'express';

import { authController } from '../controllers/auth.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

export const authRouter = Router();

authRouter.post('/register', asyncHandler(authController.register));
authRouter.post('/login', asyncHandler(authController.login));
authRouter.get('/google/url', asyncHandler(authController.googleUrl));
authRouter.post('/google/callback', asyncHandler(authController.googleCallback));
authRouter.post('/refresh', asyncHandler(authController.refresh));
authRouter.post('/logout', asyncHandler(authController.logout));
authRouter.get('/me', requireAuth, asyncHandler(authController.me));
authRouter.get('/admin-check', requireAuth, requireRole('admin'), asyncHandler(authController.adminCheck));
