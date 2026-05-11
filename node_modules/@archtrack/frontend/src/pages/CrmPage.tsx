import { AxiosError } from 'axios';
import { Building2, Plus, Search, StickyNote, Trash2, UserRoundPlus } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { customerApi } from '../features/operations/operations-api';
import { customerStatuses, type Customer, type CustomerStatus } from '../types/operations';

const statusLabels: Record<CustomerStatus, string> = { lead: 'Lead', active: 'Active', inactive: 'Inactive' };
const emptyCustomer = { companyName: '', email: '', phone: '', billingAddress: '', status: 'lead' as CustomerStatus };
const errorMessage = (error: unknown) =>
  error instanceof AxiosError ? error.response?.data?.message ?? 'Unable to update customers.' : 'Unable to update customers.';

export function CrmPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CustomerStatus | 'all'>('all');
  const [form, setForm] = useState(emptyCustomer);
  const [editingId, setEditingId] = useState<string>();
  const [contact, setContact] = useState({ name: '', email: '', phone: '', role: '' });
  const [note, setNote] = useState('');
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const next = await customerApi.list({ search, status });
      setCustomers(next);
      setSelectedId((current) => current ?? next[0]?.id);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void load(), 200);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  const selected = useMemo(() => customers.find((customer) => customer.id === selectedId), [customers, selectedId]);

  async function saveCustomer(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    try {
      if (editingId) await customerApi.update(editingId, form);
      else await customerApi.create(form);
      setForm(emptyCustomer);
      setEditingId(undefined);
      await load();
    } catch (saveError) {
      setError(errorMessage(saveError));
    }
  }

  function editCustomer(customer: Customer) {
    setEditingId(customer.id);
    setSelectedId(customer.id);
    setForm({
      companyName: customer.companyName,
      email: customer.email ?? '',
      phone: customer.phone ?? '',
      billingAddress: customer.billingAddress ?? '',
      status: customer.status,
    });
  }

  async function removeCustomer(customer: Customer) {
    try {
      await customerApi.delete(customer.id);
      setSelectedId(undefined);
      await load();
    } catch (deleteError) {
      setError(errorMessage(deleteError));
    }
  }

  async function addContact(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    const updated = await customerApi.addContact(selected.id, contact);
    setCustomers((current) => current.map((customer) => (customer.id === updated.id ? updated : customer)));
    setContact({ name: '', email: '', phone: '', role: '' });
  }

  async function addNote(event: FormEvent) {
    event.preventDefault();
    if (!selected || !note.trim()) return;
    const updated = await customerApi.addNote(selected.id, note);
    setCustomers((current) => current.map((customer) => (customer.id === updated.id ? updated : customer)));
    setNote('');
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.7fr_1.3fr]">
      <form className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900" onSubmit={saveCustomer}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink dark:text-white">{editingId ? 'Edit Customer' : 'Add Customer'}</h2>
          <Building2 className="text-action" size={22} />
        </div>
        <div className="mt-5 grid gap-4">
          <input className="rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-action dark:border-slate-700 dark:bg-slate-950 dark:text-white" placeholder="Company name" value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} required />
          <input className="rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-action dark:border-slate-700 dark:bg-slate-950 dark:text-white" placeholder="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <input className="rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-action dark:border-slate-700 dark:bg-slate-950 dark:text-white" placeholder="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          <textarea className="min-h-20 rounded-md border border-line bg-white px-3 py-2 text-ink outline-none focus:border-action dark:border-slate-700 dark:bg-slate-950 dark:text-white" placeholder="Billing address" value={form.billingAddress} onChange={(event) => setForm({ ...form, billingAddress: event.target.value })} />
          <select className="rounded-md border border-line bg-white px-3 py-2 text-ink dark:border-slate-700 dark:bg-slate-950 dark:text-white" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as CustomerStatus })}>
            {customerStatuses.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}
          </select>
        </div>
        {error ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</p> : null}
        <div className="mt-5 flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-md bg-action px-4 py-2 font-semibold text-white" type="submit"><Plus size={17} />Save</button>
          {editingId ? <button className="rounded-md border border-line px-4 py-2 text-steel dark:border-slate-700 dark:text-slate-300" type="button" onClick={() => { setEditingId(undefined); setForm(emptyCustomer); }}>Cancel</button> : null}
        </div>
      </form>

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="text-xl font-semibold text-ink dark:text-white">Customers</h2><p className="text-sm text-steel dark:text-slate-400">Manage customer records, contacts, and notes.</p></div>
          <div className="grid gap-2 sm:grid-cols-[1fr_150px]">
            <label className="flex items-center rounded-md border border-line px-3 dark:border-slate-700"><Search size={17} className="text-steel" /><input className="w-full bg-transparent px-2 py-2 text-sm outline-none" placeholder="Search CRM" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
            <select className="rounded-md border border-line bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={status} onChange={(event) => setStatus(event.target.value as CustomerStatus | 'all')}><option value="all">All status</option>{customerStatuses.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}</select>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead><tr className="border-b border-line text-xs uppercase text-steel dark:border-slate-800 dark:text-slate-400"><th className="py-3">Company</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Contact</th><th className="py-3 text-right">Actions</th></tr></thead>
              <tbody>{customers.map((customer) => (
                <tr key={customer.id} className={`border-b border-line last:border-b-0 dark:border-slate-800 ${selectedId === customer.id ? 'bg-field dark:bg-slate-800' : ''}`}>
                  <td className="py-3 font-medium text-ink dark:text-white"><button type="button" onClick={() => setSelectedId(customer.id)}>{customer.companyName}</button></td>
                  <td className="px-3 py-3"><span className="rounded-md bg-field px-2 py-1 text-xs text-steel dark:bg-slate-800 dark:text-slate-300">{statusLabels[customer.status]}</span></td>
                  <td className="px-3 py-3 text-steel dark:text-slate-300">{customer.email || customer.phone || 'No contact'}</td>
                  <td className="py-3"><div className="flex justify-end gap-2"><button className="rounded-md border border-line px-3 py-1.5 dark:border-slate-700" type="button" onClick={() => editCustomer(customer)}>Edit</button><button className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line dark:border-slate-700" type="button" onClick={() => void removeCustomer(customer)} aria-label={`Delete ${customer.companyName}`}><Trash2 size={15} /></button></div></td>
                </tr>
              ))}</tbody>
            </table>
            {isLoading ? <p className="py-6 text-center text-sm text-steel">Loading customers...</p> : null}
          </div>

          <aside className="rounded-lg border border-line p-4 dark:border-slate-800">
            <h3 className="font-semibold text-ink dark:text-white">{selected?.companyName ?? 'Select a customer'}</h3>
            {selected ? (
              <div className="mt-4 space-y-5">
                <form className="grid gap-2" onSubmit={addContact}><p className="flex items-center gap-2 text-sm font-medium"><UserRoundPlus size={16} />Contact</p><input className="rounded-md border border-line bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" placeholder="Name" value={contact.name} onChange={(event) => setContact({ ...contact, name: event.target.value })} required /><input className="rounded-md border border-line bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" placeholder="Email" type="email" value={contact.email} onChange={(event) => setContact({ ...contact, email: event.target.value })} required /><button className="rounded-md bg-action px-3 py-2 text-sm font-semibold text-white" type="submit">Add contact</button></form>
                <div className="space-y-2">{selected.contacts.map((item) => <p key={item.id} className="rounded-md bg-field p-2 text-sm dark:bg-slate-800">{item.name} · {item.email}</p>)}</div>
                <form className="grid gap-2" onSubmit={addNote}><p className="flex items-center gap-2 text-sm font-medium"><StickyNote size={16} />Note</p><textarea className="min-h-20 rounded-md border border-line bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={note} onChange={(event) => setNote(event.target.value)} required /><button className="rounded-md bg-action px-3 py-2 text-sm font-semibold text-white" type="submit">Add note</button></form>
                <div className="space-y-2">{selected.notes.map((item) => <p key={item.id} className="rounded-md bg-field p-2 text-sm dark:bg-slate-800">{item.body}</p>)}</div>
              </div>
            ) : <p className="mt-2 text-sm text-steel dark:text-slate-400">Choose a row to manage details.</p>}
          </aside>
        </div>
      </section>
    </div>
  );
}
