import { businessRepository } from '../repositories/business.repository.js';
import { HttpError } from '../utils/http-error.js';
import { invoiceService } from './business.service.js';
export const convertQuoteToInvoice = async (quoteId, user) => {
    const quote = await businessRepository.findQuoteById(quoteId);
    if (!quote) {
        throw new HttpError(404, 'Quote not found.');
    }
    if (quote.converted || quote.convertedInvoiceId) {
        throw new HttpError(409, 'Quote has already been converted to an invoice.');
    }
    const invoice = await invoiceService.create({
        customerId: quote.customerId,
        projectId: quote.projectId,
        quoteId: quote.id,
        status: 'draft',
        taxRate: quote.taxRate,
        discountAmount: 0,
        lineItems: quote.lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.rate,
        })),
    }, user, 'converted from quote');
    await businessRepository.updateQuote(quote.id, {
        status: 'converted',
        converted: true,
        convertedInvoiceId: invoice.id,
    });
    await businessRepository.appendInvoiceAudit(invoice.id, {
        userId: user.id,
        action: `converted quote ${quote.id}`,
    });
    return invoice;
};
