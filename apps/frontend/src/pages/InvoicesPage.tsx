import { Download, FileText, Plus, Send, SquareCheckBig, TriangleAlert, X } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { invoiceApi } from '../features/business/business-api';
import { invoiceStatuses, type Invoice, type InvoiceLineItem, type InvoiceStatus } from '../types/business';

const labels: Record<InvoiceStatus, string> = { draft: 'Draft', sent: 'Sent', paid: 'Paid', overdue: 'Overdue', void: 'Void' };
const today = new Date();
const defaultDueDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30).toISOString().slice(0, 10);
type DraftLine = Pick<InvoiceLineItem, 'description' | 'quantity' | 'unitPrice'>;
const emptyLine = { description: 'Drafting labor', quantity: 1, unitPrice: 125 };

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [form, setForm] = useState({ customerId: '', projectId: '', quoteId: '', taxRate: 0.0825, discountAmount: 0, dueDate: defaultDueDate });
  const [lines, setLines] = useState<DraftLine[]>([emptyLine]);
  const [status, setStatus] = useState<InvoiceStatus | 'all'>('all');
  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0), [lines]);
  const taxAmount = useMemo(() => Math.max(subtotal - form.discountAmount, 0) * form.taxRate, [form.discountAmount, form.taxRate, subtotal]);
  const previewTotal = subtotal - form.discountAmount + taxAmount;
  const load = useCallback(async () => setInvoices(await invoiceApi.list({ status })), [status]);

  useEffect(() => {
    void load();
  }, [load]);

  function updateLine(index: number, patch: Partial<DraftLine>) {
    setLines((current) => current.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line)));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    await invoiceApi.create({
      customerId: form.customerId || undefined,
      projectId: form.projectId || undefined,
      quoteId: form.quoteId || undefined,
      status: 'draft',
      lineItems: form.quoteId ? undefined : lines,
      taxRate: form.taxRate,
      discountAmount: form.discountAmount,
      dueDate: form.dueDate || undefined,
    });
    setLines([emptyLine]);
    await load();
  }

  async function action(invoice: Invoice, kind: 'send' | 'paid' | 'overdue') {
    if (kind === 'send') await invoiceApi.send(invoice.id);
    if (kind === 'paid') await invoiceApi.markPaid(invoice.id);
    if (kind === 'overdue') await invoiceApi.markOverdue(invoice.id);
    await load();
  }

  async function downloadPdf(invoice: Invoice) {
    await invoiceApi.downloadPdf(invoice.id);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <form className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900" onSubmit={save}>
        <div className="flex items-center justify-between"><h2 className="text-xl font-semibold text-ink dark:text-white">Invoice Editor</h2><FileText className="text-action" size={22} /></div>
        <div className="mt-5 grid gap-4">
          <div className="grid grid-cols-2 gap-3"><input className="rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Customer ID" value={form.customerId} onChange={(event) => setForm({ ...form, customerId: event.target.value })} /><input className="rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Project ID" value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })} /></div>
          <input className="rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Quote ID, optional" value={form.quoteId} onChange={(event) => setForm({ ...form, quoteId: event.target.value })} />
          <div className="grid gap-2">
            {lines.map((line, index) => (
              <div className="grid gap-2 rounded-md border border-line p-3 dark:border-slate-800 md:grid-cols-[1fr_90px_110px_36px]" key={`${line.description}-${index}`}>
                <input className="rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Description" value={line.description} onChange={(event) => updateLine(index, { description: event.target.value })} />
                <label className="grid gap-1 text-sm font-medium text-ink dark:text-slate-200">
                  Quantity
                  <input className="rounded-md border border-line bg-white px-3 py-2 font-normal dark:border-slate-700 dark:bg-slate-950 dark:text-white" min={0.01} step={0.25} type="number" value={line.quantity} onChange={(event) => updateLine(index, { quantity: Number(event.target.value) })} />
                </label>
                <label className="grid gap-1 text-sm font-medium text-ink dark:text-slate-200">
                  Unit price
                  <input className="rounded-md border border-line bg-white px-3 py-2 font-normal dark:border-slate-700 dark:bg-slate-950 dark:text-white" min={0} step={0.01} type="number" value={line.unitPrice} onChange={(event) => updateLine(index, { unitPrice: Number(event.target.value) })} />
                </label>
                <button className="inline-flex h-10 w-10 items-center justify-center self-end rounded-md border border-line dark:border-slate-700" type="button" onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))} aria-label="Remove line"><X size={16} /></button>
              </div>
            ))}
            <button className="inline-flex w-fit items-center gap-2 rounded-md border border-line px-3 py-2 text-sm dark:border-slate-700" type="button" onClick={() => setLines((current) => [...current, emptyLine])}><Plus size={16} />Add line</button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className="grid gap-1 text-sm font-medium text-ink dark:text-slate-200">
              Tax rate
              <input className="rounded-md border border-line bg-white px-3 py-2 font-normal dark:border-slate-700 dark:bg-slate-950 dark:text-white" min={0} max={1} step={0.0001} type="number" value={form.taxRate} onChange={(event) => setForm({ ...form, taxRate: Number(event.target.value) })} />
            </label>
            <label className="grid gap-1 text-sm font-medium text-ink dark:text-slate-200">
              Discount
              <input className="rounded-md border border-line bg-white px-3 py-2 font-normal dark:border-slate-700 dark:bg-slate-950 dark:text-white" min={0} step={0.01} type="number" value={form.discountAmount} onChange={(event) => setForm({ ...form, discountAmount: Number(event.target.value) })} />
            </label>
            <label className="grid gap-1 text-sm font-medium text-ink dark:text-slate-200">
              Due date
              <input className="rounded-md border border-line bg-white px-3 py-2 font-normal dark:border-slate-700 dark:bg-slate-950 dark:text-white" type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
            </label>
          </div>
          <div className="rounded-md bg-field p-3 text-sm dark:bg-slate-800"><p>Subtotal: ${subtotal.toFixed(2)}</p><p>Tax: ${taxAmount.toFixed(2)}</p><p className="mt-1 font-semibold">Total: ${previewTotal.toFixed(2)}</p></div>
        </div>
        <button className="mt-5 inline-flex items-center gap-2 rounded-md bg-action px-4 py-2 font-semibold text-white" type="submit"><Plus size={17} />Save draft</button>
      </form>

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-semibold text-ink dark:text-white">Invoices</h2><p className="text-sm text-steel dark:text-slate-400">Server-numbered invoices with audit-ready status actions.</p></div><select className="rounded-md border border-line bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={status} onChange={(event) => setStatus(event.target.value as InvoiceStatus | 'all')}><option value="all">All status</option>{invoiceStatuses.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select></div>
        <div className="mt-5 grid gap-3">{invoices.map((invoice) => <article className="rounded-lg border border-line p-4 dark:border-slate-800" key={invoice.id}><div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div><h3 className="font-semibold text-ink dark:text-white">{invoice.invoiceNumber}</h3><p className="mt-1 text-sm text-steel dark:text-slate-400">Due {invoice.dueDate ?? 'open'} · {invoice.lineItems.length} line item</p><p className="mt-2 text-xs text-steel dark:text-slate-400">Last event: {invoice.auditLog.at(-1)?.action ?? 'Created'}</p></div><div className="flex flex-wrap items-center gap-2 lg:justify-end"><span className="rounded-md bg-field px-2 py-1 text-xs text-steel dark:bg-slate-800 dark:text-slate-300">{labels[invoice.status]}</span><p className="font-semibold">${invoice.total.toFixed(2)}</p><button className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 text-sm dark:border-slate-700" type="button" onClick={() => void downloadPdf(invoice)}><Download size={14} />PDF</button><button className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 text-sm dark:border-slate-700 disabled:opacity-50" type="button" disabled={invoice.status !== 'draft'} onClick={() => void action(invoice, 'send')}><Send size={14} />Send</button><button className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 text-sm dark:border-slate-700 disabled:opacity-50" type="button" disabled={invoice.status !== 'sent' && invoice.status !== 'overdue'} onClick={() => void action(invoice, 'paid')}><SquareCheckBig size={14} />Paid</button><button className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 text-sm dark:border-slate-700 disabled:opacity-50" type="button" disabled={invoice.status !== 'sent'} onClick={() => void action(invoice, 'overdue')}><TriangleAlert size={14} />Overdue</button></div></div></article>)}</div>
      </section>
    </div>
  );
}
