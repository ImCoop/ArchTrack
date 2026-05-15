import { Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { activityApi } from '../features/activity/activity-api';
import { activityEntityTypes, type ActivityEntityType, type ActivityLog } from '../types/activity';

const labels: Record<ActivityEntityType, string> = {
  customer: 'Customers',
  project: 'Projects',
  task: 'Tasks',
  document: 'Documents',
  time_entry: 'Time',
  quote: 'Quotes',
  invoice: 'Invoices',
  system: 'System',
};

export function ActivityPage() {
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState<ActivityEntityType | 'all'>('all');

  const load = useCallback(async () => {
    setActivity(await activityApi.list({ entityType, search }));
  }, [entityType, search]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void load(), 200);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink dark:text-white">Activity Log</h2>
          <p className="text-sm text-steel dark:text-slate-400">Searchable audit trail across customers, projects, files, tasks, quotes, invoices, and time.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_180px]">
          <label className="flex items-center rounded-md border border-line px-3 dark:border-slate-700">
            <Search className="text-steel dark:text-slate-400" size={17} />
            <input className="w-full bg-transparent px-2 py-2 text-sm outline-none" placeholder="Search activity" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <select className="rounded-md border border-line bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={entityType} onChange={(event) => setEntityType(event.target.value as ActivityEntityType | 'all')}>
            <option value="all">All modules</option>
            {activityEntityTypes.map((type) => (
              <option key={type} value={type}>
                {labels[type]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {activity.map((entry) => (
          <article key={entry.id} className="rounded-lg border border-line px-4 py-4 dark:border-slate-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-medium text-ink dark:text-white">{entry.summary}</p>
                <p className="mt-1 text-sm text-steel dark:text-slate-400">
                  {entry.actorUserId ? `Actor ${entry.actorUserId}` : 'System'} | {entry.action.replace(/_/g, ' ')}
                </p>
              </div>
              <div className="text-right">
                <span className="rounded-md bg-field px-2 py-1 text-xs uppercase text-steel dark:bg-slate-800 dark:text-slate-300">{entry.entityType.replace('_', ' ')}</span>
                <p className="mt-2 text-xs text-steel dark:text-slate-400">{new Date(entry.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </article>
        ))}
        {!activity.length ? <p className="py-10 text-center text-sm text-steel dark:text-slate-400">No activity matched those filters.</p> : null}
      </div>
    </section>
  );
}
