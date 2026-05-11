import { id, instantRepository, now } from './instant.repository.js';
export const operationsRepository = {
    async listCustomers(filters) {
        const customers = await instantRepository.list('customers');
        const search = filters?.search?.toLowerCase().trim();
        return customers.filter((customer) => {
            const matchesSearch = !search ||
                [customer.companyName, customer.email ?? '', customer.phone ?? '', customer.billingAddress ?? '']
                    .join(' ')
                    .toLowerCase()
                    .includes(search);
            const matchesStatus = !filters?.status || customer.status === filters.status;
            return matchesSearch && matchesStatus;
        });
    },
    async createCustomer(input) {
        const timestamp = now();
        const customer = {
            id: id(),
            contacts: [],
            notes: [],
            createdAt: timestamp,
            updatedAt: timestamp,
            ...input,
        };
        await instantRepository.upsert('customers', customer.id, customer);
        return customer;
    },
    async updateCustomer(customerId, input) {
        const existing = await instantRepository.findById('customers', customerId);
        if (!existing)
            return undefined;
        const updated = { ...existing, ...input, updatedAt: now() };
        await instantRepository.upsert('customers', customerId, updated);
        return updated;
    },
    deleteCustomer(customerId) {
        return instantRepository.delete('customers', customerId);
    },
    async addCustomerContact(customerId, input) {
        const existing = await instantRepository.findById('customers', customerId);
        if (!existing)
            return undefined;
        const updated = {
            ...existing,
            contacts: [...existing.contacts, { id: id(), ...input }],
            updatedAt: now(),
        };
        await instantRepository.upsert('customers', customerId, updated);
        return updated;
    },
    async addCustomerNote(customerId, input) {
        const existing = await instantRepository.findById('customers', customerId);
        if (!existing)
            return undefined;
        const updated = {
            ...existing,
            notes: [...existing.notes, { id: id(), createdAt: now(), ...input }],
            updatedAt: now(),
        };
        await instantRepository.upsert('customers', customerId, updated);
        return updated;
    },
    async listProjects(filters) {
        const projects = await instantRepository.list('projects');
        const search = filters?.search?.toLowerCase().trim();
        return projects.filter((project) => {
            const matchesSearch = !search || [project.projectName, project.description ?? '', project.priority].join(' ').toLowerCase().includes(search);
            const matchesStatus = !filters?.status || project.status === filters.status;
            const matchesCustomer = !filters?.customerId || project.customerId === filters.customerId;
            return matchesSearch && matchesStatus && matchesCustomer;
        });
    },
    async createProject(input) {
        const timestamp = now();
        const project = {
            id: id(),
            milestones: [],
            createdAt: timestamp,
            updatedAt: timestamp,
            ...input,
        };
        await instantRepository.upsert('projects', project.id, project);
        return project;
    },
    async updateProject(projectId, input) {
        const existing = await instantRepository.findById('projects', projectId);
        if (!existing)
            return undefined;
        const updated = { ...existing, ...input, updatedAt: now() };
        await instantRepository.upsert('projects', projectId, updated);
        return updated;
    },
    deleteProject(projectId) {
        return instantRepository.delete('projects', projectId);
    },
    async addMilestone(projectId, input) {
        const existing = await instantRepository.findById('projects', projectId);
        if (!existing)
            return undefined;
        const updated = {
            ...existing,
            milestones: [...existing.milestones, { id: id(), ...input }],
            updatedAt: now(),
        };
        await instantRepository.upsert('projects', projectId, updated);
        return updated;
    },
    async listTasks(filters) {
        const tasks = await instantRepository.list('tasks');
        const search = filters?.search?.toLowerCase().trim();
        return tasks.filter((task) => {
            const matchesSearch = !search || [task.title, task.description ?? '', task.priority].join(' ').toLowerCase().includes(search);
            const matchesStatus = !filters?.status || task.status === filters.status;
            const matchesProject = !filters?.projectId || task.projectId === filters.projectId;
            const matchesAssignee = !filters?.assignedTo || task.assignedTo === filters.assignedTo;
            return matchesSearch && matchesStatus && matchesProject && matchesAssignee;
        });
    },
    async createTask(input) {
        const timestamp = now();
        const task = {
            id: id(),
            comments: [],
            createdAt: timestamp,
            updatedAt: timestamp,
            ...input,
        };
        await instantRepository.upsert('tasks', task.id, task);
        return task;
    },
    async updateTask(taskId, input) {
        const existing = await instantRepository.findById('tasks', taskId);
        if (!existing)
            return undefined;
        const updated = { ...existing, ...input, updatedAt: now() };
        await instantRepository.upsert('tasks', taskId, updated);
        return updated;
    },
    deleteTask(taskId) {
        return instantRepository.delete('tasks', taskId);
    },
    async addTaskComment(taskId, input) {
        const existing = await instantRepository.findById('tasks', taskId);
        if (!existing)
            return undefined;
        const updated = {
            ...existing,
            comments: [...existing.comments, { id: id(), createdAt: now(), ...input }],
            updatedAt: now(),
        };
        await instantRepository.upsert('tasks', taskId, updated);
        return updated;
    },
};
