import { apiClient } from '../../api/client';
import type { Customer, CustomerStatus, Priority, Project, ProjectStatus, Task, TaskStatus } from '../../types/operations';

export const customerApi = {
  async list(filters: { search?: string; status?: CustomerStatus | 'all' }) {
    const { data } = await apiClient.get<{ customers: Customer[] }>('/customers', {
      params: { search: filters.search || undefined, status: filters.status === 'all' ? undefined : filters.status },
    });
    return data.customers;
  },
  async create(input: Omit<Customer, 'id' | 'contacts' | 'notes'>) {
    const { data } = await apiClient.post<{ customer: Customer }>('/customers', input);
    return data.customer;
  },
  async update(id: string, input: Partial<Omit<Customer, 'id' | 'contacts' | 'notes'>>) {
    const { data } = await apiClient.patch<{ customer: Customer }>(`/customers/${id}`, input);
    return data.customer;
  },
  async delete(id: string) {
    await apiClient.delete(`/customers/${id}`);
  },
  async addContact(id: string, input: { name: string; email: string; phone?: string; role?: string }) {
    const { data } = await apiClient.post<{ customer: Customer }>(`/customers/${id}/contacts`, input);
    return data.customer;
  },
  async addNote(id: string, body: string) {
    const { data } = await apiClient.post<{ customer: Customer }>(`/customers/${id}/notes`, { body });
    return data.customer;
  },
};

export const projectApi = {
  async list(filters: { search?: string; status?: ProjectStatus | 'all'; customerId?: string }) {
    const { data } = await apiClient.get<{ projects: Project[] }>('/projects', {
      params: { search: filters.search || undefined, status: filters.status === 'all' ? undefined : filters.status, customerId: filters.customerId || undefined },
    });
    return data.projects;
  },
  async create(input: {
    customerId?: string;
    projectName: string;
    description?: string;
    status: ProjectStatus;
    priority: Priority;
    dueDate?: string;
    assignedTo?: string;
  }) {
    const { data } = await apiClient.post<{ project: Project }>('/projects', input);
    return data.project;
  },
  async update(id: string, input: Partial<Project>) {
    const { data } = await apiClient.patch<{ project: Project }>(`/projects/${id}`, input);
    return data.project;
  },
  async delete(id: string) {
    await apiClient.delete(`/projects/${id}`);
  },
  async addMilestone(id: string, input: { title: string; dueDate?: string; completed: boolean }) {
    const { data } = await apiClient.post<{ project: Project }>(`/projects/${id}/milestones`, input);
    return data.project;
  },
};

export const taskApi = {
  async list(filters: { search?: string; status?: TaskStatus | 'all'; projectId?: string; assignedTo?: string }) {
    const { data } = await apiClient.get<{ tasks: Task[] }>('/tasks', {
      params: { search: filters.search || undefined, status: filters.status === 'all' ? undefined : filters.status, projectId: filters.projectId || undefined, assignedTo: filters.assignedTo || undefined },
    });
    return data.tasks;
  },
  async create(input: {
    projectId?: string;
    assignedTo?: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: Priority;
    dueDate?: string;
    estimatedHours?: number;
    actualHours?: number;
  }) {
    const { data } = await apiClient.post<{ task: Task }>('/tasks', input);
    return data.task;
  },
  async update(id: string, input: Partial<Task>) {
    const { data } = await apiClient.patch<{ task: Task }>(`/tasks/${id}`, input);
    return data.task;
  },
  async delete(id: string) {
    await apiClient.delete(`/tasks/${id}`);
  },
  async addComment(id: string, body: string) {
    const { data } = await apiClient.post<{ task: Task }>(`/tasks/${id}/comments`, { body });
    return data.task;
  },
};
