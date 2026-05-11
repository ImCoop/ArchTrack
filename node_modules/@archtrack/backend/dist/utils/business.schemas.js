import { z } from 'zod';
import { documentStatuses, invoiceStatuses, quoteStatuses, timeEntryStatuses } from '../types/business.js';
export const listDocumentsSchema = z.object({
    projectId: z.string().optional(),
    status: z.enum(documentStatuses).optional(),
    search: z.string().optional(),
});
export const documentSchema = z.object({
    projectId: z.string().optional(),
    fileName: z.string().min(1).max(220),
    fileType: z.enum(['DWG', 'DXF', 'PDF', 'STEP', 'DOCX', 'XLSX', 'ZIP']),
    fileSize: z.coerce.number().min(1).max(50 * 1024 * 1024),
    status: z.enum(documentStatuses).default('draft'),
});
export const updateDocumentSchema = documentSchema.partial().extend({
    lockedBy: z.string().optional(),
    revision: z.coerce.number().int().positive().optional(),
});
export const listTimeEntriesSchema = z.object({
    userId: z.string().optional(),
    projectId: z.string().optional(),
    status: z.enum(timeEntryStatuses).optional(),
});
export const timeEntrySchema = z.object({
    projectId: z.string().optional(),
    taskId: z.string().optional(),
    description: z.string().max(500).optional(),
    hours: z.coerce.number().nonnegative(),
    billable: z.boolean().default(true),
    entryDate: z.string().min(1),
    status: z.enum(timeEntryStatuses).default('draft'),
});
export const timerSchema = z.object({
    projectId: z.string().optional(),
    taskId: z.string().optional(),
    description: z.string().max(500).optional(),
    billable: z.boolean().default(true),
});
export const quoteLineItemSchema = z.object({
    description: z.string().min(1).max(220),
    quantity: z.coerce.number().positive(),
    rate: z.coerce.number().nonnegative(),
    taxable: z.boolean().default(true),
});
export const listQuotesSchema = z.object({
    status: z.enum(quoteStatuses).optional(),
    customerId: z.string().optional(),
    projectId: z.string().optional(),
});
export const quoteSchema = z.object({
    customerId: z.string().optional(),
    projectId: z.string().optional(),
    title: z.string().min(1).max(180),
    status: z.enum(quoteStatuses).default('draft'),
    taxRate: z.coerce.number().min(0).max(1).default(0),
    lineItems: z.array(quoteLineItemSchema).min(1),
});
export const listInvoicesSchema = z.object({
    status: z.enum(invoiceStatuses).optional(),
    customerId: z.string().optional(),
    projectId: z.string().optional(),
});
export const invoiceSchema = z.object({
    customerId: z.string().optional(),
    projectId: z.string().optional(),
    quoteId: z.string().optional(),
    status: z.enum(invoiceStatuses).default('draft'),
    issueDate: z.string().optional(),
    lineItems: z
        .array(z.object({
        description: z.string().min(1).max(220),
        quantity: z.coerce.number().positive(),
        unitPrice: z.coerce.number().nonnegative(),
    }))
        .optional(),
    taxRate: z.coerce.number().min(0).max(1).default(0),
    discountAmount: z.coerce.number().nonnegative().default(0),
    dueDate: z.string().optional(),
});
