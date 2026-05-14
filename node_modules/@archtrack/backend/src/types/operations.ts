export const customerStatuses = ['lead', 'active', 'inactive'] as const;
export type CustomerStatus = (typeof customerStatuses)[number];

export interface CustomerContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

export interface CustomerNote {
  id: string;
  body: string;
  createdAt: string;
  createdBy: string;
}

export interface Customer {
  id: string;
  companyName: string;
  billingAddress?: string;
  phone?: string;
  email?: string;
  status: CustomerStatus;
  contacts: CustomerContact[];
  notes: CustomerNote[];
  createdAt: string;
  updatedAt: string;
}

export const projectStatuses = ['planning', 'active', 'on_hold', 'completed'] as const;
export const projectPriorities = ['low', 'medium', 'high', 'urgent'] as const;
export type ProjectStatus = (typeof projectStatuses)[number];
export type Priority = (typeof projectPriorities)[number];

export interface Milestone {
  id: string;
  title: string;
  dueDate?: string;
  completed: boolean;
}

export interface Project {
  id: string;
  customerId?: string;
  projectName: string;
  description?: string;
  status: ProjectStatus;
  priority: Priority;
  dueDate?: string;
  assignedTo?: string;
  driveFolderId?: string;
  driveFolderUrl?: string;
  driveFolderName?: string;
  milestones: Milestone[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const taskStatuses = ['todo', 'in_progress', 'blocked', 'done'] as const;
export type TaskStatus = (typeof taskStatuses)[number];

export interface TaskComment {
  id: string;
  body: string;
  createdAt: string;
  createdBy: string;
}

export interface Task {
  id: string;
  projectId?: string;
  assignedTo?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  comments: TaskComment[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
