import crypto from 'node:crypto';
import { businessRepository } from '../repositories/business.repository.js';
import { operationsRepository } from '../repositories/operations.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { HttpError } from '../utils/http-error.js';
import { activityService } from './activity.service.js';
import { fileStorageService } from './fileStorage.service.js';
import { googleWorkspaceService } from './googleWorkspace.service.js';
import { calculateInvoiceTotals } from './invoiceCalculator.js';
import { notificationService } from './notification.service.js';
const notFound = (label) => new HttpError(404, `${label} not found.`);
const cents = (value) => Math.round(value * 100) / 100;
const totals = (lineItems, taxRate) => {
    const subtotal = cents(lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0));
    const taxableSubtotal = cents(lineItems.filter((item) => item.taxable).reduce((sum, item) => sum + item.quantity * item.rate, 0));
    const taxTotal = cents(taxableSubtotal * taxRate);
    return { subtotal, taxTotal, total: cents(subtotal + taxTotal) };
};
export const documentService = {
    list: (filters) => businessRepository.listDocuments(filters),
    async create(input, user) {
        const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `${crypto.randomUUID()}-${safeName}`;
        const bytes = input.fileContentBase64 ? Buffer.from(input.fileContentBase64, 'base64') : undefined;
        const project = input.projectId ? await operationsRepository.findProjectById(input.projectId) : undefined;
        const uploader = await userRepository.findById(user.id);
        let driveFileId;
        let driveViewUrl;
        let lastSyncError;
        let storageProvider = 'local';
        if (bytes) {
            await fileStorageService.save(storagePath, bytes);
        }
        if (bytes && project?.driveFolderId && uploader?.googleRefreshToken) {
            try {
                const uploaded = await googleWorkspaceService.uploadDriveFile({
                    refreshToken: uploader.googleRefreshToken,
                    parentFolderId: project.driveFolderId,
                    fileName: safeName,
                    mimeType: input.mimeType ?? 'application/octet-stream',
                    bytes,
                });
                driveFileId = uploaded.id;
                driveViewUrl = uploaded.webViewLink ?? uploaded.webContentLink;
                storageProvider = 'hybrid';
            }
            catch (error) {
                lastSyncError = error instanceof Error ? error.message : 'Drive upload failed.';
            }
        }
        const document = await businessRepository.createDocument({
            ...input,
            fileName: safeName,
            mimeType: input.mimeType,
            revision: 1,
            storagePath,
            storageProvider,
            uploadedBy: user.id,
            driveFileId,
            driveViewUrl,
            lastSyncError,
        });
        await notificationService.notifyRole('project_manager', {
            type: 'workflow',
            title: 'Document uploaded',
            message: `${document.fileName} revision ${document.revision} is ready for review.`,
            link: '/files',
            emailQueued: false,
        });
        await activityService.record({
            entityType: 'document',
            entityId: document.id,
            action: 'created',
            summary: `Document ${document.fileName} revision ${document.revision} was uploaded.`,
            actorUserId: user.id,
            relatedProjectId: document.projectId,
        });
        return document;
    },
    async update(id, input, user) {
        const document = await businessRepository.updateDocument(id, {
            ...input,
            lockedBy: input.status && input.status !== 'locked' ? undefined : input.lockedBy,
        });
        if (!document)
            throw notFound('Document');
        await activityService.record({
            entityType: 'document',
            entityId: document.id,
            action: 'updated',
            summary: `Document ${document.fileName} was updated.`,
            actorUserId: user.id,
            relatedProjectId: document.projectId,
        });
        return document;
    },
    async revise(id, input, user) {
        const [existing] = (await businessRepository.listDocuments({})).filter((item) => item.id === id);
        if (!existing)
            throw notFound('Document');
        const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `${crypto.randomUUID()}-${safeName}`;
        const bytes = input.fileContentBase64 ? Buffer.from(input.fileContentBase64, 'base64') : undefined;
        const project = existing.projectId ? await operationsRepository.findProjectById(existing.projectId) : undefined;
        const uploader = await userRepository.findById(user.id);
        let driveFileId;
        let driveViewUrl;
        let lastSyncError;
        let storageProvider = bytes ? 'local' : existing.storageProvider;
        if (bytes) {
            await fileStorageService.save(storagePath, bytes);
        }
        if (bytes && project?.driveFolderId && uploader?.googleRefreshToken) {
            try {
                const uploaded = await googleWorkspaceService.uploadDriveFile({
                    refreshToken: uploader.googleRefreshToken,
                    parentFolderId: project.driveFolderId,
                    fileName: safeName,
                    mimeType: input.mimeType ?? existing.mimeType ?? 'application/octet-stream',
                    bytes,
                });
                driveFileId = uploaded.id;
                driveViewUrl = uploaded.webViewLink ?? uploaded.webContentLink;
                storageProvider = 'hybrid';
            }
            catch (error) {
                lastSyncError = error instanceof Error ? error.message : 'Drive upload failed.';
            }
        }
        const document = await businessRepository.updateDocument(id, {
            ...input,
            fileName: safeName,
            mimeType: input.mimeType ?? existing.mimeType,
            storagePath: bytes ? storagePath : existing.storagePath,
            storageProvider,
            revision: existing.revision + 1,
            uploadedBy: user.id,
            status: 'review',
            lockedBy: undefined,
            driveFileId: driveFileId ?? existing.driveFileId,
            driveViewUrl: driveViewUrl ?? existing.driveViewUrl,
            lastSyncError,
        });
        if (!document)
            throw notFound('Document');
        await activityService.record({
            entityType: 'document',
            entityId: document.id,
            action: 'revised',
            summary: `Document ${document.fileName} advanced to revision ${document.revision}.`,
            actorUserId: user.id,
            relatedProjectId: document.projectId,
        });
        return document;
    },
    async download(id) {
        const [document] = (await businessRepository.listDocuments({})).filter((item) => item.id === id);
        if (!document)
            throw notFound('Document');
        const exists = await fileStorageService.exists(document.storagePath);
        if (!exists) {
            throw new HttpError(404, 'Document file is not available for download.');
        }
        return {
            document,
            absolutePath: fileStorageService.resolve(document.storagePath),
        };
    },
    async delete(id, user) {
        const [existing] = (await businessRepository.listDocuments({})).filter((item) => item.id === id);
        const deleted = await businessRepository.deleteDocument(id);
        if (!deleted)
            throw notFound('Document');
        await activityService.record({
            entityType: 'document',
            entityId: id,
            action: 'deleted',
            summary: `Document ${existing?.fileName ?? id} was deleted.`,
            actorUserId: user.id,
            relatedProjectId: existing?.projectId,
        });
    },
};
export const timeService = {
    list: (filters) => businessRepository.listTimeEntries(filters),
    async create(input, user) {
        const entry = await businessRepository.createTimeEntry({ ...input, userId: user.id });
        await activityService.record({
            entityType: 'time_entry',
            entityId: entry.id,
            action: 'created',
            summary: `A ${entry.hours.toFixed(2)} hour time entry was logged.`,
            actorUserId: user.id,
            relatedProjectId: entry.projectId,
        });
        return entry;
    },
    async update(id, input, user) {
        const entry = await businessRepository.updateTimeEntry(id, input);
        if (!entry)
            throw notFound('Time entry');
        await activityService.record({
            entityType: 'time_entry',
            entityId: entry.id,
            action: 'updated',
            summary: `Time entry ${entry.id} was updated.`,
            actorUserId: user.id,
            relatedProjectId: entry.projectId,
        });
        return entry;
    },
    async startTimer(input, user) {
        const entry = await businessRepository.createTimeEntry({
            ...input,
            userId: user.id,
            hours: 0,
            entryDate: new Date().toISOString().slice(0, 10),
            status: 'draft',
            startedAt: new Date().toISOString(),
        });
        await activityService.record({
            entityType: 'time_entry',
            entityId: entry.id,
            action: 'timer_started',
            summary: 'A live time tracker was started.',
            actorUserId: user.id,
            relatedProjectId: entry.projectId,
        });
        return entry;
    },
    async stopTimer(id, user) {
        const existing = (await businessRepository.listTimeEntries({})).find((item) => item.id === id);
        if (!existing)
            throw notFound('Time entry');
        if (!existing.startedAt)
            throw new HttpError(400, 'This time entry is not running.');
        const endedAt = new Date().toISOString();
        const hours = cents((new Date(endedAt).getTime() - new Date(existing.startedAt).getTime()) / 3600000);
        const updated = await businessRepository.updateTimeEntry(id, { endedAt, hours: Math.max(hours, 0.01) });
        if (!updated)
            throw notFound('Time entry');
        await activityService.record({
            entityType: 'time_entry',
            entityId: updated.id,
            action: 'timer_stopped',
            summary: `A live time tracker was stopped at ${updated.hours.toFixed(2)} hours.`,
            actorUserId: user.id,
            relatedProjectId: updated.projectId,
        });
        return updated;
    },
    async delete(id, user) {
        const existing = (await businessRepository.listTimeEntries({})).find((item) => item.id === id);
        const deleted = await businessRepository.deleteTimeEntry(id);
        if (!deleted)
            throw notFound('Time entry');
        await activityService.record({
            entityType: 'time_entry',
            entityId: id,
            action: 'deleted',
            summary: `Time entry ${id} was deleted.`,
            actorUserId: user.id,
            relatedProjectId: existing?.projectId,
        });
    },
};
export const quoteService = {
    list: (filters) => businessRepository.listQuotes(filters),
    async get(id) {
        const quote = await businessRepository.findQuoteById(id);
        if (!quote)
            throw notFound('Quote');
        return quote;
    },
    async create(input, user) {
        const lineItems = input.lineItems.map((item) => ({ id: crypto.randomUUID(), ...item }));
        const calculated = totals(lineItems, input.taxRate);
        const quote = await businessRepository.createQuote({ ...input, lineItems, ...calculated, converted: false, createdBy: user.id });
        await activityService.record({
            entityType: 'quote',
            entityId: quote.id,
            action: 'created',
            summary: `Quote ${quote.title} was created for $${quote.total.toFixed(2)}.`,
            actorUserId: user.id,
            relatedCustomerId: quote.customerId,
            relatedProjectId: quote.projectId,
        });
        return quote;
    },
    async update(id, input, user) {
        const existing = await businessRepository.findQuoteById(id);
        if (!existing)
            throw notFound('Quote');
        if (existing.converted)
            throw new HttpError(409, 'Converted quotes are locked.');
        const lineItems = input.lineItems?.map((item) => ({ id: crypto.randomUUID(), ...item }));
        const calculated = lineItems ? totals(lineItems, input.taxRate ?? 0) : {};
        const quote = await businessRepository.updateQuote(id, { ...input, lineItems, ...calculated });
        if (!quote)
            throw notFound('Quote');
        await activityService.record({
            entityType: 'quote',
            entityId: quote.id,
            action: 'updated',
            summary: `Quote ${quote.title} was updated.`,
            actorUserId: user.id,
            relatedCustomerId: quote.customerId,
            relatedProjectId: quote.projectId,
        });
        return quote;
    },
    async delete(id, user) {
        const existing = await businessRepository.findQuoteById(id);
        const deleted = await businessRepository.deleteQuote(id);
        if (!deleted)
            throw notFound('Quote');
        await activityService.record({
            entityType: 'quote',
            entityId: id,
            action: 'deleted',
            summary: `Quote ${existing?.title ?? id} was deleted.`,
            actorUserId: user.id,
            relatedCustomerId: existing?.customerId,
            relatedProjectId: existing?.projectId,
        });
    },
};
export const invoiceService = {
    list: (filters) => businessRepository.listInvoices(filters),
    async get(id) {
        const invoice = await businessRepository.findInvoiceById(id);
        if (!invoice)
            throw notFound('Invoice');
        return invoice;
    },
    async create(input, user, auditAction = 'created') {
        const quote = input.quoteId ? await businessRepository.findQuoteById(input.quoteId) : undefined;
        const lineItems = input.lineItems ??
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
        const fullInvoice = await this.get(invoice.id);
        await activityService.record({
            entityType: 'invoice',
            entityId: fullInvoice.id,
            action: auditAction.replace(/\s+/g, '_'),
            summary: `Invoice ${fullInvoice.invoiceNumber} was ${auditAction}.`,
            actorUserId: user.id,
            relatedCustomerId: fullInvoice.customerId,
            relatedProjectId: fullInvoice.projectId,
        });
        return fullInvoice;
    },
    async update(id, input, user) {
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
        if (!invoice)
            throw notFound('Invoice');
        if (user) {
            await businessRepository.appendInvoiceAudit(id, { userId: user.id, action: 'updated' });
            await activityService.record({
                entityType: 'invoice',
                entityId: invoice.id,
                action: 'updated',
                summary: `Invoice ${invoice.invoiceNumber} was updated.`,
                actorUserId: user.id,
                relatedCustomerId: invoice.customerId,
                relatedProjectId: invoice.projectId,
            });
        }
        return invoice;
    },
    async transition(id, nextStatus, user) {
        const invoice = await this.get(id);
        const allowed = {
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
        if (!updated)
            throw notFound('Invoice');
        await businessRepository.appendInvoiceAudit(id, { userId: user.id, action: `status ${invoice.status} -> ${nextStatus}` });
        await notificationService.notifyRole('admin', {
            type: 'workflow',
            title: 'Invoice status changed',
            message: `${invoice.invoiceNumber} is now ${nextStatus}.`,
            link: '/invoices',
            emailQueued: false,
        });
        await activityService.record({
            entityType: 'invoice',
            entityId: updated.id,
            action: `status_${nextStatus}`,
            summary: `Invoice ${updated.invoiceNumber} moved to ${nextStatus}.`,
            actorUserId: user.id,
            relatedCustomerId: updated.customerId,
            relatedProjectId: updated.projectId,
        });
        return this.get(id);
    },
    async delete(id, user) {
        const existing = await this.get(id);
        const deleted = await businessRepository.deleteInvoice(id);
        if (!deleted)
            throw notFound('Invoice');
        await activityService.record({
            entityType: 'invoice',
            entityId: id,
            action: 'deleted',
            summary: `Invoice ${existing.invoiceNumber} was deleted.`,
            actorUserId: user.id,
            relatedCustomerId: existing.customerId,
            relatedProjectId: existing.projectId,
        });
    },
    async markDueInvoicesOverdue() {
        const today = new Date().toISOString().slice(0, 10);
        const invoices = await businessRepository.listInvoices({ status: 'sent' });
        const overdue = invoices.filter((invoice) => invoice.dueDate && invoice.dueDate < today);
        for (const invoice of overdue) {
            const updated = await businessRepository.updateInvoice(invoice.id, { status: 'overdue' });
            if (!updated)
                continue;
            await businessRepository.appendInvoiceAudit(invoice.id, { userId: 'system', action: 'status sent -> overdue (job)' });
            await activityService.record({
                entityType: 'invoice',
                entityId: updated.id,
                action: 'status_overdue_job',
                summary: `Invoice ${updated.invoiceNumber} was marked overdue by a background job.`,
                actorUserId: 'system',
                relatedCustomerId: updated.customerId,
                relatedProjectId: updated.projectId,
            });
            await notificationService.notifyRole('admin', {
                type: 'deadline',
                title: 'Invoice overdue',
                message: `${invoice.invoiceNumber} is now overdue.`,
                link: '/invoices',
                emailQueued: true,
            });
        }
        return overdue.length;
    },
};
