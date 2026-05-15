import { operationsRepository } from '../repositories/operations.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import type { AuthenticatedUser } from '../types/auth.js';
import type { Customer, Project, Task } from '../types/operations.js';
import { HttpError } from '../utils/http-error.js';
import { activityService } from './activity.service.js';
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
  async create(input: Omit<Customer, 'id' | 'contacts' | 'notes' | 'createdAt' | 'updatedAt'>, user: AuthenticatedUser) {
    const customer = await operationsRepository.createCustomer(input);
    await activityService.record({
      entityType: 'customer',
      entityId: customer.id,
      action: 'created',
      summary: `Customer ${customer.companyName} was created.`,
      actorUserId: user.id,
      relatedCustomerId: customer.id,
    });
    await notificationService.notifyRole('admin', {
      type: 'workflow',
      title: 'Customer created',
      message: `${customer.companyName} was added to CRM.`,
      link: '/crm',
      emailQueued: false,
    });
    return customer;
  },
  async update(id: string, input: Partial<Omit<Customer, 'id' | 'contacts' | 'notes' | 'createdAt' | 'updatedAt'>>, user: AuthenticatedUser) {
    const customer = await operationsRepository.updateCustomer(id, input);
    if (!customer) throw notFound('Customer');
    await activityService.record({
      entityType: 'customer',
      entityId: customer.id,
      action: 'updated',
      summary: `Customer ${customer.companyName} was updated.`,
      actorUserId: user.id,
      relatedCustomerId: customer.id,
    });
    return customer;
  },
  async delete(id: string, user: AuthenticatedUser) {
    const existing = (await operationsRepository.listCustomers({})).find((customer) => customer.id === id);
    const deleted = await operationsRepository.deleteCustomer(id);
    if (!deleted) throw notFound('Customer');
    await activityService.record({
      entityType: 'customer',
      entityId: id,
      action: 'deleted',
      summary: `Customer ${existing?.companyName ?? id} was deleted.`,
      actorUserId: user.id,
      relatedCustomerId: id,
    });
  },
  async addContact(id: string, input: Omit<Customer['contacts'][number], 'id'>, user: AuthenticatedUser) {
    const customer = await operationsRepository.addCustomerContact(id, input);
    if (!customer) throw notFound('Customer');
    await activityService.record({
      entityType: 'customer',
      entityId: customer.id,
      action: 'contact_added',
      summary: `A contact was added to ${customer.companyName}.`,
      actorUserId: user.id,
      relatedCustomerId: customer.id,
    });
    return customer;
  },
  async addNote(id: string, body: string, user: AuthenticatedUser) {
    const customer = await operationsRepository.addCustomerNote(id, { body, createdBy: user.id });
    if (!customer) throw notFound('Customer');
    await activityService.record({
      entityType: 'customer',
      entityId: customer.id,
      action: 'note_added',
      summary: `A customer note was added to ${customer.companyName}.`,
      actorUserId: user.id,
      relatedCustomerId: customer.id,
    });
    return customer;
  },
};

export const projectService = {
  list: (filters?: { search?: string; status?: Project['status']; customerId?: string }) =>
    operationsRepository.listProjects(filters),
  async create(input: Omit<Project, 'id' | 'milestones' | 'createdAt' | 'updatedAt'>, user: AuthenticatedUser) {
    const project = await operationsRepository.createProject(input);
    await activityService.record({
      entityType: 'project',
      entityId: project.id,
      action: 'created',
      summary: `Project ${project.projectName} was created.`,
      actorUserId: user.id,
      relatedCustomerId: project.customerId,
      relatedProjectId: project.id,
    });
    await notificationService.notifyRole('project_manager', {
      type: 'workflow',
      title: 'Project created',
      message: `${project.projectName} is now in ${project.status}.`,
      link: '/projects',
      emailQueued: false,
    });
    return project;
  },
  async update(id: string, input: Partial<Omit<Project, 'id' | 'milestones' | 'createdAt' | 'updatedAt'>>, user: AuthenticatedUser) {
    const project = await operationsRepository.updateProject(id, input);
    if (!project) throw notFound('Project');
    await activityService.record({
      entityType: 'project',
      entityId: project.id,
      action: 'updated',
      summary: `Project ${project.projectName} was updated.`,
      actorUserId: user.id,
      relatedCustomerId: project.customerId,
      relatedProjectId: project.id,
    });
    return project;
  },
  async delete(id: string, user: AuthenticatedUser) {
    const existing = await operationsRepository.findProjectById(id);
    const deleted = await operationsRepository.deleteProject(id);
    if (!deleted) throw notFound('Project');
    await activityService.record({
      entityType: 'project',
      entityId: id,
      action: 'deleted',
      summary: `Project ${existing?.projectName ?? id} was deleted.`,
      actorUserId: user.id,
      relatedCustomerId: existing?.customerId,
      relatedProjectId: id,
    });
  },
  async addMilestone(id: string, input: Omit<Project['milestones'][number], 'id'>, user: AuthenticatedUser) {
    const project = await operationsRepository.addMilestone(id, input);
    if (!project) throw notFound('Project');
    await activityService.record({
      entityType: 'project',
      entityId: project.id,
      action: 'milestone_added',
      summary: `Milestone "${input.title}" was added to ${project.projectName}.`,
      actorUserId: user.id,
      relatedCustomerId: project.customerId,
      relatedProjectId: project.id,
    });
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
    await activityService.record({
      entityType: 'project',
      entityId: updated.id,
      action: 'drive_folder_created',
      summary: `A Drive folder was created for ${updated.projectName}.`,
      actorUserId: user.id,
      relatedCustomerId: updated.customerId,
      relatedProjectId: updated.id,
    });

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
    await activityService.record({
      entityType: 'project',
      entityId: updated.id,
      action: 'drive_folder_attached',
      summary: `An existing Drive folder was attached to ${updated.projectName}.`,
      actorUserId: user.id,
      relatedCustomerId: updated.customerId,
      relatedProjectId: updated.id,
    });

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
  async create(input: Omit<Task, 'id' | 'comments' | 'createdAt' | 'updatedAt'>, user: AuthenticatedUser) {
    const task = await operationsRepository.createTask(input);
    await activityService.record({
      entityType: 'task',
      entityId: task.id,
      action: 'created',
      summary: `Task ${task.title} was created.`,
      actorUserId: user.id,
      relatedProjectId: task.projectId,
    });
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
  async update(id: string, input: Partial<Omit<Task, 'id' | 'comments' | 'createdAt' | 'updatedAt'>>, user: AuthenticatedUser) {
    const task = await operationsRepository.updateTask(id, input);
    if (!task) throw notFound('Task');
    await activityService.record({
      entityType: 'task',
      entityId: task.id,
      action: 'updated',
      summary: `Task ${task.title} was updated.`,
      actorUserId: user.id,
      relatedProjectId: task.projectId,
    });
    return task;
  },
  async delete(id: string, user: AuthenticatedUser) {
    const existing = (await operationsRepository.listTasks({})).find((task) => task.id === id);
    const deleted = await operationsRepository.deleteTask(id);
    if (!deleted) throw notFound('Task');
    await activityService.record({
      entityType: 'task',
      entityId: id,
      action: 'deleted',
      summary: `Task ${existing?.title ?? id} was deleted.`,
      actorUserId: user.id,
      relatedProjectId: existing?.projectId,
    });
  },
  async addComment(id: string, body: string, user: AuthenticatedUser) {
    const task = await operationsRepository.addTaskComment(id, { body, createdBy: user.id });
    if (!task) throw notFound('Task');
    await activityService.record({
      entityType: 'task',
      entityId: task.id,
      action: 'comment_added',
      summary: `A comment was added to task ${task.title}.`,
      actorUserId: user.id,
      relatedProjectId: task.projectId,
    });
    return task;
  },
};
