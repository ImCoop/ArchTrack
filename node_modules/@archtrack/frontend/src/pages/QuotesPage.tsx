import { Calculator, Download, FileInput, Plus } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { quoteApi } from '../features/business/business-api';
import { customerApi, projectApi } from '../features/operations/operations-api';
import { quoteStatuses, type Quote, type QuoteStatus } from '../types/business';
import type { Customer, Project } from '../types/operations';

const labels: Record<QuoteStatus, string> = { draft: 'Draft', sent: 'Sent', approved: 'Approved', rejected: 'Rejected', converted: 'Converted' };

export function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState({
    customerId: '',
    projectId: '',
    title: '',
    status: 'draft' as QuoteStatus,
    taxRate: 0.0825,
    description: 'Drafting labor',
    quantity: 1,
    rate: 125,
    taxable: true,
  });
  const [status, setStatus] = useState<QuoteStatus | 'all'>('all');
  const previewTotal = useMemo(() => form.quantity * form.rate * (1 + (form.taxable ? form.taxRate : 0)), [form]);
  const availableProjects = useMemo(
    () => projects.filter((project) => !form.customerId || project.customerId === form.customerId),
    [form.customerId, projects],
  );
  const load = useCallback(async () => {
    const [nextQuotes, nextCustomers, nextProjects] = await Promise.all([
      quoteApi.list({ status }),
      customerApi.list({ status: 'all' }),
      projectApi.list({ status: 'all' }),
    ]);

    setQuotes(nextQuotes);
    setCustomers(nextCustomers);
    setProjects(nextProjects);
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const customerName = (id?: string) => customers.find((customer) => customer.id === id)?.companyName ?? 'No customer linked';
  const projectName = (id?: string) => projects.find((project) => project.id === id)?.projectName ?? 'No project linked';

  async function save(event: FormEvent) {
    event.preventDefault();
    await quoteApi.create({
      customerId: form.customerId || undefined,
      projectId: form.projectId || undefined,
      title: form.title,
      status: form.status,
      taxRate: form.taxRate,
      lineItems: [{ description: form.description, quantity: form.quantity, rate: form.rate, taxable: form.taxable }],
    });
    setForm((current) => ({ ...current, title: '', projectId: '', description: 'Drafting labor', quantity: 1, rate: 125 }));
    await load();
  }

  async function convert(quote: Quote) {
    if (!window.confirm(`Convert "${quote.title}" to an invoice?`)) return;
    await quoteApi.convertToInvoice(quote.id);
    await load();
  }

  async function downloadPdf(quote: Quote) {
    await quoteApi.downloadPdf(quote.id);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.7fr_1.3fr]">
      <form className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900" onSubmit={save}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink dark:text-white">Quote Builder</h2>
          <Calculator className="text-action" size={22} />
        </div>
        <div className="mt-5 grid gap-4">
          <input className="rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Quote title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium text-ink dark:text-slate-200">
              Customer
              <select
                className="rounded-md border border-line bg-white px-3 py-2 font-normal dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                value={form.customerId}
                onChange={(event) => {
                  const nextCustomerId = event.target.value;
                  const nextProject = availableProjects.find((project) => project.id === form.projectId && project.customerId === nextCustomerId);
                  setForm({ ...form, customerId: nextCustomerId, projectId: nextProject?.id ?? '' });
                }}
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
          <input className="rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Line item" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <div className="grid grid-cols-3 gap-3">
            <label className="grid gap-1 text-sm font-medium text-ink dark:text-slate-200">
              Quantity
              <input className="rounded-md border border-line bg-white px-3 py-2 font-normal dark:border-slate-700 dark:bg-slate-950 dark:text-white" min={0.01} step={0.25} type="number" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })} />
            </label>
            <label className="grid gap-1 text-sm font-medium text-ink dark:text-slate-200">
              Rate
              <input className="rounded-md border border-line bg-white px-3 py-2 font-normal dark:border-slate-700 dark:bg-slate-950 dark:text-white" min={0} step={0.01} type="number" value={form.rate} onChange={(event) => setForm({ ...form, rate: Number(event.target.value) })} />
            </label>
            <label className="grid gap-1 text-sm font-medium text-ink dark:text-slate-200">
              Tax rate
              <input className="rounded-md border border-line bg-white px-3 py-2 font-normal dark:border-slate-700 dark:bg-slate-950 dark:text-white" min={0} max={1} step={0.0001} type="number" value={form.taxRate} onChange={(event) => setForm({ ...form, taxRate: Number(event.target.value) })} />
            </label>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-steel dark:text-slate-300">
            <input checked={form.taxable} className="h-4 w-4 rounded border-line" onChange={(event) => setForm({ ...form, taxable: event.target.checked })} type="checkbox" />
            Taxable line item
          </label>
          <select className="rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as QuoteStatus })}>
            {quoteStatuses.filter((item) => item !== 'converted').map((item) => (
              <option key={item} value={item}>
                {labels[item]}
              </option>
            ))}
          </select>
          <p className="rounded-md bg-field px-3 py-2 text-sm font-semibold dark:bg-slate-800">Preview total: ${previewTotal.toFixed(2)}</p>
        </div>
        <button className="mt-5 inline-flex items-center gap-2 rounded-md bg-action px-4 py-2 font-semibold text-white" type="submit">
          <Plus size={17} />
          Create quote
        </button>
      </form>
      <section className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-ink dark:text-white">Quotes</h2>
            <p className="text-sm text-steel dark:text-slate-400">Convert approved quotes into locked draft invoices.</p>
          </div>
          <select className="rounded-md border border-line bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={status} onChange={(event) => setStatus(event.target.value as QuoteStatus | 'all')}>
            <option value="all">All status</option>
            {quoteStatuses.map((item) => (
              <option key={item} value={item}>
                {labels[item]}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-5 grid gap-3">
          {quotes.map((quote) => (
            <article key={quote.id} className="rounded-lg border border-line p-4 dark:border-slate-800">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="font-semibold text-ink dark:text-white">{quote.title}</h3>
                  <p className="mt-1 text-sm text-steel dark:text-slate-400">
                    {customerName(quote.customerId)} | {projectName(quote.projectId)}
                  </p>
                  <p className="mt-1 text-sm text-steel dark:text-slate-400">
                    {quote.lineItems.length} line item | Tax ${quote.taxTotal.toFixed(2)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <span className="rounded-md bg-field px-2 py-1 text-xs text-steel dark:bg-slate-800 dark:text-slate-300">{labels[quote.status]}</span>
                  <p className="font-semibold">${quote.total.toFixed(2)}</p>
                  <button className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 text-sm dark:border-slate-700" type="button" onClick={() => void downloadPdf(quote)}>
                    <Download size={14} />
                    PDF
                  </button>
                  <button className="inline-flex items-center gap-1 rounded-md bg-action px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50" type="button" disabled={quote.converted} onClick={() => void convert(quote)}>
                    <FileInput size={14} />
                    Convert
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
