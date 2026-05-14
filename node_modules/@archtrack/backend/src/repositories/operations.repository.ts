import type { Customer, Project, Task } from '../types/operations.js';
import { id, instantRepository, now } from './instant.repository.js';

export const operationsRepository = {
  async listCustomers(filters?: { search?: string; status?: Customer['status'] }) {
    const customers = await instantRepository.list<Customer>('customers');
    const search = filters?.search?.toLowerCase().trim();

    return customers.filter((customer) => {
      const matchesSearch =
        !search ||
        [customer.companyName, customer.email ?? '', customer.phone ?? '', customer.billingAddress ?? '']
          .join(' ')
          .toLowerCase()
          .includes(search);
      const matchesStatus = !filters?.status || customer.status === filters.status;

      return matchesSearch && matchesStatus;
    });
  },

  async createCustomer(input: Omit<Customer, 'id' | 'contacts' | 'notes' | 'createdAt' | 'updatedAt'>) {
    const timestamp = now();
    const customer: Customer = {
      id: id(),
      contacts: [],
      notes: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      ...input,
    };

    await instantRepository.upsert<Customer>('customers', customer.id, customer);
    return customer;
  },

  async updateCustomer(customerId: string, input: Partial<Omit<Customer, 'id' | 'contacts' | 'notes' | 'createdAt' | 'updatedAt'>>) {
    const existing = await instantRepository.findById<Customer>('customers', customerId);

    if (!existing) return undefined;

    const updated = { ...existing, ...input, updatedAt: now() };
    await instantRepository.upsert<Customer>('customers', customerId, updated);
    return updated;
  },

  deleteCustomer(customerId: string) {
    return instantRepository.delete('customers', customerId);
  },

  async addCustomerContact(customerId: string, input: Omit<Customer['contacts'][number], 'id'>) {
    const existing = await instantRepository.findById<Customer>('customers', customerId);

    if (!existing) return undefined;

    const updated = {
      ...existing,
      contacts: [...existing.contacts, { id: id(), ...input }],
      updatedAt: now(),
    };
    await instantRepository.upsert<Customer>('customers', customerId, updated);
    return updated;
  },

  async addCustomerNote(customerId: string, input: Omit<Customer['notes'][number], 'id' | 'createdAt'>) {
    const existing = await instantRepository.findById<Customer>('customers', customerId);

    if (!existing) return undefined;

    const updated = {
      ...existing,
      notes: [...existing.notes, { id: id(), createdAt: now(), ...input }],
      updatedAt: now(),
    };
    await instantRepository.upsert<Customer>('customers', customerId, updated);
    return updated;
  },

  async listProjects(filters?: { search?: string; status?: Project['status']; customerId?: string }) {
    const projects = await instantRepository.list<Project>('projects');
    const search = filters?.search?.toLowerCase().trim();

    return projects.filter((project) => {
      const matchesSearch =
        !search || [project.projectName, project.description ?? '', project.priority].join(' ').toLowerCase().includes(search);
      const matchesStatus = !filters?.status || project.status === filters.status;
      const matchesCustomer = !filters?.customerId || project.customerId === filters.customerId;

      return matchesSearch && matchesStatus && matchesCustomer;
    });
  },

  findProjectById(projectId: string) {
    return instantRepository.findById<Project>('projects', projectId);
  },

  async createProject(input: Omit<Project, 'id' | 'milestones' | 'createdAt' | 'updatedAt'>) {
    const timestamp = now();
    const project: Project = {
      id: id(),
      milestones: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      ...input,
    };

    await instantRepository.upsert<Project>('projects', project.id, project);
    return project;
  },

  async updateProject(projectId: string, input: Partial<Omit<Project, 'id' | 'milestones' | 'createdAt' | 'updatedAt'>>) {
    const existing = await instantRepository.findById<Project>('projects', projectId);

    if (!existing) return undefined;

    const updated = { ...existing, ...input, updatedAt: now() };
    await instantRepository.upsert<Project>('projects', projectId, updated);
    return updated;
  },

  deleteProject(projectId: string) {
    return instantRepository.delete('projects', projectId);
  },

  async addMilestone(projectId: string, input: Omit<Project['milestones'][number], 'id'>) {
    const existing = await instantRepository.findById<Project>('projects', projectId);

    if (!existing) return undefined;

    const updated = {
      ...existing,
      milestones: [...existing.milestones, { id: id(), ...input }],
      updatedAt: now(),
    };
    await instantRepository.upsert<Project>('projects', projectId, updated);
    return updated;
  },

  async listTasks(filters?: { search?: string; status?: Task['status']; projectId?: string; assignedTo?: string }) {
    const tasks = await instantRepository.list<Task>('tasks');
    const search = filters?.search?.toLowerCase().trim();

    return tasks.filter((task) => {
      const matchesSearch =
        !search || [task.title, task.description ?? '', task.priority].join(' ').toLowerCase().includes(search);
      const matchesStatus = !filters?.status || task.status === filters.status;
      const matchesProject = !filters?.projectId || task.projectId === filters.projectId;
      const matchesAssignee = !filters?.assignedTo || task.assignedTo === filters.assignedTo;

      return matchesSearch && matchesStatus && matchesProject && matchesAssignee;
    });
  },

  async createTask(input: Omit<Task, 'id' | 'comments' | 'createdAt' | 'updatedAt'>) {
    const timestamp = now();
    const task: Task = {
      id: id(),
      comments: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      ...input,
    };

    await instantRepository.upsert<Task>('tasks', task.id, task);
    return task;
  },

  async updateTask(taskId: string, input: Partial<Omit<Task, 'id' | 'comments' | 'createdAt' | 'updatedAt'>>) {
    const existing = await instantRepository.findById<Task>('tasks', taskId);

    if (!existing) return undefined;

    const updated = { ...existing, ...input, updatedAt: now() };
    await instantRepository.upsert<Task>('tasks', taskId, updated);
    return updated;
  },

  deleteTask(taskId: string) {
    return instantRepository.delete('tasks', taskId);
  },

  async addTaskComment(taskId: string, input: Omit<Task['comments'][number], 'id' | 'createdAt'>) {
    const existing = await instantRepository.findById<Task>('tasks', taskId);

    if (!existing) return undefined;

    const updated = {
      ...existing,
      comments: [...existing.comments, { id: id(), createdAt: now(), ...input }],
      updatedAt: now(),
    };
    await instantRepository.upsert<Task>('tasks', taskId, updated);
    return updated;
  },
};
