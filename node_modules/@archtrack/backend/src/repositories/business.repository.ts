import type { Invoice, InvoiceAuditEvent, ProjectDocument, Quote, TimeEntry } from '../types/business.js';
import { id, instantRepository, now } from './instant.repository.js';

const nextNumberFromInvoices = (invoices: Invoice[]) => {
  const max = invoices.reduce((highest, invoice) => {
    const match = invoice.invoiceNumber.match(/^INV-(\d+)$/);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);

  return `INV-${String(max + 1).padStart(6, '0')}`;
};

export const businessRepository = {
  async listDocuments(filters?: { projectId?: string; status?: ProjectDocument['status']; search?: string }) {
    const documents = await instantRepository.list<ProjectDocument>('documents');
    const search = filters?.search?.trim().toLowerCase();
    return documents.filter((document) => {
      const matchesProject = !filters?.projectId || document.projectId === filters.projectId;
      const matchesStatus = !filters?.status || document.status === filters.status;
      const matchesSearch = !search || document.fileName.toLowerCase().includes(search);
      return matchesProject && matchesStatus && matchesSearch;
    });
  },

  async createDocument(input: Omit<ProjectDocument, 'id' | 'createdAt' | 'updatedAt'>) {
    const timestamp = now();
    const document = { id: id(), createdAt: timestamp, updatedAt: timestamp, ...input };
    await instantRepository.upsert<ProjectDocument>('documents', document.id, document);
    return document;
  },

  async updateDocument(documentId: string, input: Partial<Omit<ProjectDocument, 'id' | 'createdAt' | 'updatedAt'>>) {
    const existing = await instantRepository.findById<ProjectDocument>('documents', documentId);
    if (!existing) return undefined;
    const updated = { ...existing, ...input, updatedAt: now() };
    await instantRepository.upsert<ProjectDocument>('documents', documentId, updated);
    return updated;
  },

  deleteDocument(documentId: string) {
    return instantRepository.delete('documents', documentId);
  },

  async listTimeEntries(filters?: { userId?: string; projectId?: string; status?: TimeEntry['status'] }) {
    const timeEntries = await instantRepository.list<TimeEntry>('timeEntries');
    return timeEntries.filter((entry) => {
      const matchesUser = !filters?.userId || entry.userId === filters.userId;
      const matchesProject = !filters?.projectId || entry.projectId === filters.projectId;
      const matchesStatus = !filters?.status || entry.status === filters.status;
      return matchesUser && matchesProject && matchesStatus;
    });
  },

  async createTimeEntry(input: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>) {
    const timestamp = now();
    const entry = { id: id(), createdAt: timestamp, updatedAt: timestamp, ...input };
    await instantRepository.upsert<TimeEntry>('timeEntries', entry.id, entry);
    return entry;
  },

  async updateTimeEntry(entryId: string, input: Partial<Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>>) {
    const existing = await instantRepository.findById<TimeEntry>('timeEntries', entryId);
    if (!existing) return undefined;
    const updated = { ...existing, ...input, updatedAt: now() };
    await instantRepository.upsert<TimeEntry>('timeEntries', entryId, updated);
    return updated;
  },

  deleteTimeEntry(entryId: string) {
    return instantRepository.delete('timeEntries', entryId);
  },

  async listQuotes(filters?: { status?: Quote['status']; customerId?: string; projectId?: string }) {
    const quotes = await instantRepository.list<Quote>('quotes');
    return quotes.filter((quote) => {
      const matchesStatus = !filters?.status || quote.status === filters.status;
      const matchesCustomer = !filters?.customerId || quote.customerId === filters.customerId;
      const matchesProject = !filters?.projectId || quote.projectId === filters.projectId;
      return matchesStatus && matchesCustomer && matchesProject;
    });
  },

  async createQuote(input: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>) {
    const timestamp = now();
    const quote = { id: id(), createdAt: timestamp, updatedAt: timestamp, ...input };
    await instantRepository.upsert<Quote>('quotes', quote.id, quote);
    return quote;
  },

  async updateQuote(quoteId: string, input: Partial<Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>>) {
    const existing = await instantRepository.findById<Quote>('quotes', quoteId);
    if (!existing) return undefined;
    const updated = { ...existing, ...input, updatedAt: now() };
    await instantRepository.upsert<Quote>('quotes', quoteId, updated);
    return updated;
  },

  findQuoteById(quoteId: string) {
    return instantRepository.findById<Quote>('quotes', quoteId);
  },

  deleteQuote(quoteId: string) {
    return instantRepository.delete('quotes', quoteId);
  },

  async listInvoices(filters?: { status?: Invoice['status']; customerId?: string; projectId?: string }) {
    const invoices = await instantRepository.list<Invoice>('invoices');
    return invoices.filter((invoice) => {
      if (invoice.deletedAt) return false;
      const matchesStatus = !filters?.status || invoice.status === filters.status;
      const matchesCustomer = !filters?.customerId || invoice.customerId === filters.customerId;
      const matchesProject = !filters?.projectId || invoice.projectId === filters.projectId;
      return matchesStatus && matchesCustomer && matchesProject;
    });
  },

  async createInvoice(input: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) {
    const timestamp = now();
    const invoice = { id: id(), createdAt: timestamp, updatedAt: timestamp, ...input };
    await instantRepository.upsert<Invoice>('invoices', invoice.id, invoice);
    return invoice;
  },

  async updateInvoice(invoiceId: string, input: Partial<Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>>) {
    const existing = await instantRepository.findById<Invoice>('invoices', invoiceId);
    if (!existing) return undefined;
    const updated = { ...existing, ...input, updatedAt: now() };
    await instantRepository.upsert<Invoice>('invoices', invoiceId, updated);
    return updated;
  },

  async deleteInvoice(invoiceId: string) {
    const existing = await instantRepository.findById<Invoice>('invoices', invoiceId);
    if (!existing) return false;
    await instantRepository.upsert<Invoice>('invoices', invoiceId, { ...existing, deletedAt: now(), updatedAt: now() });
    return true;
  },

  async findInvoiceById(invoiceId: string) {
    const invoice = await instantRepository.findById<Invoice>('invoices', invoiceId);
    return invoice?.deletedAt ? undefined : invoice;
  },

  async nextInvoiceNumber() {
    return nextNumberFromInvoices(await instantRepository.list<Invoice>('invoices'));
  },

  async appendInvoiceAudit(invoiceId: string, event: Omit<InvoiceAuditEvent, 'id' | 'invoiceId' | 'timestamp'>) {
    const existing = await instantRepository.findById<Invoice>('invoices', invoiceId);
    if (!existing) return undefined;
    const auditEvent: InvoiceAuditEvent = {
      id: id(),
      invoiceId,
      timestamp: now(),
      ...event,
    };
    const updated = { ...existing, auditLog: [...existing.auditLog, auditEvent], updatedAt: now() };
    await instantRepository.upsert<Invoice>('invoices', invoiceId, updated);
    return updated;
  },
};
