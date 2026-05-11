import crypto from 'node:crypto';

import { businessRepository } from '../repositories/business.repository.js';
import type { AuthenticatedUser } from '../types/auth.js';
import type { Invoice, InvoiceLineItem, ProjectDocument, Quote, QuoteLineItem, TimeEntry } from '../types/business.js';
import { HttpError } from '../utils/http-error.js';
import { calculateInvoiceTotals } from './invoiceCalculator.js';
import { notificationService } from './notification.service.js';

const notFound = (label: string) => new HttpError(404, `${label} not found.`);
const cents = (value: number) => Math.round(value * 100) / 100;

const totals = (lineItems: Array<Omit<QuoteLineItem, 'id'> | QuoteLineItem>, taxRate: number) => {
  const subtotal = cents(lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0));
  const taxableSubtotal = cents(lineItems.filter((item) => item.taxable).reduce((sum, item) => sum + item.quantity * item.rate, 0));
  const taxTotal = cents(taxableSubtotal * taxRate);
  return { subtotal, taxTotal, total: cents(subtotal + taxTotal) };
};

export const documentService = {
  list: (filters?: { projectId?: string; status?: ProjectDocument['status']; search?: string }) =>
    businessRepository.listDocuments(filters),

  async create(input: Omit<ProjectDocument, 'id' | 'revision' | 'storagePath' | 'uploadedBy' | 'createdAt' | 'updatedAt'>, user: AuthenticatedUser) {
    const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const document = await businessRepository.createDocument({
      ...input,
      fileName: safeName,
      revision: 1,
      storagePath: `uploads/${crypto.randomUUID()}-${safeName}`,
      uploadedBy: user.id,
    });

    await notificationService.notifyRole('project_manager', {
      type: 'workflow',
      title: 'Document uploaded',
      message: `${document.fileName} revision ${document.revision} is ready for review.`,
      link: '/files',
      emailQueued: false,
    });

    return document;
  },

  async update(id: string, input: Partial<Omit<ProjectDocument, 'id' | 'createdAt' | 'updatedAt'>>) {
    const document = await businessRepository.updateDocument(id, {
      ...input,
      lockedBy: input.status && input.status !== 'locked' ? undefined : input.lockedBy,
    });
    if (!document) throw notFound('Document');
    return document;
  },

  async revise(id: string, input: Pick<ProjectDocument, 'fileName' | 'fileType' | 'fileSize'>, user: AuthenticatedUser) {
    const [existing] = (await businessRepository.listDocuments({})).filter((item) => item.id === id);
    if (!existing) throw notFound('Document');

    const document = await businessRepository.updateDocument(id, {
      ...input,
      fileName: input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_'),
      revision: existing.revision + 1,
      uploadedBy: user.id,
      status: 'review',
      lockedBy: undefined,
    });
    if (!document) throw notFound('Document');
    return document;
  },

  async delete(id: string) {
    const deleted = await businessRepository.deleteDocument(id);
    if (!deleted) throw notFound('Document');
  },
};

export const timeService = {
  list: (filters?: { userId?: string; projectId?: string; status?: TimeEntry['status'] }) => businessRepository.listTimeEntries(filters),

  create(input: Omit<TimeEntry, 'id' | 'userId' | 'startedAt' | 'endedAt' | 'createdAt' | 'updatedAt'>, user: AuthenticatedUser) {
    return businessRepository.createTimeEntry({ ...input, userId: user.id });
  },

  async update(id: string, input: Partial<Omit<TimeEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) {
    const entry = await businessRepository.updateTimeEntry(id, input);
    if (!entry) throw notFound('Time entry');
    return entry;
  },

  startTimer(input: { projectId?: string; taskId?: string; description?: string; billable: boolean }, user: AuthenticatedUser) {
    return businessRepository.createTimeEntry({
      ...input,
      userId: user.id,
      hours: 0,
      entryDate: new Date().toISOString().slice(0, 10),
      status: 'draft',
      startedAt: new Date().toISOString(),
    });
  },

  async stopTimer(id: string) {
    const existing = (await businessRepository.listTimeEntries({})).find((item) => item.id === id);
    if (!existing) throw notFound('Time entry');
    if (!existing.startedAt) throw new HttpError(400, 'This time entry is not running.');
    const endedAt = new Date().toISOString();
    const hours = cents((new Date(endedAt).getTime() - new Date(existing.startedAt).getTime()) / 3600000);
    const updated = await businessRepository.updateTimeEntry(id, { endedAt, hours: Math.max(hours, 0.01) });
    if (!updated) throw notFound('Time entry');
    return updated;
  },

  async delete(id: string) {
    const deleted = await businessRepository.deleteTimeEntry(id);
    if (!deleted) throw notFound('Time entry');
  },
};

export const quoteService = {
  list: (filters?: { status?: Quote['status']; customerId?: string; projectId?: string }) => businessRepository.listQuotes(filters),

  async get(id: string) {
    const quote = await businessRepository.findQuoteById(id);
    if (!quote) throw notFound('Quote');
    return quote;
  },

  create(input: { customerId?: string; projectId?: string; title: string; status: Quote['status']; taxRate: number; lineItems: Array<Omit<QuoteLineItem, 'id'>> }, user: AuthenticatedUser) {
    const lineItems = input.lineItems.map((item) => ({ id: crypto.randomUUID(), ...item }));
    const calculated = totals(lineItems, input.taxRate);
    return businessRepository.createQuote({ ...input, lineItems, ...calculated, converted: false, createdBy: user.id });
  },

  async update(id: string, input: Partial<{ customerId?: string; projectId?: string; title: string; status: Quote['status']; taxRate: number; lineItems: Array<Omit<QuoteLineItem, 'id'>> }>) {
    const existing = await businessRepository.findQuoteById(id);
    if (!existing) throw notFound('Quote');
    if (existing.converted) throw new HttpError(409, 'Converted quotes are locked.');
    const lineItems = input.lineItems?.map((item) => ({ id: crypto.randomUUID(), ...item }));
    const calculated = lineItems ? totals(lineItems, input.taxRate ?? 0) : {};
    const quote = await businessRepository.updateQuote(id, { ...input, lineItems, ...calculated });
    if (!quote) throw notFound('Quote');
    return quote;
  },

  async delete(id: string) {
    const deleted = await businessRepository.deleteQuote(id);
    if (!deleted) throw notFound('Quote');
  },
};

export const invoiceService = {
  list: (filters?: { status?: Invoice['status']; customerId?: string; projectId?: string }) => businessRepository.listInvoices(filters),

  async get(id: string) {
    const invoice = await businessRepository.findInvoiceById(id);
    if (!invoice) throw notFound('Invoice');
    return invoice;
  },

  async create(
    input: {
      customerId?: string;
      projectId?: string;
      quoteId?: string;
      status: Invoice['status'];
      issueDate?: string;
      lineItems?: Array<Pick<InvoiceLineItem, 'description' | 'quantity' | 'unitPrice'>>;
      taxRate: number;
      discountAmount?: number;
      dueDate?: string;
    },
    user: AuthenticatedUser,
    auditAction = 'created',
  ) {
    const quote = input.quoteId ? await businessRepository.findQuoteById(input.quoteId) : undefined;
    const lineItems =
      input.lineItems ??
      quote?.lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.rate,
      })) ??
      [];

    if (!lineItems.length) {
      throw new HttpError(400, 'At least one invoice line item is required.');
    }

    const calculated = calculateInvoiceTotals({
      lineItems,
      taxRate: input.taxRate ?? quote?.taxRate ?? 0,
      discountAmount: input.discountAmount,
    });
    const invoiceNumber = await businessRepository.nextInvoiceNumber();
    const invoice = await businessRepository.createInvoice({
      ...input,
      customerId: input.customerId ?? quote?.customerId,
      projectId: input.projectId ?? quote?.projectId,
      invoiceNumber,
      issueDate: input.issueDate ?? new Date().toISOString().slice(0, 10),
      lineItems: calculated.lineItems,
      subtotal: calculated.subtotal,
      taxRate: input.taxRate ?? quote?.taxRate ?? 0,
      taxAmount: calculated.taxAmount,
      discountAmount: calculated.discountAmount,
      total: calculated.total,
      auditLog: [],
      createdBy: user.id,
    });

    await businessRepository.appendInvoiceAudit(invoice.id, { userId: user.id, action: auditAction });
    return this.get(invoice.id);
  },

  async update(
    id: string,
    input: Partial<{
      customerId?: string;
      projectId?: string;
      quoteId?: string;
      status: Invoice['status'];
      issueDate?: string;
      lineItems: Array<Pick<InvoiceLineItem, 'description' | 'quantity' | 'unitPrice'>>;
      taxRate: number;
      discountAmount: number;
      dueDate?: string;
    }>,
    user?: AuthenticatedUser,
  ) {
    const existing = await this.get(id);
    const { lineItems: inputLineItems, ...rest } = input;
    const calculated = input.lineItems
      ? calculateInvoiceTotals({
          lineItems: inputLineItems ?? [],
          taxRate: input.taxRate ?? existing.taxRate,
          discountAmount: input.discountAmount ?? existing.discountAmount,
        })
      : undefined;
    const invoice = await businessRepository.updateInvoice(id, {
      ...rest,
      ...(calculated ?? {}),
      paidAt: input.status === 'paid' ? new Date().toISOString() : undefined,
    });
    if (!invoice) throw notFound('Invoice');
    if (user) await businessRepository.appendInvoiceAudit(id, { userId: user.id, action: 'updated' });
    return invoice;
  },

  async transition(id: string, nextStatus: Invoice['status'], user: AuthenticatedUser) {
    const invoice = await this.get(id);
    const allowed: Record<Invoice['status'], Invoice['status'][]> = {
      draft: ['sent'],
      sent: ['paid', 'overdue', 'void'],
      paid: [],
      overdue: ['paid', 'void'],
      void: [],
    };

    if (!allowed[invoice.status].includes(nextStatus)) {
      throw new HttpError(409, `Invoice cannot move from ${invoice.status} to ${nextStatus}.`);
    }

    const updated = await businessRepository.updateInvoice(id, {
      status: nextStatus,
      paidAt: nextStatus === 'paid' ? new Date().toISOString() : undefined,
    });
    if (!updated) throw notFound('Invoice');
    await businessRepository.appendInvoiceAudit(id, { userId: user.id, action: `status ${invoice.status} -> ${nextStatus}` });
    await notificationService.notifyRole('admin', {
      type: 'workflow',
      title: 'Invoice status changed',
      message: `${invoice.invoiceNumber} is now ${nextStatus}.`,
      link: '/invoices',
      emailQueued: false,
    });
    return this.get(id);
  },

  async delete(id: string) {
    const deleted = await businessRepository.deleteInvoice(id);
    if (!deleted) throw notFound('Invoice');
  },
};
