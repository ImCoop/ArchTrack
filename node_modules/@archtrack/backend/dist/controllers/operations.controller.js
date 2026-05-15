import { customerService, projectService, taskService } from '../services/operations.service.js';
import { attachDriveFolderSchema, createDriveFolderSchema, customerContactSchema, customerSchema, listCustomersSchema, listProjectsSchema, listTasksSchema, milestoneSchema, noteSchema, projectSchema, taskSchema, } from '../utils/operations.schemas.js';
const param = (request, name) => {
    const value = request.params[name];
    return Array.isArray(value) ? value[0] : value;
};
export const customerController = {
    async list(request, response) {
        response.json({ customers: await customerService.list(listCustomersSchema.parse(request.query)) });
    },
    async create(request, response) {
        response.status(201).json({ customer: await customerService.create(customerSchema.parse(request.body), request.user) });
    },
    async update(request, response) {
        response.json({ customer: await customerService.update(param(request, 'id'), customerSchema.partial().parse(request.body), request.user) });
    },
    async delete(request, response) {
        await customerService.delete(param(request, 'id'), request.user);
        response.status(204).send();
    },
    async addContact(request, response) {
        response.status(201).json({ customer: await customerService.addContact(param(request, 'id'), customerContactSchema.parse(request.body), request.user) });
    },
    async addNote(request, response) {
        const input = noteSchema.parse(request.body);
        response.status(201).json({ customer: await customerService.addNote(param(request, 'id'), input.body, request.user) });
    },
};
export const projectController = {
    async list(request, response) {
        response.json({ projects: await projectService.list(listProjectsSchema.parse(request.query)) });
    },
    async create(request, response) {
        response.status(201).json({ project: await projectService.create({ ...projectSchema.parse(request.body), createdBy: request.user.id }, request.user) });
    },
    async update(request, response) {
        response.json({ project: await projectService.update(param(request, 'id'), projectSchema.partial().parse(request.body), request.user) });
    },
    async delete(request, response) {
        await projectService.delete(param(request, 'id'), request.user);
        response.status(204).send();
    },
    async addMilestone(request, response) {
        response.status(201).json({ project: await projectService.addMilestone(param(request, 'id'), milestoneSchema.parse(request.body), request.user) });
    },
    async createDriveFolder(request, response) {
        const input = createDriveFolderSchema.parse(request.body);
        response.status(201).json({ project: await projectService.createDriveFolder(param(request, 'id'), request.user, input.folderName) });
    },
    async attachDriveFolder(request, response) {
        const input = attachDriveFolderSchema.parse(request.body);
        response.status(201).json({ project: await projectService.attachDriveFolder(param(request, 'id'), request.user, input.folder, input.folderName) });
    },
};
export const taskController = {
    async list(request, response) {
        response.json({ tasks: await taskService.list(listTasksSchema.parse(request.query)) });
    },
    async create(request, response) {
        response.status(201).json({ task: await taskService.create({ ...taskSchema.parse(request.body), createdBy: request.user.id }, request.user) });
    },
    async update(request, response) {
        response.json({ task: await taskService.update(param(request, 'id'), taskSchema.partial().parse(request.body), request.user) });
    },
    async delete(request, response) {
        await taskService.delete(param(request, 'id'), request.user);
        response.status(204).send();
    },
    async addComment(request, response) {
        const input = noteSchema.parse(request.body);
        response.status(201).json({ task: await taskService.addComment(param(request, 'id'), input.body, request.user) });
    },
};
