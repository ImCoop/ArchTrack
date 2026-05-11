import { Router } from 'express';

import { customerController, projectController, taskController } from '../controllers/operations.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const customerRouter = Router();
export const projectRouter = Router();
export const taskRouter = Router();

customerRouter.use(requireAuth);
customerRouter.get('/', asyncHandler(customerController.list));
customerRouter.post('/', asyncHandler(customerController.create));
customerRouter.patch('/:id', asyncHandler(customerController.update));
customerRouter.delete('/:id', asyncHandler(customerController.delete));
customerRouter.post('/:id/contacts', asyncHandler(customerController.addContact));
customerRouter.post('/:id/notes', asyncHandler(customerController.addNote));

projectRouter.use(requireAuth);
projectRouter.get('/', asyncHandler(projectController.list));
projectRouter.post('/', asyncHandler(projectController.create));
projectRouter.patch('/:id', asyncHandler(projectController.update));
projectRouter.delete('/:id', asyncHandler(projectController.delete));
projectRouter.post('/:id/milestones', asyncHandler(projectController.addMilestone));

taskRouter.use(requireAuth);
taskRouter.get('/', asyncHandler(taskController.list));
taskRouter.post('/', asyncHandler(taskController.create));
taskRouter.patch('/:id', asyncHandler(taskController.update));
taskRouter.delete('/:id', asyncHandler(taskController.delete));
taskRouter.post('/:id/comments', asyncHandler(taskController.addComment));
