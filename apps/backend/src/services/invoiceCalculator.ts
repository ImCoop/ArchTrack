import crypto from 'node:crypto';

import type { InvoiceLineItem } from '../types/business.js';

const money = (value: number) => Math.round(value * 100) / 100;

export interface InvoiceCalculationInput {
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  taxRate: number;
  discountAmount?: number;
}

export const calculateInvoiceTotals = (input: InvoiceCalculationInput) => {
  const lineItems: InvoiceLineItem[] = input.lineItems.map((item) => ({
    id: crypto.randomUUID(),
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    total: money(item.quantity * item.unitPrice),
  }));
  const subtotal = money(lineItems.reduce((sum, item) => sum + item.total, 0));
  const discountAmount = money(input.discountAmount ?? 0);
  const taxableAmount = Math.max(subtotal - discountAmount, 0);
  const taxAmount = money(taxableAmount * input.taxRate);

  return {
    lineItems,
    subtotal,
    discountAmount,
    taxAmount,
    total: money(taxableAmount + taxAmount),
  };
};
