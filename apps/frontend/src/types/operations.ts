export const customerStatuses = ['lead', 'active', 'inactive'] as const;
export type CustomerStatus = (typeof customerStatuses)[number];

export interface Customer {
  id: string;
  companyName: string;
  billingAddress?: string;
  phone?: string;
  email?: string;
  status: CustomerStatus;
  contacts: Array<{ id: string; name: string; email: string; phone?: string; role?: string }>;
  notes: Array<{ id: string; body: string; createdAt: string; createdBy: string }>;
}

export const projectStatuses = ['planning', 'active', 'on_hold', 'completed'] as const;
export const priorities = ['low', 'medium', 'high', 'urgent'] as const;
export type ProjectStatus = (typeof projectStatuses)[number];
export type Priority = (typeof priorities)[number];

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
  milestones: Array<{ id: string; title: string; dueDate?: string; completed: boolean }>;
}

export const taskStatuses = ['todo', 'in_progress', 'blocked', 'done'] as const;
export type TaskStatus = (typeof taskStatuses)[number];

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
  comments: Array<{ id: string; body: string; createdAt: string; createdBy: string }>;
}
