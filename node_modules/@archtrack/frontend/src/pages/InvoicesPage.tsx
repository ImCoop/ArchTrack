import { Download, FileText, Plus, Send, SquareCheckBig, TriangleAlert, X } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { invoiceApi, quoteApi } from '../features/business/business-api';
import { customerApi, projectApi } from '../features/operations/operations-api';
import { invoiceStatuses, type Invoice, type InvoiceLineItem, type InvoiceStatus, type Quote } from '../types/business';
import type { Customer, Project } from '../types/operations';

const labels: Record<InvoiceStatus, string> = { draft: 'Draft', sent: 'Sent', paid: 'Paid', overdue: 'Overdue', void: 'Void' };
const today = new Date();
const defaultDueDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30).toISOString().slice(0, 10);
type DraftLine = Pick<InvoiceLineItem, 'description' | 'quantity' | 'unitPrice'>;
const emptyLine = { description: 'Drafting labor', quantity: 1, unitPrice: 125 };

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState({ customerId: '', projectId: '', quoteId: '', taxRate: 0.0825, discountAmount: 0, dueDate: defaultDueDate });
  const [lines, setLines] = useState<DraftLine[]>([emptyLine]);
  const [status, setStatus] = useState<InvoiceStatus | 'all'>('all');
  const selectedQuote = useMemo(() => quotes.find((quote) => quote.id === form.quoteId), [form.quoteId, quotes]);
  const availableProjects = useMemo(
    () => projects.filter((project) => !form.customerId || project.customerId === form.customerId),
    [form.customerId, projects],
  );
  const effectiveLines = selectedQuote
    ? selectedQuote.lineItems.map((line) => ({ description: line.description, quantity: line.quantity, unitPrice: line.rate }))
    : lines;
  const subtotal = useMemo(() => effectiveLines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0), [effectiveLines]);
  const taxAmount = useMemo(() => Math.max(subtotal - form.discountAmount, 0) * form.taxRate, [form.discountAmount, form.taxRate, subtotal]);
  const previewTotal = subtotal - form.discountAmount + taxAmount;
  const load = useCallback(async () => {
    const [nextInvoices, nextQuotes, nextCustomers, nextProjects] = await Promise.all([
      invoiceApi.list({ status }),
      quoteApi.list({ status: 'all' }),
      customerApi.list({ status: 'all' }),
      projectApi.list({ status: 'all' }),
    ]);

    setInvoices(nextInvoices);
    setQuotes(nextQuotes);
    setCustomers(nextCustomers);
    setProjects(nextProjects);
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  function updateLine(index: number, patch: Partial<DraftLine>) {
    setLines((current) => current.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line)));
  }

  const customerName = (id?: string) => customers.find((customer) => customer.id === id)?.companyName ?? 'No customer linked';
  const projectName = (id?: string) => projects.find((project) => project.id === id)?.projectName ?? 'No project linked';

  async function save(event: FormEvent) {
    event.preventDefault();
    await invoiceApi.create({
      customerId: form.customerId || undefined,
      projectId: form.projectId || undefined,
      quoteId: form.quoteId || undefined,
      status: 'draft',
      lineItems: selectedQuote ? undefined : lines,
      taxRate: form.taxRate,
      discountAmount: form.discountAmount,
      dueDate: form.dueDate || undefined,
    });
    setForm({ customerId: '', projectId: '', quoteId: '', taxRate: 0.0825, discountAmount: 0, dueDate: defaultDueDate });
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
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink dark:text-white">Invoice Editor</h2>
          <FileText className="text-action" size={22} />
        </div>
        <div className="mt-5 grid gap-4">
          <label className="grid gap-1 text-sm font-medium text-ink dark:text-slate-200">
            Quote
            <select
              className="rounded-md border border-line bg-white px-3 py-2 font-normal dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              value={form.quoteId}
              onChange={(event) => {
                const quoteId = event.target.value;
                const quote = quotes.find((item) => item.id === quoteId);
                setForm({
                  ...form,
                  quoteId,
                  customerId: quote?.customerId ?? form.customerId,
                  projectId: quote?.projectId ?? form.projectId,
                  taxRate: quote?.taxRate ?? form.taxRate,
                });
              }}
            >
              <option value="">Build manually</option>
              {quotes.filter((quote) => !quote.converted).map((quote) => (
                <option key={quote.id} value={quote.id}>
                  {quote.title}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium text-ink dark:text-slate-200">
              Customer
              <select
                className="rounded-md border border-line bg-white px-3 py-2 font-normal dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                value={form.customerId}
                onChange={(event) => setForm({ ...form, customerId: event.target.value, projectId: '' })}
              >
                <option value="">No customer linked</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.companyName}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-ink dark:text-slate-200">
              Project
              <select
                className="rounded-md border border-line bg-white px-3 py-2 font-normal dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                value={form.projectId}
                onChange={(event) => {
                  const projectId = event.target.value;
                  const project = projects.find((item) => item.id === projectId);
                  setForm({ ...form, projectId, customerId: project?.customerId ?? form.customerId });
                }}
              >
                <option value="">No project linked</option>
                {availableProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.projectName}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {selectedQuote ? <p className="rounded-md bg-field px-3 py-2 text-sm text-steel dark:bg-slate-800 dark:text-slate-300">This invoice is pulling line items from the selected quote.</p> : null}
          <div className="grid gap-2">
            {effectiveLines.map((line, index) => (
              <div className="grid gap-2 rounded-md border border-line p-3 dark:border-slate-800 md:grid-cols-[1fr_90px_110px_36px]" key={`${line.description}-${index}`}>
                <input className="rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" disabled={Boolean(selectedQuote)} placeholder="Description" value={line.description} onChange={(event) => updateLine(index, { description: event.target.value })} />
                <label className="grid gap-1 text-sm font-medium text-ink dark:text-slate-200">
                  Quantity
                  <input className="rounded-md border border-line bg-white px-3 py-2 font-normal dark:border-slate-700 dark:bg-slate-950 dark:text-white" disabled={Boolean(selectedQuote)} min={0.01} step={0.25} type="number" value={line.quantity} onChange={(event) => updateLine(index, { quantity: Number(event.target.value) })} />
                </label>
                <label className="grid gap-1 text-sm font-medium text-ink dark:text-slate-200">
                  Unit price
                  <input className="rounded-md border border-line bg-white px-3 py-2 font-normal dark:border-slate-700 dark:bg-slate-950 dark:text-white" disabled={Boolean(selectedQuote)} min={0} step={0.01} type="number" value={line.unitPrice} onChange={(event) => updateLine(index, { unitPrice: Number(event.target.value) })} />
                </label>
                <button className="inline-flex h-10 w-10 items-center justify-center self-end rounded-md border border-line dark:border-slate-700 disabled:opacity-40" type="button" disabled={Boolean(selectedQuote) || effectiveLines.length === 1} onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))} aria-label="Remove line">
                  <X size={16} />
                </button>
              </div>
            ))}
            {!selectedQuote ? (
              <button className="inline-flex w-fit items-center gap-2 rounded-md border border-line px-3 py-2 text-sm dark:border-slate-700" type="button" onClick={() => setLines((current) => [...current, emptyLine])}>
                <Plus size={16} />
                Add line
              </button>
            ) : null}
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
          <div className="rounded-md bg-field p-3 text-sm dark:bg-slate-800">
            <p>Subtotal: ${subtotal.toFixed(2)}</p>
            <p>Tax: ${taxAmount.toFixed(2)}</p>
            <p className="mt-1 font-semibold">Total: ${previewTotal.toFixed(2)}</p>
          </div>
        </div>
        <button className="mt-5 inline-flex items-center gap-2 rounded-md bg-action px-4 py-2 font-semibold text-white" type="submit">
          <Plus size={17} />
          Save draft
        </button>
      </form>

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-ink dark:text-white">Invoices</h2>
            <p className="text-sm text-steel dark:text-slate-400">Server-numbered invoices with audit-ready status actions.</p>
          </div>
          <select className="rounded-md border border-line bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={status} onChange={(event) => setStatus(event.target.value as InvoiceStatus | 'all')}>
            <option value="all">All status</option>
            {invoiceStatuses.map((item) => (
              <option key={item} value={item}>
                {labels[item]}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-5 grid gap-3">
          {invoices.map((invoice) => (
            <article className="rounded-lg border border-line p-4 dark:border-slate-800" key={invoice.id}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="font-semibold text-ink dark:text-white">{invoice.invoiceNumber}</h3>
                  <p className="mt-1 text-sm text-steel dark:text-slate-400">
                    {customerName(invoice.customerId)} | {projectName(invoice.projectId)}
                  </p>
                  <p className="mt-1 text-sm text-steel dark:text-slate-400">
                    Due {invoice.dueDate ?? 'open'} | {invoice.lineItems.length} line item
                  </p>
                  <p className="mt-2 text-xs text-steel dark:text-slate-400">Last event: {invoice.auditLog.at(-1)?.action ?? 'Created'}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <span className="rounded-md bg-field px-2 py-1 text-xs text-steel dark:bg-slate-800 dark:text-slate-300">{labels[invoice.status]}</span>
                  <p className="font-semibold">${invoice.total.toFixed(2)}</p>
                  <button className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 text-sm dark:border-slate-700" type="button" onClick={() => void downloadPdf(invoice)}>
                    <Download size={14} />
                    PDF
                  </button>
                  <button className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 text-sm dark:border-slate-700 disabled:opacity-50" type="button" disabled={invoice.status !== 'draft'} onClick={() => void action(invoice, 'send')}>
                    <Send size={14} />
                    Send
                  </button>
                  <button className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 text-sm dark:border-slate-700 disabled:opacity-50" type="button" disabled={invoice.status !== 'sent' && invoice.status !== 'overdue'} onClick={() => void action(invoice, 'paid')}>
                    <SquareCheckBig size={14} />
                    Paid
                  </button>
                  <button className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 text-sm dark:border-slate-700 disabled:opacity-50" type="button" disabled={invoice.status !== 'sent'} onClick={() => void action(invoice, 'overdue')}>
                    <TriangleAlert size={14} />
                    Overdue
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
