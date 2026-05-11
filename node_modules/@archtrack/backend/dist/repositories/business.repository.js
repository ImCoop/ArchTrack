import { id, instantRepository, now } from './instant.repository.js';
const nextNumberFromInvoices = (invoices) => {
    const max = invoices.reduce((highest, invoice) => {
        const match = invoice.invoiceNumber.match(/^INV-(\d+)$/);
        return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0);
    return `INV-${String(max + 1).padStart(6, '0')}`;
};
export const businessRepository = {
    async listDocuments(filters) {
        const documents = await instantRepository.list('documents');
        const search = filters?.search?.trim().toLowerCase();
        return documents.filter((document) => {
            const matchesProject = !filters?.projectId || document.projectId === filters.projectId;
            const matchesStatus = !filters?.status || document.status === filters.status;
            const matchesSearch = !search || document.fileName.toLowerCase().includes(search);
            return matchesProject && matchesStatus && matchesSearch;
        });
    },
    async createDocument(input) {
        const timestamp = now();
        const document = { id: id(), createdAt: timestamp, updatedAt: timestamp, ...input };
        await instantRepository.upsert('documents', document.id, document);
        return document;
    },
    async updateDocument(documentId, input) {
        const existing = await instantRepository.findById('documents', documentId);
        if (!existing)
            return undefined;
        const updated = { ...existing, ...input, updatedAt: now() };
        await instantRepository.upsert('documents', documentId, updated);
        return updated;
    },
    deleteDocument(documentId) {
        return instantRepository.delete('documents', documentId);
    },
    async listTimeEntries(filters) {
        const timeEntries = await instantRepository.list('timeEntries');
        return timeEntries.filter((entry) => {
            const matchesUser = !filters?.userId || entry.userId === filters.userId;
            const matchesProject = !filters?.projectId || entry.projectId === filters.projectId;
            const matchesStatus = !filters?.status || entry.status === filters.status;
            return matchesUser && matchesProject && matchesStatus;
        });
    },
    async createTimeEntry(input) {
        const timestamp = now();
        const entry = { id: id(), createdAt: timestamp, updatedAt: timestamp, ...input };
        await instantRepository.upsert('timeEntries', entry.id, entry);
        return entry;
    },
    async updateTimeEntry(entryId, input) {
        const existing = await instantRepository.findById('timeEntries', entryId);
        if (!existing)
            return undefined;
        const updated = { ...existing, ...input, updatedAt: now() };
        await instantRepository.upsert('timeEntries', entryId, updated);
        return updated;
    },
    deleteTimeEntry(entryId) {
        return instantRepository.delete('timeEntries', entryId);
    },
    async listQuotes(filters) {
        const quotes = await instantRepository.list('quotes');
        return quotes.filter((quote) => {
            const matchesStatus = !filters?.status || quote.status === filters.status;
            const matchesCustomer = !filters?.customerId || quote.customerId === filters.customerId;
            const matchesProject = !filters?.projectId || quote.projectId === filters.projectId;
            return matchesStatus && matchesCustomer && matchesProject;
        });
    },
    async createQuote(input) {
        const timestamp = now();
        const quote = { id: id(), createdAt: timestamp, updatedAt: timestamp, ...input };
        await instantRepository.upsert('quotes', quote.id, quote);
        return quote;
    },
    async updateQuote(quoteId, input) {
        const existing = await instantRepository.findById('quotes', quoteId);
        if (!existing)
            return undefined;
        const updated = { ...existing, ...input, updatedAt: now() };
        await instantRepository.upsert('quotes', quoteId, updated);
        return updated;
    },
    findQuoteById(quoteId) {
        return instantRepository.findById('quotes', quoteId);
    },
    deleteQuote(quoteId) {
        return instantRepository.delete('quotes', quoteId);
    },
    async listInvoices(filters) {
        const invoices = await instantRepository.list('invoices');
        return invoices.filter((invoice) => {
            if (invoice.deletedAt)
                return false;
            const matchesStatus = !filters?.status || invoice.status === filters.status;
            const matchesCustomer = !filters?.customerId || invoice.customerId === filters.customerId;
            const matchesProject = !filters?.projectId || invoice.projectId === filters.projectId;
            return matchesStatus && matchesCustomer && matchesProject;
        });
    },
    async createInvoice(input) {
        const timestamp = now();
        const invoice = { id: id(), createdAt: timestamp, updatedAt: timestamp, ...input };
        await instantRepository.upsert('invoices', invoice.id, invoice);
        return invoice;
    },
    async updateInvoice(invoiceId, input) {
        const existing = await instantRepository.findById('invoices', invoiceId);
        if (!existing)
            return undefined;
        const updated = { ...existing, ...input, updatedAt: now() };
        await instantRepository.upsert('invoices', invoiceId, updated);
        return updated;
    },
    async deleteInvoice(invoiceId) {
        const existing = await instantRepository.findById('invoices', invoiceId);
        if (!existing)
            return false;
        await instantRepository.upsert('invoices', invoiceId, { ...existing, deletedAt: now(), updatedAt: now() });
        return true;
    },
    async findInvoiceById(invoiceId) {
        const invoice = await instantRepository.findById('invoices', invoiceId);
        return invoice?.deletedAt ? undefined : invoice;
    },
    async nextInvoiceNumber() {
        return nextNumberFromInvoices(await instantRepository.list('invoices'));
    },
    async appendInvoiceAudit(invoiceId, event) {
        const existing = await instantRepository.findById('invoices', invoiceId);
        if (!existing)
            return undefined;
        const auditEvent = {
            id: id(),
            invoiceId,
            timestamp: now(),
            ...event,
        };
        const updated = { ...existing, auditLog: [...existing.auditLog, auditEvent], updatedAt: now() };
        await instantRepository.upsert('invoices', invoiceId, updated);
        return updated;
    },
};
