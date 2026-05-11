import { operationsRepository } from '../repositories/operations.repository.js';
import type { AuthenticatedUser } from '../types/auth.js';
import type { Customer, Project, Task } from '../types/operations.js';
import { HttpError } from '../utils/http-error.js';
import { notificationService } from './notification.service.js';

const notFound = (label: string) => new HttpError(404, `${label} not found.`);

export const customerService = {
  list: (filters?: { search?: string; status?: Customer['status'] }) => operationsRepository.listCustomers(filters),
  async create(input: Omit<Customer, 'id' | 'contacts' | 'notes' | 'createdAt' | 'updatedAt'>) {
    const customer = await operationsRepository.createCustomer(input);
    await notificationService.notifyRole('admin', {
      type: 'workflow',
      title: 'Customer created',
      message: `${customer.companyName} was added to CRM.`,
      link: '/crm',
      emailQueued: false,
    });
    return customer;
  },
  async update(id: string, input: Partial<Omit<Customer, 'id' | 'contacts' | 'notes' | 'createdAt' | 'updatedAt'>>) {
    const customer = await operationsRepository.updateCustomer(id, input);
    if (!customer) throw notFound('Customer');
    return customer;
  },
  async delete(id: string) {
    const deleted = await operationsRepository.deleteCustomer(id);
    if (!deleted) throw notFound('Customer');
  },
  async addContact(id: string, input: Omit<Customer['contacts'][number], 'id'>) {
    const customer = await operationsRepository.addCustomerContact(id, input);
    if (!customer) throw notFound('Customer');
    return customer;
  },
  async addNote(id: string, body: string, user: AuthenticatedUser) {
    const customer = await operationsRepository.addCustomerNote(id, { body, createdBy: user.id });
    if (!customer) throw notFound('Customer');
    return customer;
  },
};

export const projectService = {
  list: (filters?: { search?: string; status?: Project['status']; customerId?: string }) =>
    operationsRepository.listProjects(filters),
  async create(input: Omit<Project, 'id' | 'milestones' | 'createdAt' | 'updatedAt'>) {
    const project = await operationsRepository.createProject(input);
    await notificationService.notifyRole('project_manager', {
      type: 'workflow',
      title: 'Project created',
      message: `${project.projectName} is now in ${project.status}.`,
      link: '/projects',
      emailQueued: false,
    });
    return project;
  },
  async update(id: string, input: Partial<Omit<Project, 'id' | 'milestones' | 'createdAt' | 'updatedAt'>>) {
    const project = await operationsRepository.updateProject(id, input);
    if (!project) throw notFound('Project');
    return project;
  },
  async delete(id: string) {
    const deleted = await operationsRepository.deleteProject(id);
    if (!deleted) throw notFound('Project');
  },
  async addMilestone(id: string, input: Omit<Project['milestones'][number], 'id'>) {
    const project = await operationsRepository.addMilestone(id, input);
    if (!project) throw notFound('Project');
    return project;
  },
};

export const taskService = {
  list: (filters?: { search?: string; status?: Task['status']; projectId?: string; assignedTo?: string }) =>
    operationsRepository.listTasks(filters),
  async create(input: Omit<Task, 'id' | 'comments' | 'createdAt' | 'updatedAt'>) {
    const task = await operationsRepository.createTask(input);
    if (task.assignedTo) {
      await notificationService.notifyRole('admin', {
        type: 'assignment',
        title: 'Task assigned',
        message: `${task.title} was assigned to ${task.assignedTo}.`,
        link: '/tasks',
        emailQueued: true,
      });
    }
    return task;
  },
  async update(id: string, input: Partial<Omit<Task, 'id' | 'comments' | 'createdAt' | 'updatedAt'>>) {
    const task = await operationsRepository.updateTask(id, input);
    if (!task) throw notFound('Task');
    return task;
  },
  async delete(id: string) {
    const deleted = await operationsRepository.deleteTask(id);
    if (!deleted) throw notFound('Task');
  },
  async addComment(id: string, body: string, user: AuthenticatedUser) {
    const task = await operationsRepository.addTaskComment(id, { body, createdBy: user.id });
    if (!task) throw notFound('Task');
    return task;
  },
};
