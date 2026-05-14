import { z } from 'zod';

import { customerStatuses, projectPriorities, projectStatuses, taskStatuses } from '../types/operations.js';

export const listCustomersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(customerStatuses).optional(),
});

export const customerSchema = z.object({
  companyName: z.string().min(1).max(160),
  billingAddress: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  status: z.enum(customerStatuses).default('lead'),
});

export const customerContactSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.string().optional(),
});

export const noteSchema = z.object({
  body: z.string().min(1).max(1000),
});

export const listProjectsSchema = z.object({
  search: z.string().optional(),
  status: z.enum(projectStatuses).optional(),
  customerId: z.string().optional(),
});

export const projectSchema = z.object({
  customerId: z.string().optional(),
  projectName: z.string().min(1).max(160),
  description: z.string().optional(),
  status: z.enum(projectStatuses).default('planning'),
  priority: z.enum(projectPriorities).default('medium'),
  dueDate: z.string().optional(),
  assignedTo: z.string().optional(),
  driveFolderId: z.string().optional(),
  driveFolderUrl: z.string().url().optional(),
  driveFolderName: z.string().optional(),
});

export const milestoneSchema = z.object({
  title: z.string().min(1).max(160),
  dueDate: z.string().optional(),
  completed: z.boolean().default(false),
});

export const createDriveFolderSchema = z.object({
  folderName: z.string().min(1).max(160).optional(),
});

export const attachDriveFolderSchema = z.object({
  folder: z.string().min(1).max(500),
  folderName: z.string().min(1).max(160).optional(),
});

export const listTasksSchema = z.object({
  search: z.string().optional(),
  status: z.enum(taskStatuses).optional(),
  projectId: z.string().optional(),
  assignedTo: z.string().optional(),
});

export const taskSchema = z.object({
  projectId: z.string().optional(),
  assignedTo: z.string().optional(),
  title: z.string().min(1).max(160),
  description: z.string().optional(),
  status: z.enum(taskStatuses).default('todo'),
  priority: z.enum(projectPriorities).default('medium'),
  dueDate: z.string().optional(),
  estimatedHours: z.coerce.number().nonnegative().optional(),
  actualHours: z.coerce.number().nonnegative().optional(),
});
