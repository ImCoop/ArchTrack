import { Clock, Play, Plus, Square } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { timeApi } from '../features/business/business-api';
import { timeEntryStatuses, type TimeEntry, type TimeEntryStatus } from '../types/business';

const labels: Record<TimeEntryStatus, string> = { draft: 'Draft', submitted: 'Submitted', approved: 'Approved' };
const today = new Date().toISOString().slice(0, 10);
const emptyForm = { projectId: '', taskId: '', description: '', hours: 1, billable: true, entryDate: today, status: 'draft' as TimeEntryStatus };

export function TimeTrackingPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState<TimeEntryStatus | 'all'>('all');

  const load = useCallback(async () => setEntries(await timeApi.list({ status })), [status]);
  const totalHours = useMemo(() => entries.reduce((sum, entry) => sum + entry.hours, 0), [entries]);
  const billableHours = useMemo(() => entries.filter((entry) => entry.billable).reduce((sum, entry) => sum + entry.hours, 0), [entries]);
  const running = entries.find((entry) => entry.startedAt && !entry.endedAt);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(event: FormEvent) {
    event.preventDefault();
    await timeApi.create({ ...form, projectId: form.projectId || undefined, taskId: form.taskId || undefined });
    setForm(emptyForm);
    await load();
  }

  async function startTimer() {
    await timeApi.startTimer({ projectId: form.projectId || undefined, taskId: form.taskId || undefined, description: form.description || undefined, billable: form.billable });
    await load();
  }

  async function stopTimer() {
    if (!running) return;
    await timeApi.stopTimer(running.id);
    await load();
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.65fr_1.35fr]">
      <form className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900" onSubmit={save}>
        <div className="flex items-center justify-between"><h2 className="text-xl font-semibold text-ink dark:text-white">Time Entry</h2><Clock className="text-action" size={22} /></div>
        <div className="mt-5 grid gap-4">
          <input className="rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Project ID" value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })} />
          <input className="rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Task ID" value={form.taskId} onChange={(event) => setForm({ ...form, taskId: event.target.value })} />
          <textarea className="min-h-20 rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Work performed" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <div className="grid grid-cols-2 gap-3"><input className="rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" min={0} step={0.25} type="number" value={form.hours} onChange={(event) => setForm({ ...form, hours: Number(event.target.value) })} /><input className="rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" type="date" value={form.entryDate} onChange={(event) => setForm({ ...form, entryDate: event.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm text-steel dark:text-slate-300"><input checked={form.billable} type="checkbox" onChange={(event) => setForm({ ...form, billable: event.target.checked })} />Billable</label>
          <select className="rounded-md border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as TimeEntryStatus })}>{timeEntryStatuses.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select>
        </div>
        <div className="mt-5 flex flex-wrap gap-2"><button className="inline-flex items-center gap-2 rounded-md bg-action px-4 py-2 font-semibold text-white" type="submit"><Plus size={17} />Add time</button><button className="inline-flex items-center gap-2 rounded-md border border-line px-4 py-2 dark:border-slate-700" onClick={() => void (running ? stopTimer() : startTimer())} type="button">{running ? <Square size={17} /> : <Play size={17} />}{running ? 'Stop timer' : 'Start timer'}</button></div>
      </form>

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="text-xl font-semibold text-ink dark:text-white">Time Ledger</h2><p className="text-sm text-steel dark:text-slate-400">{totalHours.toFixed(2)} hours tracked, {billableHours.toFixed(2)} billable.</p></div>
          <select className="rounded-md border border-line bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={status} onChange={(event) => setStatus(event.target.value as TimeEntryStatus | 'all')}><option value="all">All status</option>{timeEntryStatuses.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select>
        </div>
        <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead><tr className="border-b border-line text-xs uppercase text-steel dark:border-slate-800"><th className="py-3">Date</th><th className="px-3 py-3">Description</th><th className="px-3 py-3">Hours</th><th className="px-3 py-3">Billable</th><th className="py-3">Status</th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.id} className="border-b border-line last:border-b-0 dark:border-slate-800"><td className="py-3">{entry.entryDate}</td><td className="px-3 py-3 font-medium text-ink dark:text-white">{entry.description || 'Timer entry'}</td><td className="px-3 py-3">{entry.startedAt && !entry.endedAt ? 'Running' : entry.hours.toFixed(2)}</td><td className="px-3 py-3">{entry.billable ? 'Yes' : 'No'}</td><td className="py-3"><span className="rounded-md bg-field px-2 py-1 text-xs text-steel dark:bg-slate-800 dark:text-slate-300">{labels[entry.status]}</span></td></tr>)}</tbody></table></div>
      </section>
    </div>
  );
}
