export const documentStatuses = ['draft', 'review', 'approved', 'locked'] as const;
export type DocumentStatus = (typeof documentStatuses)[number];

export interface ProjectDocument {
  id: string;
  projectId?: string;
  fileName: string;
  fileType: 'DWG' | 'DXF' | 'PDF' | 'STEP' | 'DOCX' | 'XLSX' | 'ZIP';
  fileSize: number;
  storagePath: string;
  revision: number;
  status: DocumentStatus;
  lockedBy?: string;
  uploadedBy: string;
}

export const timeEntryStatuses = ['draft', 'submitted', 'approved'] as const;
export type TimeEntryStatus = (typeof timeEntryStatuses)[number];

export interface TimeEntry {
  id: string;
  userId: string;
  projectId?: string;
  taskId?: string;
  description?: string;
  hours: number;
  billable: boolean;
  entryDate: string;
  status: TimeEntryStatus;
  startedAt?: string;
  endedAt?: string;
}

export const quoteStatuses = ['draft', 'sent', 'approved', 'rejected', 'converted'] as const;
export type QuoteStatus = (typeof quoteStatuses)[number];

export interface QuoteLineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  taxable: boolean;
}

export interface Quote {
  id: string;
  customerId?: string;
  projectId?: string;
  title: string;
  status: QuoteStatus;
  lineItems: QuoteLineItem[];
  subtotal: number;
  taxRate: number;
  taxTotal: number;
  total: number;
  converted: boolean;
  convertedInvoiceId?: string;
}

export const invoiceStatuses = ['draft', 'sent', 'paid', 'overdue', 'void'] as const;
export type InvoiceStatus = (typeof invoiceStatuses)[number];

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceAuditEvent {
  id: string;
  invoiceId: string;
  userId: string;
  action: string;
  timestamp: string;
}

export interface Invoice {
  id: string;
  customerId?: string;
  projectId?: string;
  quoteId?: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  dueDate?: string;
  paidAt?: string;
  auditLog: InvoiceAuditEvent[];
}
