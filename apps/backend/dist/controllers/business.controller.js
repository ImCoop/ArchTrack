import { documentService, invoiceService, quoteService, timeService } from '../services/business.service.js';
import { convertQuoteToInvoice } from '../services/convertQuoteToInvoice.js';
import { renderTextPdf } from '../services/pdf/pdfEngine.js';
import { invoicePdfLines, quotePdfLines } from '../services/pdf/templates/invoiceTemplate.js';
import { documentSchema, invoiceSchema, listDocumentsSchema, listInvoicesSchema, listQuotesSchema, listTimeEntriesSchema, quoteSchema, timeEntrySchema, timerSchema, updateDocumentSchema, } from '../utils/business.schemas.js';
const param = (request, name) => {
    const value = request.params[name];
    return Array.isArray(value) ? value[0] : value;
};
export const documentController = {
    async list(request, response) {
        response.json({ documents: await documentService.list(listDocumentsSchema.parse(request.query)) });
    },
    async create(request, response) {
        response.status(201).json({ document: await documentService.create(documentSchema.parse(request.body), request.user) });
    },
    async update(request, response) {
        response.json({ document: await documentService.update(param(request, 'id'), updateDocumentSchema.parse(request.body), request.user) });
    },
    async revise(request, response) {
        response.status(201).json({ document: await documentService.revise(param(request, 'id'), documentSchema.pick({ fileName: true, fileType: true, fileSize: true }).parse(request.body), request.user) });
    },
    async delete(request, response) {
        await documentService.delete(param(request, 'id'), request.user);
        response.status(204).send();
    },
    async download(request, response) {
        const { document, absolutePath } = await documentService.download(param(request, 'id'));
        response.download(absolutePath, document.fileName);
    },
};
export const timeController = {
    async list(request, response) {
        response.json({ timeEntries: await timeService.list(listTimeEntriesSchema.parse(request.query)) });
    },
    async create(request, response) {
        response.status(201).json({ timeEntry: await timeService.create(timeEntrySchema.parse(request.body), request.user) });
    },
    async update(request, response) {
        response.json({ timeEntry: await timeService.update(param(request, 'id'), timeEntrySchema.partial().parse(request.body), request.user) });
    },
    async startTimer(request, response) {
        response.status(201).json({ timeEntry: await timeService.startTimer(timerSchema.parse(request.body), request.user) });
    },
    async stopTimer(request, response) {
        response.json({ timeEntry: await timeService.stopTimer(param(request, 'id'), request.user) });
    },
    async delete(request, response) {
        await timeService.delete(param(request, 'id'), request.user);
        response.status(204).send();
    },
};
export const quoteController = {
    async list(request, response) {
        response.json({ quotes: await quoteService.list(listQuotesSchema.parse(request.query)) });
    },
    async get(request, response) {
        response.json({ quote: await quoteService.get(param(request, 'id')) });
    },
    async create(request, response) {
        response.status(201).json({ quote: await quoteService.create(quoteSchema.parse(request.body), request.user) });
    },
    async update(request, response) {
        response.json({ quote: await quoteService.update(param(request, 'id'), quoteSchema.partial().parse(request.body), request.user) });
    },
    async delete(request, response) {
        await quoteService.delete(param(request, 'id'), request.user);
        response.status(204).send();
    },
    async convertToInvoice(request, response) {
        const invoice = await convertQuoteToInvoice(param(request, 'id'), request.user);
        response.status(201).json({ invoice, invoiceId: invoice.id });
    },
    async pdf(request, response) {
        const quote = await quoteService.get(param(request, 'id'));
        const buffer = renderTextPdf(`Quote ${quote.title}`, quotePdfLines(quote));
        response.setHeader('Content-Type', 'application/pdf');
        response.setHeader('Content-Disposition', `attachment; filename="quote-${quote.id}.pdf"`);
        response.send(buffer);
    },
};
export const invoiceController = {
    async list(request, response) {
        response.json({ invoices: await invoiceService.list(listInvoicesSchema.parse(request.query)) });
    },
    async get(request, response) {
        response.json({ invoice: await invoiceService.get(param(request, 'id')) });
    },
    async create(request, response) {
        response.status(201).json({ invoice: await invoiceService.create(invoiceSchema.parse(request.body), request.user) });
    },
    async update(request, response) {
        response.json({ invoice: await invoiceService.update(param(request, 'id'), invoiceSchema.partial().parse(request.body), request.user) });
    },
    async delete(request, response) {
        await invoiceService.delete(param(request, 'id'), request.user);
        response.status(204).send();
    },
    async send(request, response) {
        response.json({ invoice: await invoiceService.transition(param(request, 'id'), 'sent', request.user) });
    },
    async markPaid(request, response) {
        response.json({ invoice: await invoiceService.transition(param(request, 'id'), 'paid', request.user) });
    },
    async markOverdue(request, response) {
        response.json({ invoice: await invoiceService.transition(param(request, 'id'), 'overdue', request.user) });
    },
    async void(request, response) {
        response.json({ invoice: await invoiceService.transition(param(request, 'id'), 'void', request.user) });
    },
    async pdf(request, response) {
        const invoice = await invoiceService.get(param(request, 'id'));
        const buffer = renderTextPdf(`Invoice ${invoice.invoiceNumber}`, invoicePdfLines(invoice));
        response.setHeader('Content-Type', 'application/pdf');
        response.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
        response.send(buffer);
    },
};
