import { operationsRepository } from '../repositories/operations.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import type { AuthenticatedUser } from '../types/auth.js';
import type { Customer, Project, Task } from '../types/operations.js';
import { HttpError } from '../utils/http-error.js';
import { googleWorkspaceService } from './googleWorkspace.service.js';
import { notificationService } from './notification.service.js';

const notFound = (label: string) => new HttpError(404, `${label} not found.`);
const extractDriveFolderId = (value: string) => {
  const trimmed = value.trim();
  const urlMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (urlMatch) return urlMatch[1];
  const queryMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (queryMatch) return queryMatch[1];
  return trimmed;
};

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
  async createDriveFolder(id: string, user: AuthenticatedUser, folderName?: string) {
    const project = await operationsRepository.findProjectById(id);
    if (!project) throw notFound('Project');

    if (project.driveFolderId && project.driveFolderUrl) {
      return project;
    }

    const fullUser = await userRepository.findById(user.id);
    if (!fullUser?.googleRefreshToken) {
      throw new HttpError(409, 'Link your Google account again to enable Drive folders.');
    }

    const createdFolder = await googleWorkspaceService.createDriveFolder({
      refreshToken: fullUser.googleRefreshToken,
      name: folderName?.trim() || project.projectName,
      parentFolderId: undefined,
    });

    const updated = await operationsRepository.updateProject(id, {
      driveFolderId: createdFolder.id,
      driveFolderUrl: createdFolder.webViewLink,
      driveFolderName: createdFolder.name,
    });
    if (!updated) throw notFound('Project');

    await notificationService.notifyRole('project_manager', {
      type: 'workflow',
      title: 'Drive folder linked',
      message: `${updated.projectName} now has a Google Drive folder.`,
      link: '/projects',
      emailQueued: false,
    });

    return updated;
  },
  async attachDriveFolder(id: string, user: AuthenticatedUser, folder: string, folderName?: string) {
    const project = await operationsRepository.findProjectById(id);
    if (!project) throw notFound('Project');

    const fullUser = await userRepository.findById(user.id);
    if (!fullUser?.googleRefreshToken) {
      throw new HttpError(409, 'Link your Google account again to enable Drive folders.');
    }

    const folderId = extractDriveFolderId(folder);
    const driveFolder = await googleWorkspaceService.getDriveFile({
      refreshToken: fullUser.googleRefreshToken,
      fileId: folderId,
    });

    if (driveFolder.mimeType && driveFolder.mimeType !== 'application/vnd.google-apps.folder') {
      throw new HttpError(400, 'The selected Google Drive item is not a folder.');
    }

    const updated = await operationsRepository.updateProject(id, {
      driveFolderId: driveFolder.id,
      driveFolderUrl: driveFolder.webViewLink ?? `https://drive.google.com/drive/folders/${driveFolder.id}`,
      driveFolderName: folderName?.trim() || driveFolder.name || project.projectName,
    });
    if (!updated) throw notFound('Project');

    await notificationService.notifyRole('project_manager', {
      type: 'workflow',
      title: 'Drive folder attached',
      message: `${updated.projectName} is now linked to an existing Google Drive folder.`,
      link: '/projects',
      emailQueued: false,
    });

    return updated;
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
