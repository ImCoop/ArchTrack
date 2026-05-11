import { apiClient } from '../../api/client';
import type { DocumentStatus, Invoice, InvoiceStatus, ProjectDocument, Quote, QuoteStatus, TimeEntry, TimeEntryStatus } from '../../types/business';

async function downloadPdf(path: string, fallbackFilename: string) {
  const response = await apiClient.get(path, { responseType: 'blob' });
  const blobUrl = window.URL.createObjectURL(response.data);
  const link = window.document.createElement('a');
  const disposition = response.headers['content-disposition'];
  const filenameMatch = typeof disposition === 'string' ? disposition.match(/filename="([^"]+)"/) : null;

  link.href = blobUrl;
  link.download = filenameMatch?.[1] ?? fallbackFilename;
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export const documentApi = {
  async list(filters: { search?: string; status?: DocumentStatus | 'all'; projectId?: string }) {
    const { data } = await apiClient.get<{ documents: ProjectDocument[] }>('/documents', {
      params: { search: filters.search || undefined, status: filters.status === 'all' ? undefined : filters.status, projectId: filters.projectId || undefined },
    });
    return data.documents;
  },
  async create(input: { projectId?: string; fileName: string; fileType: ProjectDocument['fileType']; fileSize: number; status: DocumentStatus }) {
    const { data } = await apiClient.post<{ document: ProjectDocument }>('/documents', input);
    return data.document;
  },
  async update(id: string, input: Partial<ProjectDocument>) {
    const { data } = await apiClient.patch<{ document: ProjectDocument }>(`/documents/${id}`, input);
    return data.document;
  },
  async revise(id: string, input: { fileName: string; fileType: ProjectDocument['fileType']; fileSize: number }) {
    const { data } = await apiClient.post<{ document: ProjectDocument }>(`/documents/${id}/revisions`, input);
    return data.document;
  },
  async delete(id: string) {
    await apiClient.delete(`/documents/${id}`);
  },
};

export const timeApi = {
  async list(filters: { status?: TimeEntryStatus | 'all'; projectId?: string }) {
    const { data } = await apiClient.get<{ timeEntries: TimeEntry[] }>('/time-entries', {
      params: { status: filters.status === 'all' ? undefined : filters.status, projectId: filters.projectId || undefined },
    });
    return data.timeEntries;
  },
  async create(input: { projectId?: string; taskId?: string; description?: string; hours: number; billable: boolean; entryDate: string; status: TimeEntryStatus }) {
    const { data } = await apiClient.post<{ timeEntry: TimeEntry }>('/time-entries', input);
    return data.timeEntry;
  },
  async startTimer(input: { projectId?: string; taskId?: string; description?: string; billable: boolean }) {
    const { data } = await apiClient.post<{ timeEntry: TimeEntry }>('/time-entries/timer', input);
    return data.timeEntry;
  },
  async stopTimer(id: string) {
    const { data } = await apiClient.post<{ timeEntry: TimeEntry }>(`/time-entries/${id}/stop`);
    return data.timeEntry;
  },
};

export const quoteApi = {
  async list(filters: { status?: QuoteStatus | 'all' }) {
    const { data } = await apiClient.get<{ quotes: Quote[] }>('/quotes', {
      params: { status: filters.status === 'all' ? undefined : filters.status },
    });
    return data.quotes;
  },
  async create(input: { customerId?: string; projectId?: string; title: string; status: QuoteStatus; taxRate: number; lineItems: Array<{ description: string; quantity: number; rate: number; taxable: boolean }> }) {
    const { data } = await apiClient.post<{ quote: Quote }>('/quotes', input);
    return data.quote;
  },
  async update(id: string, input: Partial<Quote>) {
    const { data } = await apiClient.patch<{ quote: Quote }>(`/quotes/${id}`, input);
    return data.quote;
  },
  async convertToInvoice(id: string) {
    const { data } = await apiClient.post<{ invoice: Invoice; invoiceId: string }>(`/quotes/${id}/convert-to-invoice`);
    return data.invoice;
  },
  async downloadPdf(id: string) {
    await downloadPdf(`/quotes/${id}/pdf`, `quote-${id}.pdf`);
  },
};

export const invoiceApi = {
  async list(filters: { status?: InvoiceStatus | 'all' }) {
    const { data } = await apiClient.get<{ invoices: Invoice[] }>('/invoices', {
      params: { status: filters.status === 'all' ? undefined : filters.status },
    });
    return data.invoices;
  },
  async create(input: { customerId?: string; projectId?: string; quoteId?: string; status: InvoiceStatus; issueDate?: string; lineItems?: Array<{ description: string; quantity: number; unitPrice: number }>; taxRate: number; discountAmount?: number; dueDate?: string }) {
    const { data } = await apiClient.post<{ invoice: Invoice }>('/invoices', input);
    return data.invoice;
  },
  async update(id: string, input: Partial<Invoice>) {
    const { data } = await apiClient.patch<{ invoice: Invoice }>(`/invoices/${id}`, input);
    return data.invoice;
  },
  async send(id: string) {
    const { data } = await apiClient.post<{ invoice: Invoice }>(`/invoices/${id}/send`);
    return data.invoice;
  },
  async markPaid(id: string) {
    const { data } = await apiClient.post<{ invoice: Invoice }>(`/invoices/${id}/mark-paid`);
    return data.invoice;
  },
  async markOverdue(id: string) {
    const { data } = await apiClient.post<{ invoice: Invoice }>(`/invoices/${id}/mark-overdue`);
    return data.invoice;
  },
  async downloadPdf(id: string) {
    await downloadPdf(`/invoices/${id}/pdf`, `invoice-${id}.pdf`);
  },
};
