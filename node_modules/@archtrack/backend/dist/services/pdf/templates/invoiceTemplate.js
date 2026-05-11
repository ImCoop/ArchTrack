import { baseDocumentLines, currency } from './baseTemplate.js';
export const invoicePdfLines = (invoice) => baseDocumentLines(`Invoice ${invoice.invoiceNumber}`, [
    `Status: ${invoice.status.toUpperCase()}`,
    `Issue date: ${invoice.issueDate}`,
    `Due date: ${invoice.dueDate ?? 'Open'}`,
    `Customer: ${invoice.customerId ?? 'Unassigned'}`,
    `Project: ${invoice.projectId ?? 'Unassigned'}`,
    '',
    'Line items',
    ...invoice.lineItems.map((item) => `${item.description} | ${item.quantity} x ${currency(item.unitPrice)} = ${currency(item.total)}`),
    '',
    `Subtotal: ${currency(invoice.subtotal)}`,
    `Discount: ${currency(invoice.discountAmount)}`,
    `Tax: ${currency(invoice.taxAmount)}`,
    `Total: ${currency(invoice.total)}`,
]);
export const quotePdfLines = (quote) => baseDocumentLines(`Quote ${quote.title}`, [
    `Status: ${quote.status.toUpperCase()}`,
    `Customer: ${quote.customerId ?? 'Unassigned'}`,
    `Project: ${quote.projectId ?? 'Unassigned'}`,
    '',
    'Line items',
    ...quote.lineItems.map((item) => `${item.description} | ${item.quantity} x ${currency(item.rate)} = ${currency(item.quantity * item.rate)}`),
    '',
    `Subtotal: ${currency(quote.subtotal)}`,
    `Tax: ${currency(quote.taxTotal)}`,
    `Total: ${currency(quote.total)}`,
]);
